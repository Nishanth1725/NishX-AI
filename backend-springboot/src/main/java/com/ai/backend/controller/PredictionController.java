package com.ai.backend.controller;

import com.ai.backend.model.Prediction;
import com.ai.backend.security.UserPrincipal;
import com.ai.backend.service.PredictionService;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/predictions")
public class PredictionController {

    private final PredictionService predictionService;

    public PredictionController(PredictionService predictionService) {
        this.predictionService = predictionService;
    }

    @PostMapping("/run")
    public Map<String, Object> run(
        @AuthenticationPrincipal UserPrincipal principal,
        @RequestParam Long datasetId
    ) {
        return predictionService.runPrediction(datasetId, principal.getId());
    }

    @GetMapping("/dataset/{datasetId}")
    public List<Prediction> byDataset(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long datasetId
    ) {
        return predictionService.listByDatasetForUser(datasetId, principal.getId());
    }

    @GetMapping("/{predictionId}/result")
    public Map<String, Object> latestResult(
        @AuthenticationPrincipal UserPrincipal principal,
        @PathVariable Long predictionId
    ) {
        return predictionService.latestResult(predictionId, principal.getId());
    }
}
