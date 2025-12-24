package com.dashboard.controller;

import com.dashboard.entity.DailyProductMetric;
import com.dashboard.entity.ProductRankingHistory;
import com.dashboard.repository.DailyProductMetricRepository;
import com.dashboard.repository.ProductRankingHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/ml-analytics")
@RequiredArgsConstructor
public class MLAnalyticsController {

    private final ProductRankingHistoryRepository rankingHistoryRepo;
    private final DailyProductMetricRepository dailyMetricRepo;

    @GetMapping("/products/{asin}/ranking-trend")
    public ResponseEntity<?> getRankingTrend(@PathVariable String asin) {
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        List<ProductRankingHistory> history =
                rankingHistoryRepo.findRecentHistory(asin, thirtyDaysAgo);
        return ResponseEntity.ok(history);
    }

    @GetMapping("/products/{asin}/sales-trend")
    public ResponseEntity<?> getSalesTrend(@PathVariable String asin) {
        List<DailyProductMetric> metrics =
                dailyMetricRepo.findByProductAsinOrderByMetricDateDesc(asin);
        return ResponseEntity.ok(metrics);
    }
}