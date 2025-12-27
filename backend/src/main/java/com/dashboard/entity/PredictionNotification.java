package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for prediction-related notifications sent to sellers.
 */
@Entity
@Table(name = "prediction_notifications", indexes = {
        @Index(name = "idx_pn_user", columnList = "user_id"),
        @Index(name = "idx_pn_type", columnList = "notification_type"),
        @Index(name = "idx_pn_read", columnList = "is_read"),
        @Index(name = "idx_pn_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "product_id", length = 20)
    private String productId;

    @Enumerated(EnumType.STRING)
    @Column(name = "notification_type", nullable = false, length = 30)
    private NotificationType notificationType;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;

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

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "asin", insertable = false, updatable = false)
    private Product product;

    public enum NotificationType {
        BESTSELLER("🎯 Potentiel Bestseller", "Votre produit a un fort potentiel bestseller"),
        DECLINING_TREND("⚠️ Tendance à la baisse", "Le classement de votre produit risque de baisser"),
        PRICE_OPPORTUNITY("💰 Opportunité de prix", "Optimisation de prix recommandée"),
        RANKING_IMPROVEMENT("📈 Amélioration du classement", "Votre produit montre des signes d'amélioration");

        private final String title;
        private final String description;

        NotificationType(String title, String description) {
            this.title = title;
            this.description = description;
        }

        public String getTitle() {
            return title;
        }

        public String getDescription() {
            return description;
        }
    }

    // Helper methods
    public void markAsRead() {
        this.isRead = true;
        this.readAt = LocalDateTime.now();
    }
}