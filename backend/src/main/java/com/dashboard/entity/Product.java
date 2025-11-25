package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_product_name", columnList = "product_name"),
        @Index(name = "idx_category", columnList = "category_id"),
        @Index(name = "idx_ranking", columnList = "ranking"),
        @Index(name = "idx_rating", columnList = "rating")
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(name = "is_bestseller")
    @Builder.Default
    private Boolean isBestseller = false;

    @Column(name = "likes_count")
    @Builder.Default
    private Integer likesCount = 0;

    @Column(name = "dislikes_count")
    @Builder.Default
    private Integer dislikesCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL)
    @Builder.Default
    private List<Sale> sales = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<ProductReview> reviews = new ArrayList<>();

    @PrePersist
    @PreUpdate
    public void updateBestsellerStatus() {
        this.isBestseller = this.ranking != null && this.ranking <= 10;
    }
}