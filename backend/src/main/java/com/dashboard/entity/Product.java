package com.dashboard. entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations. CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util. ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_product_name", columnList = "product_name"),
        @Index(name = "idx_category", columnList = "category_id"),
        @Index(name = "idx_ranking", columnList = "ranking"),
        @Index(name = "idx_rating", columnList = "rating"),
        @Index(name = "idx_sales_count", columnList = "sales_count"),
        @Index(name = "idx_seller", columnList = "seller_id"),
        @Index(name = "idx_approval_status", columnList = "approval_status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Product {

    @Id
    @Column(length = 20)
    private String asin;

    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2)
    private BigDecimal price;

    @Column(precision = 2, scale = 1)
    private BigDecimal rating;

    @Column(name = "reviews_count")
    @Builder.Default
    private Integer reviewsCount = 0;

    @Column(name = "ranking")
    private Integer ranking;

    @Column(name = "no_of_sellers")
    private Integer noOfSellers;

    @Column(name = "product_link", length = 500)
    private String productLink;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_bestseller")
    @Builder.Default
    private Boolean isBestseller = false;

    @Column(name = "likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "dislikes_count")
    @Builder. Default
    private Integer dislikesCount = 0;

    @Column(name = "sales_count")
    @Builder.Default
    private Integer salesCount = 0;

    // NEW: Seller reference
    @ManyToOne(fetch = FetchType. LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    // NEW: Stock quantity
    @Column(name = "stock_quantity")
    private Integer stockQuantity;

    // NEW: Approval status for seller products
    @Enumerated(EnumType.STRING)
    @Column(name = "approval_status", length = 20)
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.APPROVED;

    // NEW: When the product was submitted (for seller products)
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    // NEW: When approved
    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    // NEW: Who approved it
    @Column(name = "approved_by")
    private Long approvedBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @Builder. Default
    private List<Sale> sales = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductReview> reviews = new ArrayList<>();

    // Increment sales count
    public void incrementSalesCount(int quantity) {
        if (this.salesCount == null) {
            this.salesCount = 0;
        }
        this.salesCount += quantity;
    }

    public boolean isInStock() {
        return stockQuantity != null && stockQuantity > 0;
    }

    public boolean hasEnoughStock(int requestedQuantity) {
        return stockQuantity != null && stockQuantity >= requestedQuantity;
    }

    // ✅ NEW: Reduce stock when purchased
    public void reduceStock(int quantity) {
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    }

    // ✅ NEW: Increase stock when restocked
    public void addStock(int quantity) {
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        this.stockQuantity += quantity;
    }


    // NEW: Decrement stock
    public void decrementStock(int quantity) {
        if (this.stockQuantity == null) {
            this.stockQuantity = 0;
        }
        this.stockQuantity = Math.max(0, this.stockQuantity - quantity);
    }

    // NEW: Get seller name
    public String getSellerName() {
        if (seller == null) {
            return "MouadVision";
        }
        return seller.getStoreName() != null ? seller.getStoreName() : seller.getFullName();
    }

    // NEW: Check if MouadVision product
    public boolean isMouadVisionProduct() {
        return seller == null;
    }

    public String getSellerDisplayName() {
        return getSellerName();
    }

    @PrePersist
    @PreUpdate
    public void updateBestsellerStatus() {
        boolean highRanking = this.ranking != null && this.ranking <= 10;
        boolean highSales = this.salesCount != null && this. salesCount >= 50;
        this.isBestseller = highRanking || highSales;
    }

    // NEW: Approval status enum
    public enum ApprovalStatus {
        PENDING("En attente d'approbation"),
        APPROVED("Approuvé"),
        REJECTED("Rejeté");

        private final String description;

        ApprovalStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}