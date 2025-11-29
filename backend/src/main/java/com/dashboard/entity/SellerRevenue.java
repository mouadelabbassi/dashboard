package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_revenues", indexes = {
        @Index(name = "idx_sr_seller", columnList = "seller_id"),
        @Index(name = "idx_sr_date", columnList = "revenue_date"),
        @Index(name = "idx_sr_order", columnList = "order_id"),
        @Index(name = "idx_sr_order_item", columnList = "order_item_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", nullable = false)
    private Product product;

    @Column(name = "quantity_sold", nullable = false)
    private Integer quantitySold;

    @Column(name = "unit_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal unitPrice;

    @Column(name = "gross_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal grossAmount;

    @Column(name = "platform_fee_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal platformFeePercent = new BigDecimal("10.00");

    @Column(name = "platform_fee", precision = 12, scale = 2)
    private BigDecimal platformFee;

    @Column(name = "net_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal netAmount;

    @Column(name = "revenue_date", nullable = false)
    private LocalDate revenueDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void calculateRevenue() {
        if (this.grossAmount != null && this.platformFeePercent != null) {
            this.platformFee = this.grossAmount.multiply(this.platformFeePercent)
                    .divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
            this.netAmount = this.grossAmount.subtract(this.platformFee);
        }
        if (this.revenueDate == null) {
            this.revenueDate = LocalDate.now();
        }
    }
}