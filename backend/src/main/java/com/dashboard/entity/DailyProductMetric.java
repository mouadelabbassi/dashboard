package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "daily_product_metrics",
        uniqueConstraints = @UniqueConstraint(
                name = "unique_asin_date",
                columnNames = {"product_asin", "metric_date"}
        ),
        indexes = {
                @Index(name = "idx_asin_date", columnList = "product_asin, metric_date"),
                @Index(name = "idx_date", columnList = "metric_date")
        }
)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyProductMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_asin", nullable = false, length = 20)
    private String productAsin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin",
            insertable = false, updatable = false)
    private Product product;

    @Column(name = "metric_date", nullable = false)
    private LocalDate metricDate;

    @Column(name = "units_sold")
    @Builder.Default
    private Integer unitsSold = 0;

    @Column(name = "revenue", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal revenue = BigDecimal.ZERO;

    @Column(name = "order_count")
    @Builder.Default
    private Integer orderCount = 0;

    @Column(name = "unique_customers")
    @Builder.Default
    private Integer uniqueCustomers = 0;

    @Column(name = "avg_order_value", precision = 10, scale = 2)
    private BigDecimal avgOrderValue;

    @Column(name = "views_count")
    @Builder.Default
    private Integer viewsCount = 0;

    @Column(name = "conversion_rate", precision = 6, scale = 4)
    private BigDecimal conversionRate;

    @PrePersist
    protected void onCreate() {
        if (metricDate == null) {
            metricDate = LocalDate.now();
        }
        calculateDerivedFields();
    }

    @PreUpdate
    protected void onUpdate() {
        calculateDerivedFields();
    }

    private void calculateDerivedFields() {
        if (orderCount != null && orderCount > 0 && revenue != null) {
            avgOrderValue = revenue.divide(
                    BigDecimal.valueOf(orderCount),
                    2,
                    BigDecimal.ROUND_HALF_UP
            );
        }

        if (viewsCount != null && viewsCount > 0 && orderCount != null) {
            conversionRate = BigDecimal.valueOf(orderCount)
                    .divide(BigDecimal.valueOf(viewsCount), 4, BigDecimal.ROUND_HALF_UP);
        }
    }
}