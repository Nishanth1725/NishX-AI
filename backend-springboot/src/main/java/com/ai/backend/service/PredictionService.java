package com.ai.backend.service;

import com.ai.backend.model.Dataset;
import com.ai.backend.model.Prediction;
import com.ai.backend.model.ResultRecord;
import com.ai.backend.repository.PredictionRepository;
import com.ai.backend.repository.ResultRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PredictionService {

    private static final Logger log = LoggerFactory.getLogger(PredictionService.class);

    private final PredictionRepository predictionRepository;
    private final ResultRecordRepository resultRecordRepository;
    private final DatasetService datasetService;
    private final FileStorageService fileStorageService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${python.engine.url}")
    private String pythonEngineUrl;

    public PredictionService(
        PredictionRepository predictionRepository,
        ResultRecordRepository resultRecordRepository,
        DatasetService datasetService,
        FileStorageService fileStorageService,
        RestTemplate restTemplate,
        ObjectMapper objectMapper
    ) {
        this.predictionRepository = predictionRepository;
        this.resultRecordRepository = resultRecordRepository;
        this.datasetService = datasetService;
        this.fileStorageService = fileStorageService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void normalizePythonEngineUrl() {
        pythonEngineUrl = pythonEngineUrl == null ? "" : pythonEngineUrl.trim();
        while (pythonEngineUrl.endsWith("/")) {
            pythonEngineUrl = pythonEngineUrl.substring(0, pythonEngineUrl.length() - 1);
        }
        if (!pythonEngineUrl.isEmpty() && !pythonEngineUrl.startsWith("http://") && !pythonEngineUrl.startsWith("https://")) {
            pythonEngineUrl = "https://" + pythonEngineUrl;
        }
        log.info("Python engine URL configured as {}", pythonEngineUrl);
    }

    public Map<String, Object> runPrediction(Long datasetId, Long userId) {
        Dataset dataset = datasetService.getByIdForUser(datasetId, userId);
        Prediction prediction = new Prediction();
        prediction.setDatasetId(datasetId);
        prediction.setModelName("random_forest_regressor");
        prediction.setStatus("STARTED");
        prediction = predictionRepository.save(prediction);

        Map<String, Object> summary = parseJson(dataset.getSummaryJson());
        Map<String, Object> requestPayload = new HashMap<>();
        requestPayload.put("dataset_id", datasetId);
        requestPayload.put("summary", summary);
        requestPayload.put("file_name", dataset.getFileName());

        if (dataset.getStoragePath() != null) {
            requestPayload.put("storage_path", dataset.getStoragePath());
            try {
                byte[] fileBytes = fileStorageService.read(dataset.getStoragePath());
                requestPayload.put("file_content_base64", Base64.getEncoder().encodeToString(fileBytes));
                log.info(
                    "Attached dataset file to prediction payload: datasetId={}, fileName={}, bytes={}",
                    datasetId,
                    dataset.getFileName(),
                    fileBytes.length
                );
            } catch (ResponseStatusException ex) {
                log.warn(
                    "Could not read dataset file for datasetId={}, path={}: {}",
                    datasetId,
                    dataset.getStoragePath(),
                    ex.getReason()
                );
            }
        }

        String predictUrl = pythonEngineUrl + "/predict";
        log.info("Calling Python engine: POST {}", predictUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestPayload, headers);

        Map<String, Object> body;
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                predictUrl,
                Objects.requireNonNull(HttpMethod.POST),
                entity,
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                markFailed(prediction);
                throw new ResponseStatusException(
                    HttpStatus.BAD_GATEWAY,
                    "Prediction engine failed with status " + response.getStatusCode()
                );
            }
            body = response.getBody();
            log.info("Python engine responded successfully for datasetId={}", datasetId);
        } catch (ResourceAccessException ex) {
            markFailed(prediction);
            log.error("Python engine connection failed for datasetId={}: {}", datasetId, ex.getMessage(), ex);
            throw new ResponseStatusException(
                HttpStatus.GATEWAY_TIMEOUT,
                "Prediction engine unavailable: " + ex.getMessage()
            );
        } catch (HttpStatusCodeException ex) {
            markFailed(prediction);
            String responseBody = ex.getResponseBodyAsString();
            log.error(
                "Python engine HTTP error for datasetId={}: status={} body={}",
                datasetId,
                ex.getStatusCode(),
                responseBody,
                ex
            );
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Prediction engine error (" + ex.getStatusCode().value() + "): " + responseBody
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            markFailed(prediction);
            log.error("Unexpected prediction failure for datasetId={}", datasetId, ex);
            throw new ResponseStatusException(
                HttpStatus.BAD_GATEWAY,
                "Prediction engine error: " + ex.getMessage()
            );
        }

        if (body == null) {
            markFailed(prediction);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Prediction engine returned empty body");
        }

        prediction.setStatus("COMPLETED");
        prediction.setMetricsJson(writeJson(body.get("metrics")));
        predictionRepository.save(prediction);

        ResultRecord resultRecord = new ResultRecord();
        resultRecord.setPredictionId(prediction.getId());
        resultRecord.setResultJson(writeJson(body));
        resultRecordRepository.save(resultRecord);

        Map<String, Object> result = new HashMap<>();
        result.put("predictionId", prediction.getId());
        result.put("datasetId", datasetId);
        result.put("result", body);
        return result;
    }

    public List<Prediction> listByDataset(Long datasetId) {
        return predictionRepository.findByDatasetIdOrderByCreatedAtDesc(datasetId);
    }

    public List<Prediction> listByDatasetForUser(Long datasetId, Long userId) {
        datasetService.getByIdForUser(datasetId, userId);
        return listByDataset(datasetId);
    }

    public Map<String, Object> latestResult(Long predictionId, Long userId) {
        predictionId = Objects.requireNonNull(predictionId, "predictionId");
        userId = Objects.requireNonNull(userId, "userId");

        Prediction prediction = predictionRepository.findById(predictionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prediction not found"));
        Long datasetId = Objects.requireNonNull(prediction.getDatasetId(), "datasetId");
        datasetService.getByIdForUser(datasetId, userId);

        ResultRecord result = resultRecordRepository.findTopByPredictionIdOrderByCreatedAtDesc(predictionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Result not found"));
        return parseJson(result.getResultJson());
    }

    private void markFailed(Prediction prediction) {
        prediction.setStatus("FAILED");
        predictionRepository.save(prediction);
    }

    private Map<String, Object> parseJson(String source) {
        try {
            return objectMapper.readValue(source, new TypeReference<>() {});
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid JSON payload");
        }
    }

    private String writeJson(Object source) {
        try {
            return objectMapper.writeValueAsString(source);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not serialize JSON");
        }
    }
}
