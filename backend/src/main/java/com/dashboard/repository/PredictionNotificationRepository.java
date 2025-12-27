package com.dashboard.repository;

import com.dashboard.entity.PredictionNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PredictionNotificationRepository extends JpaRepository<PredictionNotification, Long> {

    // Find by user
    List<PredictionNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<PredictionNotification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(Long userId);

    // Count unread
    long countByUserIdAndIsReadFalse(Long userId);

    // Find by type
    List<PredictionNotification> findByUserIdAndNotificationTypeOrderByCreatedAtDesc(
            Long userId, PredictionNotification.NotificationType type);

    // Find by product
    List<PredictionNotification> findByProductIdOrderByCreatedAtDesc(String productId);

    // Find recent
    List<PredictionNotification> findTop10ByUserIdOrderByCreatedAtDesc(Long userId);
}