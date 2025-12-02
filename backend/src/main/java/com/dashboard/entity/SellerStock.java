package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_stock", indexes = {
        @Index(name = "idx_seller_stock_seller", columnList = "seller_id"),
        @Index(name = "idx_seller_stock_product", columnList = "original_product_asin"),
        @Index(name = "idx_seller_stock_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerStock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "original_product_asin", nullable = false)
    private String originalProductAsin;

    @Column(name = "original_product_name", nullable = false)
    private String originalProductName;

    @Column(name = "original_product_image")
    private String originalProductImage;

    @Column(name = "original_price", precision = 10, scale = 2)
    private BigDecimal originalPrice;

    @Column(name = "purchase_price", precision = 10, scale = 2, nullable = false)
    private BigDecimal purchasePrice;

    @Column(nullable = false)
    private Integer quantity;

    @Column(name = "available_quantity", nullable = false)
    private Integer availableQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private StockStatus status = StockStatus.IN_STOCK;

    @Column(name = "order_id")
    private Long orderId;

    @Column(name = "order_number")
    private String orderNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(columnDefinition = "TEXT")
    private String description;

    @CreationTimestamp
    @Column(name = "purchased_at", updatable = false)
    private LocalDateTime purchasedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum StockStatus {
        IN_STOCK("In Stock"),
        PARTIALLY_LISTED("Partially Listed"),
        FULLY_LISTED("Fully Listed"),
        OUT_OF_STOCK("Out of Stock");

        private final String description;

        StockStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }

    public void decreaseAvailableQuantity(int amount) {
        if (this.availableQuantity >= amount) {
            this.availableQuantity -= amount;
            updateStatus();
        }
    }

    public void increaseAvailableQuantity(int amount) {
        this.availableQuantity += amount;
        if (this.availableQuantity > this.quantity) {
            this.availableQuantity = this.quantity;
        }
        updateStatus();
    }

    private void updateStatus() {
        if (this.availableQuantity == 0) {
            this.status = StockStatus.FULLY_LISTED;
        } else if (this.availableQuantity < this.quantity) {
            this.status = StockStatus.PARTIALLY_LISTED;
        } else {
            this.status = StockStatus.IN_STOCK;
        }
    }
}