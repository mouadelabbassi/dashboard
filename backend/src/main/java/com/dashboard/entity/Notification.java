package com. dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate. annotations.CreationTimestamp;

import java.time. LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_user", columnList = "user_id"),
        @Index(name = "idx_notification_read", columnList = "is_read"),
        @Index(name = "idx_notification_type", columnList = "type")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType. IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User targetUser; // null = for all admins

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "reference_id")
    private Long referenceId; // e.g., order ID

    @Column(name = "reference_type", length = 50)
    private String referenceType; // e. g., "ORDER"

    // Buyer info for purchase notifications
    @Column(name = "buyer_name", length = 255)
    private String buyerName;

    @Column(name = "buyer_email", length = 255)
    private String buyerEmail;

    @Column(name = "order_total", length = 50)
    private String orderTotal;

    @Column(name = "items_count")
    private Integer itemsCount;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        NEW_ORDER("Nouvelle commande"),
        ORDER_CONFIRMED("Commande confirmée"),
        ORDER_CANCELLED("Commande annulée"),
        NEW_USER("Nouvel utilisateur"),
        SYSTEM("Système");

        private final String description;

        NotificationType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}