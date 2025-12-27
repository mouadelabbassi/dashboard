package com.dashboard.dto.response;

import com.dashboard.entity.BestsellerPrediction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;


@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BestsellerPredictionResponse {

    private Long id;
    private String productId;
    private String productName;
    private String asin;
    private String categoryName;
    private String imageUrl;

    // Current product metrics
    private BigDecimal currentPrice;
    private BigDecimal currentRating;
    private Integer currentReviewsCount;
    private Integer currentSalesCount;
    private Integer currentRanking;
    private Boolean isCurrentlyBestseller;

    // Prediction results
    private BigDecimal predictedProbability;
    private Boolean isPotentialBestseller;
    private String confidenceLevel;
    private String potentialLevel;
    private String recommendation;

    // Timestamps
    private LocalDateTime predictionDate;
    private LocalDateTime lastUpdated;

    // Seller info (for admin/analyst views)
    private Long sellerId;
    private String sellerName;
    private Boolean isPlatformProduct;

    public static BestsellerPredictionResponse fromEntity(BestsellerPrediction prediction) {
        if (prediction == null) return null;

        BestsellerPredictionResponseBuilder builder = BestsellerPredictionResponse.builder()
                .id(prediction.getId())
                .productId(prediction.getProductId())
                .asin(prediction.getAsin())
                .predictedProbability(prediction.getPredictedProbability())
                .isPotentialBestseller(prediction.isPotentialBestseller())
                .confidenceLevel(prediction.getConfidenceLevel() != null ?
                        prediction.getConfidenceLevel().name() : "LOW")
                .potentialLevel(prediction.getPotentialLevel())
                .recommendation(prediction.getRecommendation())
                .predictionDate(prediction.getPredictionDate())
                .lastUpdated(prediction.getUpdatedAt());

        // Add product info if available
        if (prediction.getProduct() != null) {
            var product = prediction.getProduct();
            builder.productName(product.getProductName())
                    .imageUrl(product.getImageUrl())
                    .currentPrice(product.getPrice())
                    .currentRating(product.getRating())
                    .currentReviewsCount(product.getReviewsCount())
                    .currentSalesCount(product.getSalesCount())
                    .currentRanking(product.getRanking())
                    .isCurrentlyBestseller(product.getIsBestseller())
                    .isPlatformProduct(product.getSeller() == null);

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