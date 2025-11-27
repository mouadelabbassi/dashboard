package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerReviewSummary {
    private Long totalReviews;
    private BigDecimal averageRating;
    private Map<Integer, Long> ratingDistribution;
}