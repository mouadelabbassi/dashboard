package com.dashboard.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionRequestDTO {
    private String productId;
    private String productName;
    private Double currentPrice;
    private Double rating;
    private Integer reviewCount;
    private Integer salesCount;
    private Integer stockQuantity;
    private Integer daysSinceListed;
    private Double sellerRating;
    private Double discountPercentage;
    private String category;
    private Integer currentRanking;
}