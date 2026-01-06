package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPredictionCardResponse {

    private String asin;
    private String productName;
    private String description;
    private String imageUrl;
    private String categoryName;

    private BigDecimal currentPrice;
    private BigDecimal recommendedPrice;
    private BigDecimal priceDifference;
    private Double priceChangePercentage;
    private String priceAction;

    private BigDecimal rating;
    private Integer reviewsCount;
    private Integer salesCount;
    private Integer stockQuantity;

    private Double bestsellerProbability;
    private Boolean isPotentialBestseller;
    private String confidenceLevel;

    private Integer currentRank;
    private Integer predictedRank;
    private String rankingTrend;
    private Integer rankingChange;

    private String positioning;
    private String sellerName;

    private String predictedAt;

    public boolean hasPriceRecommendation() {
        return priceAction != null && !priceAction.equals("MAINTAIN") && !priceAction.equals("MAINTENIR");
    }
}