package com.dashboard.repository;

import com. dashboard.entity. Notification;
import org.springframework.data. domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data. jpa.repository. JpaRepository;
import org.springframework. data.jpa. repository. Modifying;
import org. springframework.data.jpa.repository.Query;
import org. springframework.data.repository.query.Param;
import org. springframework.stereotype.Repository;

import java. util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // Find all notifications for admins (targetUser is null)
    List<Notification> findByTargetUserIsNullOrderByCreatedAtDesc();

    Page<Notification> findByTargetUserIsNullOrderByCreatedAtDesc(Pageable pageable);

    // Find unread notifications for admins
    List<Notification> findByTargetUserIsNullAndIsReadFalseOrderByCreatedAtDesc();

    // Count unread notifications for admins
    Long countByTargetUserIsNullAndIsReadFalse();

    // Find by type
    List<Notification> findByTypeOrderByCreatedAtDesc(Notification.NotificationType type);

    // Mark all as read for admins
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = CURRENT_TIMESTAMP WHERE n.targetUser IS NULL AND n.isRead = false")
    void markAllAsReadForAdmins();

    // Find notifications by reference
    List<Notification> findByReferenceTypeAndReferenceId(String referenceType, Long referenceId);

    // Delete old read notifications (older than 30 days)
    @Modifying
    @Query("DELETE FROM Notification n WHERE n.isRead = true AND n.createdAt < :cutoffDate")
    void deleteOldReadNotifications(@Param("cutoffDate") java.time.LocalDateTime cutoffDate);
}