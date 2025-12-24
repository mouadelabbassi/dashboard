package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_accuracy_log", indexes = {
        @Index(name = "idx_type_date", columnList = "prediction_type, measurement_date"),
        @Index(name = "idx_asin", columnList = "product_asin")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionAccuracyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_asin", nullable = false, length = 20)
    private String productAsin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin",
            insertable = false, updatable = false)
    private Product product;

    @Enumerated(EnumType.STRING)
    @Column(name = "prediction_type", nullable = false)
    private PredictionType predictionType;

    @Column(name = "predicted_value", precision = 12, scale = 4)
    private BigDecimal predictedValue;

    @Column(name = "actual_value", precision = 12, scale = 4)
    private BigDecimal actualValue;

    @Column(name = "prediction_date", nullable = false)
    private LocalDateTime predictionDate;

    @Column(name = "measurement_date")
    private LocalDateTime measurementDate;

    @Column(name = "absolute_error", precision = 12, scale = 4)
    private BigDecimal absoluteError;

    @Column(name = "model_version", length = 20)
    private String modelVersion;

    public enum PredictionType {
        BESTSELLER,
        RANKING,
        PRICE
    }

    @PrePersist
    protected void onCreate() {
        if (measurementDate == null) {
            measurementDate = LocalDateTime.now();
        }
        calculateError();
    }

    @PreUpdate
    protected void onUpdate() {
        calculateError();
    }

    private void calculateError() {
        if (predictedValue != null && actualValue != null) {
            absoluteError = predictedValue.subtract(actualValue).abs();
        }
    }
}