package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "bestseller_history", indexes = {
        @Index(name = "idx_asin_date", columnList = "product_asin, recorded_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestsellerHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_asin", nullable = false, length = 20)
    private String productAsin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin",
            insertable = false, updatable = false)
    private Product product;

    @Column(name = "was_bestseller", nullable = false)
    private Boolean wasBestseller;

    @Column(name = "predicted_probability", precision = 5, scale = 4)
    private BigDecimal predictedProbability;

    @Column(name = "actual_sales_velocity", precision = 10, scale = 4)
    private BigDecimal actualSalesVelocity;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }
}