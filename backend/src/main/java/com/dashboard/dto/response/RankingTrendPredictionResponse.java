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
public class RankingTrendPredictionResponse {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("current_rank")
    private Integer currentRank;

    @JsonProperty("predicted_trend")
    private String predictedTrend;

    @JsonProperty("confidence_score")
    private Double confidenceScore;

    @JsonProperty("estimated_change")
    private Integer estimatedChange;

    @JsonProperty("predicted_rank")
    private Integer predictedRank;

    private String recommendation;

    @JsonProperty("is_experimental")
    private Boolean isExperimental;

    @JsonProperty("predicted_at")
    private LocalDateTime predictedAt;
}