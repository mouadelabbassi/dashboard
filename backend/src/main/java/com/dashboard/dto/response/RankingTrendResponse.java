package com.dashboard.dto.response;

import com.dashboard.entity.RankingTrendPrediction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO for ranking trend prediction responses.
 * ⚠️ EXPERIMENTAL - uses synthetic labels
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RankingTrendResponse {

    private Long id;
    private String productId;
    private String productName;
    private String categoryName;
    private String imageUrl;

    private Integer currentRank;
    private BigDecimal currentPrice;
    private BigDecimal currentRating;
    private Integer currentSalesCount;

    private String trendDirection;
    private String trendDescription;
    private BigDecimal confidenceScore;
    private String confidenceLevel;
    private Integer estimatedChange;
    private Integer predictedRank;
    private String recommendation;

    private Boolean isExperimental;
    private String experimentalNote;

    private LocalDateTime predictionDate;

    private Long sellerId;
    private String sellerName;

    public static RankingTrendResponse fromEntity(RankingTrendPrediction prediction) {
        if (prediction == null) return null;

        RankingTrendResponseBuilder builder = RankingTrendResponse.builder()
                .id(prediction.getId())
                .productId(prediction.getProductId())
                .currentRank(prediction.getCurrentRank())
                .trendDirection(prediction.getPredictedTrend() != null ?
                        prediction.getPredictedTrend().getFrenchLabel() : "Stable")
                .trendDescription(prediction.getPredictedTrend() != null ?
                        prediction.getPredictedTrend().getDescription() : "")
                .confidenceScore(prediction.getConfidenceScore())
                .estimatedChange(prediction.getEstimatedChange())
                .predictedRank(prediction.getPredictedRank())
                .recommendation(prediction.getRecommendation())
                .isExperimental(prediction.getIsExperimental())
                .experimentalNote("Ce modèle utilise des étiquettes synthétiques. Interpréter avec prudence.")
                .predictionDate(prediction.getPredictionDate());

        if (prediction.getConfidenceScore() != null) {
            double conf = prediction.getConfidenceScore().doubleValue();
            if (conf >= 0.80) {
                builder.confidenceLevel("HIGH");
            } else if (conf >= 0.65) {
                builder.confidenceLevel("MEDIUM");
            } else {
                builder.confidenceLevel("LOW");
            }
        }

        if (prediction.getProduct() != null) {
            var product = prediction.getProduct();
            builder.productName(product.getProductName())
                    .imageUrl(product.getImageUrl())
                    .currentPrice(product.getPrice())
                    .currentRating(product.getRating())
                    .currentSalesCount(product.getSalesCount());

            if (product.getCategory() != null) {
                builder.categoryName(product.getCategory().getName());
            }

            if (product.getSeller() != null) {
                builder.sellerId(product.getSeller().getId())
                        .sellerName(product.getSeller().getStoreName() != null ?
                                product.getSeller().getStoreName() : product.getSeller().getFullName());
            }
        }

        return builder.build();
    }
}