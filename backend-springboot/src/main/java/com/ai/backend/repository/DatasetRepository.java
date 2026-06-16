package com.ai.backend.repository;

import com.ai.backend.model.Dataset;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DatasetRepository extends JpaRepository<Dataset, Long> {
    List<Dataset> findByUserIdOrderByCreatedAtDesc(Long userId);
}
