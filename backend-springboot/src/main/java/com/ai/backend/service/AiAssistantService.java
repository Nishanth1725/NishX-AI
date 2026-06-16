package com.ai.backend.service;

import com.ai.backend.dto.AiChatDtos.ChatRequest;
import com.ai.backend.model.ChatHistory;
import com.ai.backend.model.Dataset;
import com.ai.backend.repository.ChatHistoryRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AiAssistantService {

    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);

    private final DatasetService datasetService;
    private final PredictionService predictionService;
    private final ChatHistoryRepository chatHistoryRepository;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${ai.provider.url}")
    private String aiProviderUrl;

    @Value("${ai.provider.model}")
    private String aiProviderModel;

    @Value("${ai.provider.key}")
    private String aiProviderKey;

    public AiAssistantService(
        DatasetService datasetService,
        PredictionService predictionService,
        ChatHistoryRepository chatHistoryRepository,
        RestTemplate restTemplate,
        ObjectMapper objectMapper
    ) {
        this.datasetService = datasetService;
        this.predictionService = predictionService;
        this.chatHistoryRepository = chatHistoryRepository;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    public List<ChatHistory> getHistory(Long userId) {
        return chatHistoryRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public String chat(Long userId, ChatRequest request) {
        String context = buildContext(userId, request.datasetId());
        String response = aiProviderKey == null || aiProviderKey.isBlank()
            ? "AI provider key is not configured. Set the AI_PROVIDER_KEY environment variable on the backend. Context preview: " + context
            : callExternalAi(request.message(), context);

        ChatHistory history = new ChatHistory();
        history.setUserId(userId);
        history.setDatasetId(request.datasetId());
        history.setMessage(request.message());
        history.setResponse(response);
        chatHistoryRepository.save(history);
        return response;
    }

    private String buildContext(Long userId, Long datasetId) {
        if (datasetId == null) {
            return "No dataset selected.";
        }
        Dataset dataset = datasetService.getByIdForUser(datasetId, userId);
        List<Map<String, Object>> predictions = predictionService
            .listByDatasetForUser(datasetId, userId)
            .stream()
            .map(pred -> Map.<String, Object>of(
                "predictionId", pred.getId(),
                "status", pred.getStatus(),
                "metrics", pred.getMetricsJson() == null ? "{}" : pred.getMetricsJson()
            ))
            .toList();

        Map<String, Object> context = new HashMap<>();
        context.put("dataset", Map.of(
            "id", dataset.getId(),
            "fileName", dataset.getFileName(),
            "rowCount", dataset.getRowCount(),
            "columnCount", dataset.getColumnCount(),
            "summary", dataset.getSummaryJson()
        ));
        context.put("predictions", predictions);

        try {
            return objectMapper.writeValueAsString(context);
        } catch (Exception ex) {
            log.warn("Could not serialize AI context for dataset {}", datasetId, ex);
            return "Could not build context.";
        }
    }

    private String callExternalAi(String userMessage, String context) {
        if (aiProviderUrl == null || aiProviderUrl.isBlank()) {
            return "AI provider URL is not configured. Set the AI_PROVIDER_URL environment variable on the backend.";
        }
        String url = java.util.Objects.requireNonNull(aiProviderUrl);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        String apiKey = aiProviderKey;
        if (apiKey != null && !apiKey.isBlank()) {
            headers.setBearerAuth(apiKey);
        } else {
            log.warn("AI provider key is not set when preparing request to {}", url);
        }
        headers.set("HTTP-Referer", "https://nexusai-analytics.app");
        headers.set("X-Title", "NexusAI Analytics");

        Map<String, Object> payload = new HashMap<>();
        payload.put("model", aiProviderModel);
        payload.put("messages", List.of(
            Map.of(
                "role", "system",
                "content",
                "You are Nexus AI, an analytics assistant. Answer clearly using markdown when helpful. "
                    + "Use dataset context and prediction details. Be concise but thorough."
            ),
            Map.of("role", "system", "content", "Context: " + context),
            Map.of("role", "user", "content", userMessage)
        ));

        try {
            HttpMethod httpMethod = java.util.Objects.requireNonNull(HttpMethod.POST);
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                url,
                httpMethod,
                new HttpEntity<>(payload, headers),
                new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {}
            );
            return extractAiContent(response.getBody());
        } catch (HttpClientErrorException ex) {
            log.warn("AI provider client error: status={} body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return mapClientError(ex);
        } catch (HttpServerErrorException ex) {
            log.error("AI provider server error: status={}", ex.getStatusCode(), ex);
            return "The AI service is temporarily unavailable. Please try again in a few moments.";
        } catch (ResourceAccessException ex) {
            log.error("AI provider connection failed", ex);
            throw new ResponseStatusException(
                HttpStatus.GATEWAY_TIMEOUT,
                "Could not reach the AI provider. Check your network connection and try again."
            );
        } catch (Exception ex) {
            log.error("Unexpected AI provider error", ex);
            return "An unexpected error occurred while generating a response. Please try again.";
        }
    }

    private String mapClientError(HttpClientErrorException ex) {
        String body = ex.getResponseBodyAsString();
        String providerMessage = extractProviderErrorMessage(body);

        if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
            return "Invalid AI provider API key. Verify AI_PROVIDER_KEY is correct.";
        }
        if (ex.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
            return "AI rate limit reached. Please wait a moment and try again.";
        }
        if (ex.getStatusCode() == HttpStatus.PAYMENT_REQUIRED || ex.getStatusCode().value() == 402) {
            return "AI provider quota exceeded. Add credits to your OpenRouter account.";
        }
        if (ex.getStatusCode() == HttpStatus.BAD_REQUEST) {
            return providerMessage != null
                ? "AI request rejected: " + providerMessage
                : "The AI provider rejected the request. Check model configuration.";
        }
        return providerMessage != null
            ? "AI provider error: " + providerMessage
            : "The AI provider returned an error. Please try again.";
    }

    private String extractProviderErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            Map<String, Object> parsed = objectMapper.readValue(body, new TypeReference<>() {});
            Object errorObj = parsed.get("error");
            if (errorObj instanceof Map<?, ?> errorMap) {
                Object message = errorMap.get("message");
                if (message != null) {
                    return String.valueOf(message);
                }
            }
        } catch (Exception ignored) {
            /* fall through */
        }
        return null;
    }

    private String extractAiContent(Map<String, Object> body) {
        if (body == null || body.get("choices") == null) {
            return "AI provider returned an empty response.";
        }
        Object choicesObj = body.get("choices");
        List<Map<String, Object>> choices;
        try {
            choices = objectMapper.convertValue(choicesObj, new TypeReference<List<Map<String, Object>>>() {});
        } catch (IllegalArgumentException ex) {
            return "AI provider returned invalid choices.";
        }
        if (choices == null || choices.isEmpty()) {
            return "AI provider did not return any choices.";
        }
        Map<String, Object> first = choices.get(0);
        Map<String, Object> message;
        try {
            Object msgObj = first.get("message");
            if (msgObj == null) {
                return "AI provider message missing.";
            }
            message = objectMapper.convertValue(msgObj, new TypeReference<Map<String, Object>>() {});
        } catch (IllegalArgumentException ex) {
            return "AI provider returned invalid message format.";
        }
        Object content = message == null ? null : message.get("content");
        if (content == null || String.valueOf(content).isBlank()) {
            return "AI provider returned an empty message.";
        }
        return String.valueOf(content);
    }
}
