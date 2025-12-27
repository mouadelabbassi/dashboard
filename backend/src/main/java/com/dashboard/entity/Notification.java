package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
        @Index(name = "idx_notification_recipient", columnList = "recipient_id"),
        @Index(name = "idx_notification_read", columnList = "is_read"),
        @Index(name = "idx_notification_type", columnList = "type"),
        @Index(name = "idx_notification_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private NotificationType type;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "reference_id")
    private String referenceId;

    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @Column(name = "action_url", length = 500)
    private String actionUrl;

    @Column(name = "is_read")
    @Builder.Default
    private Boolean isRead = false;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum NotificationType {
        PRODUCT_APPROVED("Produit approuvé"),
        PRODUCT_REJECTED("Produit rejeté"),
        PRODUCT_PURCHASED("Produit acheté"),
        REVIEW_RECEIVED("Avis reçu"),
        RATING_RECEIVED("Note reçue"),
        ORDER_CONFIRMED("Commande confirmée"),
        ORDER_SHIPPED("Commande expédiée"),
        ORDER_DELIVERED("Commande livrée"),
        NEW_ORDER("Nouvelle commande"),
        NEW_SELLER_PRODUCT("Nouveau produit vendeur"),
        NEW_SELLER_REGISTRATION("Nouvelle inscription vendeur"),
        STOCK_ALERT("Stock Alert"),
        SYSTEM("Système"),
        PROMOTION("Promotion"),
        PREDICTION_BESTSELLER("Bestseller potentiel détecté"),
        PREDICTION_PRICE("Recommandation de prix");

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