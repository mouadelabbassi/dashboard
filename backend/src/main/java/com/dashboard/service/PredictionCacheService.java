package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import com.dashboard.dto.response.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionCacheService {

    private final BestsellerPredictionRepository bestsellerRepo;
    private final RankingTrendPredictionRepository rankingRepo;
    private final PriceIntelligenceEntityRepository priceRepo;
    private final PredictionRefreshLogRepository refreshLogRepo;
    private final PredictionService predictionService;
    private final ProductRepository productRepository;

    private static final String REFRESH_TYPE_ALL = "ALL_PRODUCTS";

    /**
     * Get latest predictions INSTANTLY from database (no ML computation)
     */
    @Transactional(readOnly = true)
    public LatestPredictionsResponse getLatestPredictions() {
        log.info("⭐⭐⭐ FETCHING PREDICTIONS FROM CACHE ⭐⭐⭐");

        long startTime = System.currentTimeMillis();

        List<BestsellerPrediction> bestsellerPredictions = bestsellerRepo.findAllLatestPredictions();
        log.info("📊 BESTSELLER: Found {} predictions", bestsellerPredictions.size());

        List<RankingTrendPrediction> rankingPredictions = rankingRepo.findAllLatestPredictions();
        log.info("📈 RANKING: Found {} predictions", rankingPredictions.size());

        List<PriceIntelligenceEntity> priceIntelligence = priceRepo.findAllLatestIntelligence();
        log.info("💰 PRICE: Found {} predictions", priceIntelligence.size());

        // Debug first item
        if (!bestsellerPredictions.isEmpty()) {
            BestsellerPrediction first = bestsellerPredictions.get(0);
            log.info("🔍 Sample: productId={}, probability={}, level={}",
                    first.getProductId(),
                    first.getPredictedProbability(),
                    first.getPotentialLevel());
        } else {
            log.error("❌ NO BESTSELLER PREDICTIONS FOUND!");
        }

        PredictionRefreshLog lastRefresh = refreshLogRepo
                .findLatestSuccessfulRefresh(REFRESH_TYPE_ALL)
                .orElse(null);

        long duration = System.currentTimeMillis() - startTime;
        log.info("⏱️ Query took {}ms", duration);

        List<BestsellerPredictionResponse> mappedBestsellers = mapBestsellerPredictions(bestsellerPredictions);
        log.info("✅ Mapped {} bestseller responses", mappedBestsellers.size());

        return LatestPredictionsResponse.builder()
                .bestsellerPredictions(mappedBestsellers)
                .rankingPredictions(mapRankingPredictions(rankingPredictions))
                .priceIntelligence(mapPriceIntelligence(priceIntelligence))
                .totalCount(bestsellerPredictions.size())
                .lastRefreshedAt(lastRefresh != null ? lastRefresh.getCompletedAt() : null)
                .isRefreshing(isRefreshCurrentlyRunning())
                .fromCache(true)
                .build();
    }
    public boolean isRefreshCurrentlyRunning() {
        return refreshLogRepo.isRefreshRunning(REFRESH_TYPE_ALL);
    }

    @Async
    @Transactional
    public void refreshPredictionsInBackground() {
        if (isRefreshCurrentlyRunning()) {
            log.warn("Refresh already running");
            return;
        }

        log.info("Starting background prediction refresh");

        PredictionRefreshLog refreshLog = PredictionRefreshLog.builder()
                .refreshType(REFRESH_TYPE_ALL)
                .startedAt(LocalDateTime.now())
                .status(PredictionRefreshLog.RefreshStatus.RUNNING)
                .totalProducts(0)
                .successCount(0)
                .errorCount(0)
                .build();

        refreshLog = refreshLogRepo.save(refreshLog);

        try {
            List<Product> products = productRepository.findAll();
            refreshLog.setTotalProducts(products.size());
            refreshLogRepo.save(refreshLog);

            log.info("Refreshing predictions for {} products", products.size());

            // Generate predictions (this calls ML service)
            predictionService.generatePredictionsAsync(products.size());

            // Update log as completed
            refreshLog.setCompletedAt(LocalDateTime.now());
            refreshLog.setStatus(PredictionRefreshLog.RefreshStatus.COMPLETED);
            refreshLog.setSuccessCount(products.size());
            refreshLogRepo.save(refreshLog);

            log.info("Background refresh completed successfully");

        } catch (Exception e) {
            log.error("Background refresh failed", e);
            refreshLog.setCompletedAt(LocalDateTime.now());
            refreshLog.setStatus(PredictionRefreshLog.RefreshStatus.FAILED);
            refreshLog.setErrorMessage(e.getMessage());
            refreshLogRepo.save(refreshLog);
        }
    }

    // ==================== MAPPING METHODS ====================

    private List<BestsellerPredictionResponse> mapBestsellerPredictions(List<BestsellerPrediction> predictions) {
        return predictions.stream()
                .map(this::mapBestsellerPrediction)
                .collect(Collectors.toList());
    }

    private BestsellerPredictionResponse mapBestsellerPrediction(BestsellerPrediction p) {
        // Get product name from database
        String productName = null;
        try {
            Product product = productRepository.findByAsin(p.getProductId()).orElse(null);
            if (product != null) {
                productName = product.getProductName();
            }
        } catch (Exception e) {
            log.debug("Could not fetch product name for {}", p.getProductId());
        }

        return BestsellerPredictionResponse.builder()
                .productId(p.getProductId())
                .productName(productName)
                .bestsellerProbability(p.getPredictedProbability() != null ?
                        p.getPredictedProbability().doubleValue() : 0.0)
                .isPotentialBestseller(p.isPotentialBestseller())
                .confidenceLevel(p.getConfidenceLevel() != null ?
                        p.getConfidenceLevel().name() : "LOW")
                .potentialLevel(p.getPotentialLevel())
                .recommendation(p.getRecommendation())
                .predictedAt(p.getPredictionDate())
                .build();
    }

    private List<RankingTrendPredictionResponse> mapRankingPredictions(List<RankingTrendPrediction> predictions) {
        return predictions.stream()
                .map(this::mapRankingPrediction)
                .collect(Collectors.toList());
    }

    private RankingTrendPredictionResponse mapRankingPrediction(RankingTrendPrediction p) {
        // Get product name from database
        String productName = null;
        try {
            Product product = productRepository.findByAsin(p.getProductId()).orElse(null);
            if (product != null) {
                productName = product.getProductName();
            }
        } catch (Exception e) {
            log.debug("Could not fetch product name for {}", p.getProductId());
        }

        return RankingTrendPredictionResponse.builder()
                .productId(p.getProductId())
                .productName(productName)
                .currentRank(p.getCurrentRank())
                .predictedTrend(p.getPredictedTrend() != null ?
                        p.getPredictedTrend().name() : "STABLE")
                .confidenceScore(p.getConfidenceScore() != null ?
                        p.getConfidenceScore().doubleValue() : 0.0)
                .estimatedChange(p.getEstimatedChange())
                .predictedRank(p.getPredictedRank())
                .recommendation(p.getRecommendation())
                .isExperimental(p.getIsExperimental())
                .predictedAt(p.getPredictionDate())
                .build();
    }

    private List<PriceIntelligenceResponse> mapPriceIntelligence(List<PriceIntelligenceEntity> intelligence) {
        return intelligence.stream()
                .map(this::mapPriceIntelligenceEntity)
                .collect(Collectors.toList());
    }

    private PriceIntelligenceResponse mapPriceIntelligenceEntity(PriceIntelligenceEntity p) {
        // Get product name from database
        String productName = null;
        try {
            Product product = productRepository.findByAsin(p.getProductId()).orElse(null);
            if (product != null) {
                productName = product.getProductName();
            }
        } catch (Exception e) {
            log.debug("Could not fetch product name for {}", p.getProductId());
        }

        return PriceIntelligenceResponse.builder()
                .productId(p.getProductId())
                .productName(productName)
                .currentPrice(p.getCurrentPrice())
                .recommendedPrice(p.getRecommendedPrice())
                .priceDifference(p.getPriceDifference())
                .priceChangePercentage(p.getPriceChangePercentage() != null ?
                        p.getPriceChangePercentage().doubleValue() : 0.0)
                .priceAction(p.getPriceAction())
                .positioning(p.getPositioning())
                .categoryAvgPrice(p.getCategoryAvgPrice())
                .categoryMinPrice(p.getCategoryMinPrice())
                .categoryMaxPrice(p.getCategoryMaxPrice())
                .analysisMethod(p.getAnalysisMethod())
                .shouldNotifySeller(p.getShouldNotifySeller())
                .analyzedAt(p.getAnalysisDate())
                .build();
    }
}
