package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "seller_product_requests", indexes = {
        @Index(name = "idx_spr_seller", columnList = "seller_id"),
        @Index(name = "idx_spr_status", columnList = "status"),
        @Index(name = "idx_spr_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SellerProductRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @Column(name = "product_name", nullable = false, length = 500)
    private String productName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal price;

    @Column(name = "stock_quantity", nullable = false)
    private Integer stockQuantity;

    // ✅ FIXED: Changed from length=500 to TEXT to support long URLs (base64, etc.)
    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    // ✅ FIXED: Changed from length=2000 to TEXT
    @Column(name = "additional_images", columnDefinition = "TEXT")
    private String additionalImages;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RequestStatus status = RequestStatus.PENDING;

    @Column(name = "admin_notes", length = 1000)
    private String adminNotes;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "generated_asin", length = 20)
    private String generatedAsin;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "source_stock_id")
    private Long sourceStockId;

    public enum RequestStatus {
        PENDING("En attente"),
        APPROVED("Approuvé"),
        REJECTED("Rejeté"),
        CANCELLED("Annulé");

        private final String description;

        RequestStatus(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}