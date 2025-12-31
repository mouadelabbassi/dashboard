package com.dashboard.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LatestPredictionsResponse {
    private List<BestsellerPredictionResponse> bestsellerPredictions;
    private List<RankingTrendPredictionResponse> rankingPredictions;
    private List<PriceIntelligenceResponse> priceIntelligence;
    private Integer totalCount;
    private LocalDateTime lastRefreshedAt;
    private Boolean isRefreshing;
    private Boolean fromCache;
}
