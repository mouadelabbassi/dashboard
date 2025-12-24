package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class MLTrackingService {

    private final ProductRepository productRepository;
    private final ProductRankingHistoryRepository rankingHistoryRepository;
    private final DailyProductMetricRepository dailyMetricRepository;
    private final PriceChangeHistoryRepository priceChangeRepository;
    private final BestsellerHistoryRepository bestsellerHistoryRepository;
    private final PredictionAccuracyLogRepository accuracyLogRepository;

    /**
     * ✅ Capture ranking snapshot every hour
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void captureRankingSnapshot() {
        log.info("📊 Capturing ranking snapshot...");

        List<Product> products = productRepository.findAll();
        int captured = 0;

        for (Product product : products) {
            if (product.getRanking() != null && product.getRanking() > 0) {
                try {
                    ProductRankingHistory history = ProductRankingHistory.builder()
                            .productAsin(product.getAsin())
                            .amazonRank(product.getRanking())
                            .salesVelocity(calculateSalesVelocity(product))
                            .recordedAt(LocalDateTime.now())
                            .build();

                    rankingHistoryRepository.save(history);
                    captured++;
                } catch (Exception e) {
                    log.error("Error capturing ranking for {}: {}", product.getAsin(), e.getMessage());
                }
            }
        }

        log.info("✅ Captured {} ranking snapshots", captured);
    }

    /**
     * ✅ Capture daily metrics at midnight
     */
    @Scheduled(cron = "0 5 0 * * *") // Daily at 00:05
    @Transactional
    public void captureDailyMetrics() {
        log.info("📊 Capturing daily metrics for yesterday...");

        LocalDate yesterday = LocalDate.now().minusDays(1);

        // This would ideally query from order_items table
        // For now, it's a placeholder - you'll integrate with your existing order system

        List<Product> products = productRepository.findAll();
        int captured = 0;

        for (Product product : products) {
            try {
                // Check if already exists
                if (dailyMetricRepository.findByProductAsinAndMetricDate(
                        product.getAsin(), yesterday).isEmpty()) {

                    DailyProductMetric metric = DailyProductMetric.builder()
                            .productAsin(product.getAsin())
                            .metricDate(yesterday)
                            .unitsSold(0) // TODO: Calculate from orders
                            .revenue(BigDecimal.ZERO) // TODO: Calculate from orders
                            .orderCount(0) // TODO: Calculate from orders
                            .build();

                    dailyMetricRepository.save(metric);
                    captured++;
                }
            } catch (Exception e) {
                log.error("Error capturing daily metric for {}: {}", product.getAsin(), e.getMessage());
            }
        }

        log.info("✅ Captured {} daily metrics", captured);
    }

    /**
     * ✅ Track price changes when they happen
     */
    @Transactional
    public void trackPriceChange(String productAsin, BigDecimal oldPrice,
                                 BigDecimal newPrice, String reason) {
        log.info("💰 Tracking price change for {}: {} -> {}", productAsin, oldPrice, newPrice);

        try {
            // Get sales before change (last 7 days)
            LocalDate sevenDaysAgo = LocalDate.now().minusDays(7);
            Integer salesBefore = dailyMetricRepository.sumUnitsSoldSince(productAsin, sevenDaysAgo);

            PriceChangeHistory history = PriceChangeHistory.builder()
                    .productAsin(productAsin)
                    .oldPrice(oldPrice)
                    .newPrice(newPrice)
                    .changeReason(reason)
                    .salesBefore7d(salesBefore != null ? salesBefore : 0)
                    .changedAt(LocalDateTime.now())
                    .build();

            priceChangeRepository.save(history);
            log.info("✅ Price change tracked");

        } catch (Exception e) {
            log.error("Error tracking price change: {}", e.getMessage());
        }
    }

    /**
     * ✅ Measure price change impact after 7 days
     */
    @Scheduled(cron = "0 0 3 * * *") // Daily at 3am
    @Transactional
    public void measurePriceChangeImpact() {
        log.info("📊 Measuring price change impacts...");

        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        List<PriceChangeHistory> unmeasured =
                priceChangeRepository.findUnmeasuredOlderThan(sevenDaysAgo);

        int measured = 0;
        for (PriceChangeHistory change : unmeasured) {
            try {
                // Get sales after change (7 days after change date)
                LocalDate sevenDaysAfterChange = change.getChangedAt().toLocalDate().plusDays(7);
                LocalDate endDate = change.getChangedAt().toLocalDate().plusDays(14);

                List<DailyProductMetric> metricsAfter = dailyMetricRepository
                        .findByProductAndDateRange(change.getProductAsin(), sevenDaysAfterChange, endDate);

                int salesAfter = metricsAfter.stream()
                        .mapToInt(DailyProductMetric::getUnitsSold)
                        .sum();

                BigDecimal revenueAfter = metricsAfter.stream()
                        .map(DailyProductMetric::getRevenue)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                change.setSalesAfter7d(salesAfter);
                change.setRevenueAfter7d(revenueAfter);
                change.setMeasuredAt(LocalDateTime.now());

                priceChangeRepository.save(change);
                measured++;

            } catch (Exception e) {
                log.error("Error measuring price change impact for {}: {}",
                        change.getProductAsin(), e.getMessage());
            }
        }

        log.info("✅ Measured {} price change impacts", measured);
    }

    /**
     * ✅ Track bestseller predictions for accuracy monitoring
     */
    @Transactional
    public void trackBestsellerPrediction(String productAsin, Boolean wasBestseller,
                                          BigDecimal predictedProbability) {
        try {
            Product product = productRepository.findByAsin(productAsin).orElse(null);
            if (product == null) return;

            BigDecimal salesVelocity = calculateSalesVelocity(product);

            BestsellerHistory history = BestsellerHistory.builder()
                    .productAsin(productAsin)
                    .wasBestseller(wasBestseller)
                    .predictedProbability(predictedProbability)
                    .actualSalesVelocity(salesVelocity)
                    .recordedAt(LocalDateTime.now())
                    .build();

            bestsellerHistoryRepository.save(history);

        } catch (Exception e) {
            log.error("Error tracking bestseller prediction: {}", e.getMessage());
        }
    }

    /**
     * ✅ Log prediction accuracy for model monitoring
     */
    @Transactional
    public void logPredictionAccuracy(String productAsin,
                                      PredictionAccuracyLog.PredictionType type,
                                      BigDecimal predictedValue,
                                      BigDecimal actualValue,
                                      LocalDateTime predictionDate) {
        try {
            PredictionAccuracyLog log = PredictionAccuracyLog.builder()
                    .productAsin(productAsin)
                    .predictionType(type)
                    .predictedValue(predictedValue)
                    .actualValue(actualValue)
                    .predictionDate(predictionDate)
                    .measurementDate(LocalDateTime.now())
                    .modelVersion("1.0.0")
                    .build();

            accuracyLogRepository.save(log);

        } catch (Exception e) {
            this.log.error("Error logging prediction accuracy: {}", e.getMessage());
        }
    }

    // ===== HELPER METHODS =====

    private BigDecimal calculateSalesVelocity(Product product) {
        if (product.getSalesCount() == null || product.getCreatedAt() == null) {
            return BigDecimal.ZERO;
        }

        long daysSinceListed = java.time.temporal.ChronoUnit.DAYS.between(
                product.getCreatedAt().toLocalDate(),
                LocalDate.now()
        );

        if (daysSinceListed == 0) daysSinceListed = 1;

        return BigDecimal.valueOf(product.getSalesCount())
                .divide(BigDecimal.valueOf(daysSinceListed), 4, BigDecimal.ROUND_HALF_UP);
    }
}