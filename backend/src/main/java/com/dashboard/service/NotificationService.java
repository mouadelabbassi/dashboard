package com.dashboard.service;

import com.dashboard.dto.response.NotificationResponse;
import com.dashboard.entity.Notification;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository. NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. Pageable;
import org.springframework. stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public List<NotificationResponse> getAllNotifications() {
        return notificationRepository.findByTargetUserIsNullOrderByCreatedAtDesc()
                .stream()
                .map(NotificationResponse::fromEntity)
                .toList();
    }

    public Page<NotificationResponse> getAllNotificationsPaged(Pageable pageable) {
        return notificationRepository.findByTargetUserIsNullOrderByCreatedAtDesc(pageable)
                .map(NotificationResponse::fromEntity);
    }

    public List<NotificationResponse> getUnreadNotifications() {
        return notificationRepository.findByTargetUserIsNullAndIsReadFalseOrderByCreatedAtDesc()
                .stream()
                .map(NotificationResponse::fromEntity)
                . toList();
    }

    public Long getUnreadCount() {
        return notificationRepository.countByTargetUserIsNullAndIsReadFalse();
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));

        notification.markAsRead();
        notification = notificationRepository. save(notification);

        log. info("Notification marked as read: {}", notificationId);

        return NotificationResponse. fromEntity(notification);
    }

    @Transactional
    public void markAllAsRead() {
        notificationRepository.markAllAsReadForAdmins();
        log.info("All notifications marked as read");
    }

    @Transactional
    public void deleteNotification(Long notificationId) {
        if (! notificationRepository.existsById(notificationId)) {
            throw new ResourceNotFoundException("Notification not found: " + notificationId);
        }
        notificationRepository.deleteById(notificationId);
        log.info("Notification deleted: {}", notificationId);
    }
}