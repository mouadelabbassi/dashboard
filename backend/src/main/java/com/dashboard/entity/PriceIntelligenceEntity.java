package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "price_intelligence", indexes = {
        @Index(name = "idx_pi_product", columnList = "product_id"),
        @Index(name = "idx_pi_date", columnList = "analysis_date")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PriceIntelligenceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false, length = 20)
    private String productId;

    @Column(name = "asin", length = 20)
    private String asin;

    @Column(name = "current_price", precision = 10, scale = 2)
    private BigDecimal currentPrice;

    @Column(name = "recommended_price", precision = 10, scale = 2)
    private BigDecimal recommendedPrice;

    @Column(name = "price_difference", precision = 10, scale = 2)
    private BigDecimal priceDifference;

    @Column(name = "price_change_percentage", precision = 5, scale = 2)
    private BigDecimal priceChangePercentage;

    @Column(name = "price_action", length = 20)
    private String priceAction;

    @Column(name = "positioning", length = 20)
    private String positioning;

    @Column(name = "category_avg_price", precision = 10, scale = 2)
    private BigDecimal categoryAvgPrice;

    @Column(name = "category_min_price", precision = 10, scale = 2)
    private BigDecimal categoryMinPrice;

    @Column(name = "category_max_price", precision = 10, scale = 2)
    private BigDecimal categoryMaxPrice;

    @Column(name = "analysis_method", length = 50)
    @Builder.Default
    private String analysisMethod = "STATISTICAL";

    @Column(name = "should_notify_seller")
    @Builder.Default
    private Boolean shouldNotifySeller = false;

    @Column(name = "analysis_date")
    private LocalDateTime analysisDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", referencedColumnName = "asin", insertable = false, updatable = false)
    private Product product;
}
