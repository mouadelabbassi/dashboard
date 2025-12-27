package com. dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util. Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailResponse {

    private String asin;
    private String productName;
    private String description;
    private BigDecimal price;
    private BigDecimal averageRating;
    private Integer totalReviews;
    private Integer ranking;
    private String imageUrl;
    private String productLink;
    private String categoryName;
    private Long categoryId;
    private Boolean isBestseller;

    private Boolean userHasReviewed;
    private ReviewResponse userReview;

    private Long likesCount;
    private Long dislikesCount;

    private Map<Integer, Long> ratingDistribution;

    private List<ReviewResponse> recentReviews;

    private String sellerName;
    private Long sellerId;
    private Boolean isMouadVisionProduct;
}