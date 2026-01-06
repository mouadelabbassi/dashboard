package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequest;
import com.dashboard.dto.response.*;
import com.dashboard.entity.*;
import com.dashboard.repository.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class PredictionCacheService {

    private static final int CACHE_PAGE_SIZE = 1000;
    private static final int BATCH_SIZE = 50;
    private static final int BATCH_DELAY_MS = 500;
    private static final String REFRESH_TYPE_ALL = "ALL";

    private final BestsellerPredictionRepository bestsellerRepo;
    private final RankingTrendPredictionRepository rankingRepo;
    private final PriceIntelligenceEntityRepository priceRepo;
    private final PredictionRefreshLogRepository refreshLogRepo;
    private final ProductRepository productRepository;
    private final MLServiceClient mlServiceClient;
    private final ApplicationContext applicationContext;

    private final AtomicBoolean isRefreshRunning = new AtomicBoolean(false);
    private volatile LocalDateTime lastRefreshStarted;
    private volatile LocalDateTime lastRefreshCompleted;
    private volatile int lastRefreshSuccessCount;
    private volatile int lastRefreshErrorCount;

    public PredictionCacheService(
            BestsellerPredictionRepository bestsellerRepo,
            RankingTrendPredictionRepository rankingRepo,
            PriceIntelligenceEntityRepository priceRepo,
            PredictionRefreshLogRepository refreshLogRepo,
            ProductRepository productRepository,
            MLServiceClient mlServiceClient,
            ApplicationContext applicationContext) {
        this.bestsellerRepo = bestsellerRepo;
        this.rankingRepo = rankingRepo;
        this.priceRepo = priceRepo;
        this.refreshLogRepo = refreshLogRepo;
        this.productRepository = productRepository;
        this.mlServiceClient = mlServiceClient;
        this.applicationContext = applicationContext;
    }

    @Transactional(readOnly = true)
    public LatestPredictionsResponse getLatestPredictions() {
        log.info("CACHE_READ: Fetching predictions from database");
        long startTime = System.currentTimeMillis();

        Pageable pageable = PageRequest.of(0, CACHE_PAGE_SIZE);

        List<BestsellerPrediction> bestsellers = fetchBestsellersFromCache(pageable);
        List<RankingTrendPrediction> rankings = fetchRankingsFromCache(pageable);
        List<PriceIntelligenceEntity> prices = fetchPricesFromCache(pageable);

        LocalDateTime lastRefreshedAt = getLastSuccessfulRefreshTime();

        long duration = System.currentTimeMillis() - startTime;
        log.info("CACHE_READ: Completed in {}ms - BS:{} RK:{} PR:{}",
                duration, bestsellers.size(), rankings.size(), prices.size());

        return LatestPredictionsResponse.builder()
                .bestsellerPredictions(mapBestsellers(bestsellers))
                .rankingPredictions(mapRankings(rankings))
                .priceIntelligence(mapPrices(prices))
                .totalCount(calculateTotalCount(bestsellers, rankings, prices))
                .lastRefreshedAt(lastRefreshedAt)
                .isRefreshing(isRefreshRunning.get())
                .fromCache(true)
                .build();
    }

    public void triggerAsyncRefresh() {
        if (isRefreshRunning.get()) {
            log.info("REFRESH_SKIP: Refresh already in progress");
            return;
        }
        PredictionCacheService proxy = applicationContext.getBean(PredictionCacheService.class);
        proxy.refreshPredictionsInBackground();
    }

    @Async("predictionExecutor")
    public void refreshPredictionsInBackground() {
        if (!isRefreshRunning.compareAndSet(false, true)) {
            log.warn("REFRESH_BLOCKED: Another refresh is already running");
            return;
        }

        lastRefreshStarted = LocalDateTime.now();
        log.info("REFRESH_START: Background prediction refresh initiated");

        PredictionRefreshLog refreshLog = null;
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger errorCount = new AtomicInteger(0);

        try {
            var healthCheck = mlServiceClient.getMLServiceHealth();
            if ("unavailable".equals(healthCheck.get("status"))) {
                throw new RuntimeException("ML service is not available: " + healthCheck.get("error"));
            }
            log.info("REFRESH_HEALTH: ML service is healthy");

            refreshLog = createRefreshLog();
            List<Product> products = productRepository.findAll();
            log.info("REFRESH_PRODUCTS: Processing {} products", products.size());

            for (int i = 0; i < products.size(); i += BATCH_SIZE) {
                int endIndex = Math.min(i + BATCH_SIZE, products.size());
                List<Product> batch = products.subList(i, endIndex);

                processBatch(batch, successCount, errorCount);

                int progress = (int) (((i + batch.size()) / (double) products.size()) * 100);
                log.info("REFRESH_PROGRESS: {}% complete ({}/{})", progress, i + batch.size(), products.size());

                if (i + BATCH_SIZE < products.size()) {
                    sleepBetweenBatches();
                }
            }

            finalizeRefreshLog(refreshLog, successCount.get(), errorCount.get(),
                    PredictionRefreshLog.RefreshStatus.COMPLETED);

            lastRefreshCompleted = LocalDateTime.now();
            lastRefreshSuccessCount = successCount.get();
            lastRefreshErrorCount = errorCount.get();

            log.info("REFRESH_COMPLETE: Success={} Errors={}", successCount.get(), errorCount.get());

        } catch (Exception e) {
            log.error("REFRESH_FAILED: {}", e.getMessage(), e);
            handleRefreshFailure(refreshLog, e.getMessage());
        } finally {
            isRefreshRunning.set(false);
        }
    }

    private void processBatch(List<Product> batch, AtomicInteger successCount, AtomicInteger errorCount) {
        for (Product product : batch) {
            try {
                PredictionRequest request = buildRequest(product);
                mlServiceClient.predictComplete(request);
                successCount.incrementAndGet();
            } catch (Exception e) {
                errorCount.incrementAndGet();
                String errorMsg = e.getMessage() != null ? e.getMessage() : "Unknown error";
                if (errorCount.get() <= 5) {
                    log.warn("REFRESH_ITEM_ERROR: Product {} - {}", product.getAsin(), errorMsg);
                }
            }
        }
    }

    private PredictionRequest buildRequest(Product product) {
        PredictionRequest.PredictionRequestBuilder builder = PredictionRequest.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .price(product.getPrice())
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .salesCount(product.getSalesCount())
                .ranking(product.getRanking())
                .stockQuantity(product.getStockQuantity())
                .discountPercentage(product.getDiscountPercentage())
                .daysSinceListed(product.getDaysSinceListed());

        if (product.getCategory() != null) {
            enrichWithCategoryData(builder, product.getCategory().getId());
        }

        return builder.build();
    }

    private void enrichWithCategoryData(PredictionRequest.PredictionRequestBuilder builder, Long categoryId) {
        try {
            List<Product> categoryProducts = productRepository.findByCategoryId(categoryId, Pageable.unpaged()).getContent();
            if (!categoryProducts.isEmpty()) {
                double avgPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .mapToDouble(BigDecimal::doubleValue)
                        .average()
                        .orElse(0.0);

                double minPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .mapToDouble(BigDecimal::doubleValue)
                        .min()
                        .orElse(0.0);

                double maxPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .mapToDouble(BigDecimal::doubleValue)
                        .max()
                        .orElse(0.0);

                double avgReviews = categoryProducts.stream()
                        .map(Product::getReviewsCount)
                        .filter(r -> r != null)
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0.0);

                builder.categoryAvgPrice(BigDecimal.valueOf(avgPrice))
                        .categoryMinPrice(BigDecimal.valueOf(minPrice))
                        .categoryMaxPrice(BigDecimal.valueOf(maxPrice))
                        .categoryAvgReviews(avgReviews);
            }
        } catch (Exception e) {
            log.debug("Failed to enrich category data: {}", e.getMessage());
        }
    }

    private PredictionRefreshLog createRefreshLog() {
        PredictionRefreshLog log = new PredictionRefreshLog();
        log.setStartedAt(LocalDateTime.now());
        log.setStatus(PredictionRefreshLog.RefreshStatus.RUNNING);
        log.setRefreshType(REFRESH_TYPE_ALL);
        log.setTotalProducts((int) productRepository.count());
        return refreshLogRepo.save(log);
    }

    private void finalizeRefreshLog(PredictionRefreshLog refreshLog, int success, int errors,
                                    PredictionRefreshLog.RefreshStatus status) {
        if (refreshLog == null) return;
        refreshLog.setCompletedAt(LocalDateTime.now());
        refreshLog.setStatus(status);
        refreshLog.setSuccessCount(success);
        refreshLog.setErrorCount(errors);
        refreshLogRepo.save(refreshLog);
    }

    private void handleRefreshFailure(PredictionRefreshLog refreshLog, String errorMessage) {
        if (refreshLog != null) {
            refreshLog.setCompletedAt(LocalDateTime.now());
            refreshLog.setStatus(PredictionRefreshLog.RefreshStatus.FAILED);
            refreshLog.setErrorMessage(errorMessage);
            refreshLogRepo.save(refreshLog);
        }
        lastRefreshCompleted = LocalDateTime.now();
    }

    private void sleepBetweenBatches() {
        try {
            Thread.sleep(BATCH_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("REFRESH_INTERRUPTED: Batch processing interrupted");
        }
    }

    private List<BestsellerPrediction> fetchBestsellersFromCache(Pageable pageable) {
        try {
            Page<BestsellerPrediction> page = bestsellerRepo.findAllByOrderByPredictionDateDesc(pageable);
            return page.getContent();
        } catch (Exception e) {
            log.error("CACHE_ERROR: Failed to fetch bestsellers - {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<RankingTrendPrediction> fetchRankingsFromCache(Pageable pageable) {
        try {
            Page<RankingTrendPrediction> page = rankingRepo.findAllByOrderByPredictionDateDesc(pageable);
            return page.getContent();
        } catch (Exception e) {
            log.error("CACHE_ERROR: Failed to fetch rankings - {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private List<PriceIntelligenceEntity> fetchPricesFromCache(Pageable pageable) {
        try {
            Page<PriceIntelligenceEntity> page = priceRepo.findAllByOrderByAnalysisDateDesc(pageable);
            return page.getContent();
        } catch (Exception e) {
            log.error("CACHE_ERROR: Failed to fetch prices - {}", e.getMessage());
            return new ArrayList<>();
        }
    }

    private LocalDateTime getLastSuccessfulRefreshTime() {
        try {
            Optional<PredictionRefreshLog> lastRefresh = refreshLogRepo.findLatestSuccessfulRefresh(REFRESH_TYPE_ALL);
            return lastRefresh.map(PredictionRefreshLog::getCompletedAt).orElse(null);
        } catch (Exception e) {
            log.warn("CACHE_WARN: Could not fetch last refresh time - {}", e.getMessage());
            return lastRefreshCompleted;
        }
    }

    private int calculateTotalCount(List<BestsellerPrediction> bs, List<RankingTrendPrediction> rk,
                                    List<PriceIntelligenceEntity> pr) {
        return Math.max(bs.size(), Math.max(rk.size(), pr.size()));
    }

    public boolean isRefreshCurrentlyRunning() {
        return isRefreshRunning.get();
    }

    public RefreshStatusResponse getRefreshStatusDetails() {
        return RefreshStatusResponse.builder()
                .isRefreshing(isRefreshRunning.get())
                .lastRefreshStarted(lastRefreshStarted)
                .lastRefreshCompleted(lastRefreshCompleted)
                .lastSuccessCount(lastRefreshSuccessCount)
                .lastErrorCount(lastRefreshErrorCount)
                .build();
    }

    private List<BestsellerPredictionResponse> mapBestsellers(List<BestsellerPrediction> predictions) {
        return predictions.stream().map(p -> {
            String productName = getProductName(p.getProductId());
            return BestsellerPredictionResponse.builder()
                    .productId(p.getProductId())
                    .productName(productName)
                    .bestsellerProbability(p.getPredictedProbability() != null ?
                            p.getPredictedProbability().doubleValue() : 0.0)
                    .isPotentialBestseller(p.isPotentialBestseller())
                    .confidenceLevel(p.getConfidenceLevel() != null ? p.getConfidenceLevel().name() : "LOW")
                    .potentialLevel(p.getPotentialLevel())
                    .recommendation(p.getRecommendation())
                    .predictedAt(p.getPredictionDate())
                    .build();
        }).toList();
    }

    private List<RankingTrendPredictionResponse> mapRankings(List<RankingTrendPrediction> predictions) {
        return predictions.stream().map(p -> {
            String productName = getProductName(p.getProductId());
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
                    .isExperimental(true)
                    .predictedAt(p.getPredictionDate())
                    .build();
        }).toList();
    }

    private List<PriceIntelligenceResponse> mapPrices(List<PriceIntelligenceEntity> intelligences) {
        return intelligences.stream().map(p -> {
            String productName = getProductName(p.getProductId());
            return PriceIntelligenceResponse.builder()
                    .productId(p.getProductId())
                    .productName(productName)
                    .currentPrice(BigDecimal.valueOf(p.getCurrentPrice() != null ?
                            p.getCurrentPrice().doubleValue() : 0.0))
                    .recommendedPrice(BigDecimal.valueOf(p.getRecommendedPrice() != null ?
                            p.getRecommendedPrice().doubleValue() : 0.0))
                    .priceDifference(BigDecimal.valueOf(p.getPriceDifference() != null ?
                            p.getPriceDifference().doubleValue() : 0.0))
                    .priceChangePercentage(p.getPriceChangePercentage() != null ?
                            p.getPriceChangePercentage().doubleValue() : 0.0)
                    .priceAction(p.getPriceAction())
                    .positioning(p.getPositioning())
                    .categoryAvgPrice(BigDecimal.valueOf(p.getCategoryAvgPrice() != null ?
                            p.getCategoryAvgPrice().doubleValue() : 0.0))
                    .categoryMinPrice(BigDecimal.valueOf(p.getCategoryMinPrice() != null ?
                            p.getCategoryMinPrice().doubleValue() : 0.0))
                    .categoryMaxPrice(BigDecimal.valueOf(p.getCategoryMaxPrice() != null ?
                            p.getCategoryMaxPrice().doubleValue() : 0.0))
                    .analysisMethod(p.getAnalysisMethod())
                    .shouldNotifySeller(p.getShouldNotifySeller() != null ? p.getShouldNotifySeller() : false)
                    .analyzedAt(p.getAnalysisDate())
                    .build();
        }).toList();
    }

    private String getProductName(String productId) {
        try {
            return productRepository.findByAsin(productId)
                    .map(Product::getProductName)
                    .orElse("Unknown Product");
        } catch (Exception e) {
            return "Unknown Product";
        }
    }
}