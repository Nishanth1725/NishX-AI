package com.ai.backend.repository;

import com.ai.backend.model.Prediction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PredictionRepository extends JpaRepository<Prediction, Long> {
    List<Prediction> findByDatasetIdOrderByCreatedAtDesc(Long datasetId);
}
