package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionStatsDTO {

    private long totalPredictions;
    private long potentialBestsellers;
    private long potentialBestsellersCount;

    private double avgBestsellerProbability;
    private double averageBestsellerProbability;

    private double avgPriceChange;
    private double averagePriceChangeRecommended;

    private long productsWithPriceRecommendation;
    private long productsWithRankingImprovement;

    private long improvingProducts;
    private long decliningProducts;
    private long stableProducts;

    private Map<String, Long> trendDistribution;
    private Map<String, Long> priceActionDistribution;

    private List<CategoryStatsDTO> categoryStats;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryStatsDTO {
        private String category;
        private long count;
        private long productCount;  // Alias for count
        private double avgBestsellerProb;
        private double avgBestsellerProbability;  // Alias
        private double avgPriceChange;
    }
    public static PredictionStatsDTOBuilder builderWithAliases() {
        return builder();
    }

    public void populateAliases() {
        this.potentialBestsellersCount = this.potentialBestsellers;
        this.averageBestsellerProbability = this.avgBestsellerProbability;
        this.averagePriceChangeRecommended = this.avgPriceChange;

        if (this.categoryStats != null) {
            this.categoryStats.forEach(cat -> {
                cat.setProductCount(cat.getCount());
                cat.setAvgBestsellerProbability(cat.getAvgBestsellerProb());
            });
        }
    }
}