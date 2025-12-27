package com. dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations. CreationTimestamp;

import java.math. BigDecimal;
import java.time. LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_revenue")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlatformRevenue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id")
    private OrderItem orderItem;

    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin")
    private Product product;

    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    @Column(name = "revenue_date", nullable = false)
    private LocalDate revenueDate;

    @Column(name = "quantity_sold")
    private Integer quantitySold;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "gross_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal grossAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "revenue_type", nullable = false)
    private RevenueType revenueType;

    @Column(name = "description")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum RevenueType {
        DIRECT_SALE,
        COMMISSION
    }
}