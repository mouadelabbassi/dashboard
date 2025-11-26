package com.dashboard.service;

import com.dashboard.dto.response.NotificationResponse;
import com.dashboard.entity.Notification;
import com.dashboard.entity.Order;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional
    public void createOrderNotification(Order order) {
        log.info("Creating notification for order {}", order.getId());

        String title = "New Order Received";
        String message = String.format("New order #%d from %s (%s) - Total: $%.2f",
                order.getId(),
                order.getUser().getFullName(),
                order.getUser().getEmail(),
                order.getTotalAmount());

        Notification notification = Notification.builder()
                .title(title)
                .message(message)
                .type(Notification.NotificationType.ORDER)
                .orderId(order.getId())
                .userId(order.getUser().getId())
                .isRead(false)
                .build();

        notificationRepository.save(notification);
        log.info("Notification created for order {}", order.getId());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getAllNotifications() {
        log.info("Fetching all notifications");
        List<Notification> notifications = notificationRepository.findAllByOrderByCreatedAtDesc();
        return notifications.stream()
                .map(this::mapToNotificationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getUnreadNotifications() {
        log.info("Fetching unread notifications");
        List<Notification> notifications = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        return notifications.stream()
                .map(this::mapToNotificationResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        return notificationRepository.countByIsReadFalse();
    }

    @Transactional
    public NotificationResponse markAsRead(Long notificationId) {
        log.info("Marking notification {} as read", notificationId);
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + notificationId));

        notification.setIsRead(true);
        Notification savedNotification = notificationRepository.save(notification);

        return mapToNotificationResponse(savedNotification);
    }

    @Transactional
    public void markAllAsRead() {
        log.info("Marking all notifications as read");
        List<Notification> unreadNotifications = notificationRepository.findByIsReadFalseOrderByCreatedAtDesc();
        unreadNotifications.forEach(notification -> notification.setIsRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    private NotificationResponse mapToNotificationResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .type(notification.getType().name())
                .isRead(notification.getIsRead())
                .orderId(notification.getOrderId())
                .userId(notification.getUserId())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
