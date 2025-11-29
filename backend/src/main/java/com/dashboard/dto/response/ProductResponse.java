package com.dashboard. dto.response;

import com.dashboard.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok. NoArgsConstructor;

import java. math.BigDecimal;
import java. time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private String asin;
    private String productName;
    private String description;
    private BigDecimal price;
    private BigDecimal rating;
    private Integer reviewsCount;
    private Integer ranking;
    private Integer noOfSellers;
    private String productLink;

    private String imageUrl;
    private Long categoryId;
    private String categoryName;

    private Integer stockQuantity;
    private Integer salesCount;
    private String approvalStatus;
    private String sellerName;
    private Long sellerId;

    private String sellerStoreName;     // Store name (for sellers)
    private Boolean isMouadVisionProduct; // TRUE if seller_id is NULL

    private Boolean isBestseller;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private Boolean inStock;

    public static ProductResponse fromEntity(Product product) {
        return ProductResponse.builder()
                // ... existing mappings ...
                .stockQuantity(product.getStockQuantity())
                .inStock(product.isInStock())
                .build();
    }
}