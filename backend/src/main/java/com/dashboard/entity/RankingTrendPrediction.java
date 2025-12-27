package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entity for storing ranking trend predictions.
 * ⚠️ EXPERIMENTAL: Uses synthetic labels - interpret with caution.
 */
@Entity
@Table(name = "ranking_trend_predictions", indexes = {
        @Index(name = "idx_rtp_product", columnList = "product_id"),
        @Index(name = "idx_rtp_trend", columnList = "predicted_trend"),
        @Index(name = "idx_rtp_date", columnList = "prediction_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RankingTrendPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, length = 20)
    private String productId;

    @Column(name = "current_rank")
    private Integer currentRank;

    @Enumerated(EnumType.STRING)
    @Column(name = "predicted_trend", length = 20)
    @Builder.Default
    private PredictedTrend predictedTrend = PredictedTrend.STABLE;

    @Column(name = "confidence_score", precision = 5, scale = 4)
    private BigDecimal confidenceScore;

    @Column(name = "estimated_change")
    @Builder.Default
    private Integer estimatedChange = 0;

    @Column(name = "predicted_rank")
    private Integer predictedRank;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "is_experimental")
    @Builder.Default
    private Boolean isExperimental = true;

    @Column(name = "prediction_date")
    private LocalDateTime predictionDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "asin", insertable = false, updatable = false)
    private Product product;

    public enum PredictedTrend {
        IMPROVING("Amélioration", "Le classement devrait s'améliorer"),
        STABLE("Stable", "Le classement devrait rester stable"),
        DECLINING("Déclin", "Le classement risque de baisser");

        private final String frenchLabel;
        private final String description;

        PredictedTrend(String frenchLabel, String description) {
            this.frenchLabel = frenchLabel;
            this.description = description;
        }

        public String getFrenchLabel() {
            return frenchLabel;
        }

        public String getDescription() {
            return description;
        }
    }

    // Helper methods
    public boolean isDeclining() {
        return predictedTrend == PredictedTrend.DECLINING;
    }

    public boolean isImproving() {
        return predictedTrend == PredictedTrend.IMPROVING;
    }

    public boolean needsAttention() {
        return isDeclining() && confidenceScore != null &&
                confidenceScore.compareTo(new BigDecimal("0.70")) >= 0;
    }
}