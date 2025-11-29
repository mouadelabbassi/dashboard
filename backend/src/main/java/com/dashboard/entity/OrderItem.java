package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math. BigDecimal;

@Entity
@Table(name = "order_items")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType. IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin")
    private Product product;

    @Column(name = "product_asin", insertable = false, updatable = false)
    private String productAsin;

    @Column(name = "product_name")
    private String productName;

    @Column(name = "product_image", length = 2000)  // INCREASED SIZE
    private String productImage;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(precision = 10, scale = 2)
    private BigDecimal subtotal;

    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    @Column(name = "seller_name")
    private String sellerName;

    @Column(name = "seller_revenue_calculated")
    private Boolean sellerRevenueCalculated = false;

    // Flag to identify if this is a platform product (MouadVision) or seller product
    @Column(name = "is_platform_product")
    private Boolean isPlatformProduct = false;
}