package com.dashboard. repository;

import com.dashboard.entity. Notification;
import com.dashboard.entity. User;
import org.springframework.data. domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data. jpa.repository. JpaRepository;
import org.springframework. data.jpa. repository. Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query. Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByRecipientOrderByCreatedAtDesc(User recipient, Pageable pageable);

    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);

    Page<Notification> findByRecipientAndTypeOrderByCreatedAtDesc(
            User recipient,
            Notification.NotificationType type,
            Pageable pageable
    );

    Long countByRecipientAndIsReadFalse(User recipient);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.recipient = :recipient AND n.isRead = false")
    int markAllAsReadByRecipient(@Param("recipient") User recipient, @Param("readAt") LocalDateTime readAt);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt WHERE n.id IN :ids AND n.recipient = :recipient")
    int markAsReadByIds(@Param("ids") List<Long> ids, @Param("recipient") User recipient, @Param("readAt") LocalDateTime readAt);

    @Query("SELECT n FROM Notification n WHERE n. recipient. id = :recipientId ORDER BY n.createdAt DESC")
    List<Notification> findLatestByRecipientId(@Param("recipientId") Long recipientId, Pageable pageable);

    void deleteByRecipientAndCreatedAtBefore(User recipient, LocalDateTime before);
}