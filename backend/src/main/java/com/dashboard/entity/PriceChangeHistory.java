package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_change_history", indexes = {
        @Index(name = "idx_asin", columnList = "product_asin"),
        @Index(name = "idx_date", columnList = "changed_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceChangeHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_asin", nullable = false, length = 20)
    private String productAsin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin",
            insertable = false, updatable = false)
    private Product product;

    @Column(name = "old_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal oldPrice;

    @Column(name = "new_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal newPrice;

    @Column(name = "change_reason", length = 100)
    private String changeReason;

    @Column(name = "sales_before_7d")
    @Builder.Default
    private Integer salesBefore7d = 0;

    @Column(name = "sales_after_7d")
    @Builder.Default
    private Integer salesAfter7d = 0;

    @Column(name = "revenue_before_7d", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal revenueBefore7d = BigDecimal.ZERO;

    @Column(name = "revenue_after_7d", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal revenueAfter7d = BigDecimal.ZERO;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "measured_at")
    private LocalDateTime measuredAt;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
    }

    @Transient
    public BigDecimal getPriceChangePercentage() {
        if (oldPrice.compareTo(BigDecimal.ZERO) > 0) {
            return newPrice.subtract(oldPrice)
                    .divide(oldPrice, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
        }
        return BigDecimal.ZERO;
    }

    @Transient
    public Integer getSalesImpact() {
        return salesAfter7d - salesBefore7d;
    }
}