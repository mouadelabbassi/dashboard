package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionResponseDTO {

    private String productId;
    private String productName;
    private String category;
    private RankingPredictionDTO rankingPrediction;
    private BestsellerPredictionDTO bestsellerPrediction;
    private PricePredictionDTO pricePrediction;
    private LocalDateTime generatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RankingPredictionDTO {
        private Integer predictedRanking;
        private Integer currentRanking;
        private Integer rankingChange;
        private String trend;
        private String trendDescription;
        private Double confidence;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BestsellerPredictionDTO {
        private Double bestsellerProbability;
        private Boolean isPotentialBestseller;
        private String potentialLevel;
        private String recommendation;
        private Double confidence;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PricePredictionDTO {
        private Double recommendedPrice;
        private Double currentPrice;
        private Double priceDifference;
        private Double priceChangePercentage;
        private String priceAction;
        private String actionDescription;
        private Boolean shouldNotifySeller;
        private Double confidence;
    }
}