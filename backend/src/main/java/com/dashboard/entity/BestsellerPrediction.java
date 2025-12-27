package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Entity
@Table(name = "bestseller_predictions", indexes = {
        @Index(name = "idx_bp_product", columnList = "product_id"),
        @Index(name = "idx_bp_probability", columnList = "predicted_probability"),
        @Index(name = "idx_bp_confidence", columnList = "confidence_level"),
        @Index(name = "idx_bp_date", columnList = "prediction_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BestsellerPrediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, length = 20)
    private String productId;

    @Column(name = "asin", length = 20)
    private String asin;

    @Column(name = "predicted_probability", precision = 5, scale = 4)
    private BigDecimal predictedProbability;

    @Enumerated(EnumType.STRING)
    @Column(name = "confidence_level", length = 20)
    @Builder.Default
    private ConfidenceLevel confidenceLevel = ConfidenceLevel.LOW;

    @Column(name = "potential_level", length = 50)
    private String potentialLevel;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "prediction_date")
    private LocalDateTime predictionDate;

    @Column(name = "actual_outcome")
    private Boolean actualOutcome;

    @Column(name = "accuracy_tracked")
    @Builder.Default
    private Boolean accuracyTracked = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "asin", insertable = false, updatable = false)
    private Product product;

    public enum ConfidenceLevel {
        HIGH("Haute confiance"),
        MEDIUM("Confiance moyenne"),
        LOW("Faible confiance"),
        VERY_LOW("Très faible confiance");

        private final String description;

        ConfidenceLevel(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }


    public boolean isPotentialBestseller() {
        return predictedProbability != null &&
                predictedProbability.compareTo(new BigDecimal("0.70")) >= 0;
    }

    public boolean isHighConfidence() {
        return confidenceLevel == ConfidenceLevel.HIGH;
    }
}