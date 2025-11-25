package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

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

    // User interaction
    private Boolean userHasReviewed;
    private ReviewResponse userReview;

    // Engagement stats
    private Long likesCount;
    private Long dislikesCount;

    // Rating distribution (5 stars, 4 stars, etc.)
    private Map<Integer, Long> ratingDistribution;

    // Recent reviews
    private List<ReviewResponse> recentReviews;
}