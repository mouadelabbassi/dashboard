package com.dashboard.repository;

import com.dashboard.entity.PredictionNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionNotificationRepository extends JpaRepository<PredictionNotification, Long> {

    List<PredictionNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PredictionNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    long countByUserIdAndIsReadFalse(Long userId);
}