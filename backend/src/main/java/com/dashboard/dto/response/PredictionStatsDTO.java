package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok. Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionStatsDTO {

    private Long totalPredictions;
    private Long potentialBestsellersCount;
    private Long productsWithPriceRecommendation;
    private Long productsWithRankingImprovement;
    private Double averageBestsellerProbability;
    private Double averagePriceChangeRecommended;
    private Map<String, Long> trendDistribution;
    private Map<String, Long> priceActionDistribution;
    private List<CategoryStatsDTO> categoryStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryStatsDTO {
        private String category;
        private Long productCount;
        private Double avgBestsellerProbability;
        private Double avgPriceChange;
    }
}