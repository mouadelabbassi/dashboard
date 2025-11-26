package com.dashboard.dto.response;

import com.dashboard.entity.Notification;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok. NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String typeDescription;
    private String title;
    private String message;
    private Long referenceId;
    private String referenceType;
    private String buyerName;
    private String buyerEmail;
    private String orderTotal;
    private Integer itemsCount;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification. getType(). name())
                . typeDescription(notification. getType().getDescription())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .buyerName(notification.getBuyerName())
                . buyerEmail(notification.getBuyerEmail())
                .orderTotal(notification.getOrderTotal())
                .itemsCount(notification.getItemsCount())
                . isRead(notification. getIsRead())
                .readAt(notification.getReadAt())
                .createdAt(notification. getCreatedAt())
                .build();
    }
}