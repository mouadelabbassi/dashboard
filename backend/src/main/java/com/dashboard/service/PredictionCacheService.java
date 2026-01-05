package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import com.dashboard.dto.response.*;
import com.dashboard.dto.request.PredictionRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class PredictionCacheService {

    private final BestsellerPredictionRepository bestsellerRepo;
    private final RankingTrendPredictionRepository rankingRepo;
    private final PriceIntelligenceEntityRepository priceRepo;
    private final PredictionRefreshLogRepository refreshLogRepo;
    private final ProductRepository productRepository;
    private final MLServiceClient mlServiceClient;
    private final ApplicationContext applicationContext;

    private static final String REFRESH_TYPE_ALL = "ALL_PRODUCTS";
    private static final int CACHE_PAGE_SIZE = 500;
    private static final int BATCH_SIZE = 50;
    private static final long BATCH_DELAY_MS = 100;

    private final AtomicBoolean isRefreshRunning = new AtomicBoolean(false);
    private volatile LocalDateTime lastRefreshStarted = null;
    private volatile LocalDateTime lastRefreshCompleted = null;
    private volatile int lastRefreshSuccessCount = 0;
    private volatile int lastRefreshErrorCount = 0;

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
        log.info("CACHE_READ: Starting database cache fetch");
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

    private int calculateTotalCount(List<BestsellerPrediction> bs, List<RankingTrendPrediction> rk, List<PriceIntelligenceEntity> pr) {
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
            refreshLog = createRefreshLog();
            List<Product> products = productRepository.findAll();

            updateRefreshLogProductCount(refreshLog, products.size());
            log.info("REFRESH_PROGRESS: Processing {} products", products.size());

            processBatches(products, successCount, errorCount);

            finalizeRefreshLog(refreshLog, successCount.get(), errorCount.get(), PredictionRefreshLog.RefreshStatus.COMPLETED);

            lastRefreshSuccessCount = successCount.get();
            lastRefreshErrorCount = errorCount.get();
            lastRefreshCompleted = LocalDateTime.now();

            log.info("REFRESH_COMPLETE: Success={} Errors={}", successCount.get(), errorCount.get());

        } catch (Exception e) {
            log.error("REFRESH_FAILED: {}", e.getMessage(), e);
            handleRefreshFailure(refreshLog, e.getMessage());
        } finally {
            isRefreshRunning.set(false);
        }
    }

    private PredictionRefreshLog createRefreshLog() {
        PredictionRefreshLog log = PredictionRefreshLog.builder()
                .refreshType(REFRESH_TYPE_ALL)
                .startedAt(LocalDateTime.now())
                .status(PredictionRefreshLog.RefreshStatus.RUNNING)
                .totalProducts(0)
                .successCount(0)
                .errorCount(0)
                .build();
        return refreshLogRepo.save(log);
    }

    private void updateRefreshLogProductCount(PredictionRefreshLog refreshLog, int count) {
        refreshLog.setTotalProducts(count);
        refreshLogRepo.save(refreshLog);
    }

    private void processBatches(List<Product> products, AtomicInteger successCount, AtomicInteger errorCount) {
        int totalProducts = products.size();

        for (int i = 0; i < totalProducts; i += BATCH_SIZE) {
            int end = Math.min(i + BATCH_SIZE, totalProducts);
            List<Product> batch = products.subList(i, end);

            processSingleBatch(batch, successCount, errorCount);

            if (i + BATCH_SIZE < totalProducts) {
                sleepBetweenBatches();
            }

            int progress = (int) ((double) (i + batch.size()) / totalProducts * 100);
            log.debug("REFRESH_PROGRESS: {}% complete ({}/{})", progress, i + batch.size(), totalProducts);
        }
    }

    private void processSingleBatch(List<Product> batch, AtomicInteger successCount, AtomicInteger errorCount) {
        for (Product product : batch) {
            try {
                PredictionRequest request = buildRequest(product);
                mlServiceClient.predictComplete(request);
                successCount.incrementAndGet();
            } catch (Exception e) {
                errorCount.incrementAndGet();
                log.debug("REFRESH_ITEM_ERROR: Product {} - {}", product.getAsin(), e.getMessage());
            }
        }
    }

    private void sleepBetweenBatches() {
        try {
            Thread.sleep(BATCH_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("REFRESH_INTERRUPTED: Batch processing interrupted");
        }
    }

    private void finalizeRefreshLog(PredictionRefreshLog refreshLog, int success, int errors, PredictionRefreshLog.RefreshStatus status) {
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
            Pageable pageable = PageRequest.of(0, 100);
            List<Product> categoryProducts = productRepository.findByCategoryId(categoryId, pageable).getContent();

            if (!categoryProducts.isEmpty()) {
                BigDecimal avgPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(categoryProducts.size()), 2, RoundingMode.HALF_UP);

                BigDecimal minPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                BigDecimal maxPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                Double avgReviews = categoryProducts.stream()
                        .map(Product::getReviewsCount)
                        .filter(c -> c != null)
                        .mapToDouble(Integer::doubleValue)
                        .average()
                        .orElse(0.0);

                builder.categoryAvgPrice(avgPrice)
                        .categoryMinPrice(minPrice)
                        .categoryMaxPrice(maxPrice)
                        .categoryAvgReviews(avgReviews);
            }
        } catch (Exception e) {
            log.debug("ENRICH_WARN: Could not enrich category data - {}", e.getMessage());
        }
    }

    private List<BestsellerPredictionResponse> mapBestsellers(List<BestsellerPrediction> list) {
        List<BestsellerPredictionResponse> result = new ArrayList<>(list.size());
        for (BestsellerPrediction p : list) {
            try {
                String productName = resolveProductName(p.getProductId(), p.getProduct());
                result.add(BestsellerPredictionResponse.builder()
                        .productId(p.getProductId())
                        .productName(productName)
                        .bestsellerProbability(p.getPredictedProbability() != null ? p.getPredictedProbability().doubleValue() : 0.0)
                        .isPotentialBestseller(p.isPotentialBestseller())
                        .confidenceLevel(p.getConfidenceLevel() != null ? p.getConfidenceLevel().name() : "LOW")
                        .potentialLevel(p.getPotentialLevel())
                        .recommendation(p.getRecommendation())
                        .predictedAt(p.getPredictionDate())
                        .build());
            } catch (Exception e) {
                log.debug("MAP_WARN: Skipping bestseller {} - {}", p.getProductId(), e.getMessage());
            }
        }
        return result;
    }

    private List<RankingTrendPredictionResponse> mapRankings(List<RankingTrendPrediction> list) {
        List<RankingTrendPredictionResponse> result = new ArrayList<>(list.size());
        for (RankingTrendPrediction p : list) {
            try {
                String productName = resolveProductName(p.getProductId(), p.getProduct());
                result.add(RankingTrendPredictionResponse.builder()
                        .productId(p.getProductId())
                        .productName(productName)
                        .currentRank(p.getCurrentRank())
                        .predictedTrend(p.getPredictedTrend() != null ? p.getPredictedTrend().name() : "STABLE")
                        .confidenceScore(p.getConfidenceScore() != null ? p.getConfidenceScore().doubleValue() : 0.0)
                        .estimatedChange(p.getEstimatedChange())
                        .predictedRank(p.getPredictedRank())
                        .recommendation(p.getRecommendation())
                        .isExperimental(p.getIsExperimental() != null ? p.getIsExperimental() : true)
                        .predictedAt(p.getPredictionDate())
                        .build());
            } catch (Exception e) {
                log.debug("MAP_WARN: Skipping ranking {} - {}", p.getProductId(), e.getMessage());
            }
        }
        return result;
    }

    private List<PriceIntelligenceResponse> mapPrices(List<PriceIntelligenceEntity> list) {
        List<PriceIntelligenceResponse> result = new ArrayList<>(list.size());
        for (PriceIntelligenceEntity p : list) {
            try {
                String productName = resolveProductName(p.getProductId(), p.getProduct());
                result.add(PriceIntelligenceResponse.builder()
                        .productId(p.getProductId())
                        .productName(productName)
                        .currentPrice(p.getCurrentPrice())
                        .recommendedPrice(p.getRecommendedPrice())
                        .priceDifference(p.getPriceDifference())
                        .priceChangePercentage(p.getPriceChangePercentage() != null ? p.getPriceChangePercentage().doubleValue() : 0.0)
                        .priceAction(p.getPriceAction())
                        .positioning(p.getPositioning())
                        .categoryAvgPrice(p.getCategoryAvgPrice())
                        .categoryMinPrice(p.getCategoryMinPrice())
                        .categoryMaxPrice(p.getCategoryMaxPrice())
                        .analysisMethod(p.getAnalysisMethod())
                        .shouldNotifySeller(p.getShouldNotifySeller() != null ? p.getShouldNotifySeller() : false)
                        .analyzedAt(p.getAnalysisDate())
                        .build());
            } catch (Exception e) {
                log.debug("MAP_WARN: Skipping price {} - {}", p.getProductId(), e.getMessage());
            }
        }
        return result;
    }

    private String resolveProductName(String productId, Product product) {
        if (product != null && product.getProductName() != null) {
            return product.getProductName();
        }
        return productId;
    }
}