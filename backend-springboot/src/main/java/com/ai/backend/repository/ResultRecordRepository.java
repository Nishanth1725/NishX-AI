package com.ai.backend.repository;

import com.ai.backend.model.ResultRecord;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ResultRecordRepository extends JpaRepository<ResultRecord, Long> {
    Optional<ResultRecord> findTopByPredictionIdOrderByCreatedAtDesc(Long predictionId);
}
