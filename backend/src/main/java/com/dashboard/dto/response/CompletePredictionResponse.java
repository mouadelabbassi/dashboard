package com.dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompletePredictionResponse {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("product_name")
    private String productName;

    private BestsellerPredictionResponse bestseller;

    @JsonProperty("ranking_trend")
    private RankingTrendPredictionResponse rankingTrend;

    @JsonProperty("price_intelligence")
    private PriceIntelligenceResponse priceIntelligence;

    @JsonProperty("predicted_at")
    private LocalDateTime predictedAt;
}