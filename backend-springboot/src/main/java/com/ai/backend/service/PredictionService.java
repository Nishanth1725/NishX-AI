package com.ai.backend.service;

import com.ai.backend.model.Dataset;
import com.ai.backend.model.Prediction;
import com.ai.backend.model.ResultRecord;
import com.ai.backend.repository.PredictionRepository;
import com.ai.backend.repository.ResultRecordRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PredictionService {

    private final PredictionRepository predictionRepository;
    private final ResultRecordRepository resultRecordRepository;
    private final DatasetService datasetService;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${python.engine.url}")
    private String pythonEngineUrl;

    public PredictionService(
        PredictionRepository predictionRepository,
        ResultRecordRepository resultRecordRepository,
        DatasetService datasetService,
        RestTemplate restTemplate,
        ObjectMapper objectMapper
    ) {
        this.predictionRepository = predictionRepository;
        this.resultRecordRepository = resultRecordRepository;
        this.datasetService = datasetService;
        this.restTemplate = restTemplate;
        this.objectMapper = objectMapper;
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
        if (dataset.getStoragePath() != null) {
            requestPayload.put("storage_path", dataset.getStoragePath());
        }

        Map<String, Object> body;
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                pythonEngineUrl + "/predict",
                Objects.requireNonNull(HttpMethod.POST),
                new HttpEntity<>(requestPayload),
                new ParameterizedTypeReference<Map<String, Object>>() {}
            );

            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                prediction.setStatus("FAILED");
                predictionRepository.save(prediction);
                throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Prediction engine failed");
            }
            body = response.getBody();
        } catch (ResourceAccessException ex) {
            prediction.setStatus("FAILED");
            predictionRepository.save(prediction);
            throw new ResponseStatusException(
                HttpStatus.GATEWAY_TIMEOUT,
                "Prediction engine unavailable. Ensure the Python service is running."
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            prediction.setStatus("FAILED");
            predictionRepository.save(prediction);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Prediction engine error");
        }
        if (body == null) {
            prediction.setStatus("FAILED");
            predictionRepository.save(prediction);
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
