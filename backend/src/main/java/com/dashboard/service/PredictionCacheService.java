package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import com.dashboard.dto.response.*;
import com.dashboard.dto.request.PredictionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionCacheService {

    private final BestsellerPredictionRepository bestsellerRepo;
    private final RankingTrendPredictionRepository rankingRepo;
    private final PriceIntelligenceEntityRepository priceRepo;
    private final PredictionRefreshLogRepository refreshLogRepo;
    private final ProductRepository productRepository;
    private final MLServiceClient mlServiceClient;

    private static final String REFRESH_TYPE_ALL = "ALL_PRODUCTS";
    private final AtomicBoolean isRefreshRunning = new AtomicBoolean(false);
    @Transactional(readOnly = true)
    public LatestPredictionsResponse getLatestPredictions() {
        log.info(" READING FROM DB CACHE ");
        long start = System.currentTimeMillis();

        Pageable pageable = PageRequest.of(0, 500);

        Page<BestsellerPrediction> bsPage = bestsellerRepo.findAllByOrderByPredictionDateDesc(pageable);
        List<BestsellerPrediction> bestsellers = bsPage.getContent();
        log.info(" Bestsellers: {}", bestsellers.size());

        Page<RankingTrendPrediction> rkPage = rankingRepo.findAllByOrderByPredictionDateDesc(pageable);
        List<RankingTrendPrediction> rankings = rkPage.getContent();
        log.info("Rankings: {}", rankings.size());

        Page<PriceIntelligenceEntity> prPage = priceRepo.findAllByOrderByAnalysisDateDesc(pageable);
        List<PriceIntelligenceEntity> prices = prPage.getContent();
        log.info(" Prices: {}", prices.size());

        PredictionRefreshLog lastRefresh = null;
        try {
            lastRefresh = refreshLogRepo.findLatestSuccessfulRefresh(REFRESH_TYPE_ALL).orElse(null);
        } catch (Exception ignored) {}

        log.info(" DB read: {}ms", System.currentTimeMillis() - start);

        return LatestPredictionsResponse.builder()
                .bestsellerPredictions(mapBestsellers(bestsellers))
                .rankingPredictions(mapRankings(rankings))
                .priceIntelligence(mapPrices(prices))
                .totalCount(Math.max(bestsellers.size(), Math.max(rankings.size(), prices.size())))
                .lastRefreshedAt(lastRefresh != null ? lastRefresh.getCompletedAt() : null)
                .isRefreshing(isRefreshRunning.get())
                .fromCache(true)
                .build();
    }

    public boolean isRefreshCurrentlyRunning() {
        return isRefreshRunning.get();
    }

    @Async("predictionExecutor")
    public void refreshPredictionsInBackground() {
        if (!isRefreshRunning.compareAndSet(false, true)) {
            log.warn("Refresh already running");
            return;
        }

        log.info(" BACKGROUND REFRESH START");
        PredictionRefreshLog refreshLog = null;

        try {
            refreshLog = PredictionRefreshLog.builder()
                    .refreshType(REFRESH_TYPE_ALL)
                    .startedAt(LocalDateTime.now())
                    .status(PredictionRefreshLog.RefreshStatus.RUNNING)
                    .totalProducts(0).successCount(0).errorCount(0)
                    .build();
            refreshLog = refreshLogRepo.save(refreshLog);

            List<Product> products = productRepository.findAll();
            refreshLog.setTotalProducts(products.size());
            refreshLogRepo.save(refreshLog);

            AtomicInteger success = new AtomicInteger(0);
            AtomicInteger errors = new AtomicInteger(0);

            for (int i = 0; i < products.size(); i += 50) {
                int end = Math.min(i + 50, products.size());
                for (Product product : products.subList(i, end)) {
                    try {
                        mlServiceClient.predictComplete(buildRequest(product));
                        success.incrementAndGet();
                    } catch (Exception e) {
                        errors.incrementAndGet();
                    }
                }
                try { Thread.sleep(100); } catch (InterruptedException e) { break; }
            }

            refreshLog.setCompletedAt(LocalDateTime.now());
            refreshLog.setStatus(PredictionRefreshLog.RefreshStatus.COMPLETED);
            refreshLog.setSuccessCount(success.get());
            refreshLog.setErrorCount(errors.get());
            refreshLogRepo.save(refreshLog);

            log.info(" REFRESH DONE: {} ok, {} err", success.get(), errors.get());

        } catch (Exception e) {
            log.error(" Refresh failed", e);
            if (refreshLog != null) {
                refreshLog.setCompletedAt(LocalDateTime.now());
                refreshLog.setStatus(PredictionRefreshLog.RefreshStatus.FAILED);
                refreshLog.setErrorMessage(e.getMessage());
                refreshLogRepo.save(refreshLog);
            }
        } finally {
            isRefreshRunning.set(false);
        }
    }

    private PredictionRequest buildRequest(Product product) {
        PredictionRequest.PredictionRequestBuilder b = PredictionRequest.builder()
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
            Pageable pg = PageRequest.of(0, 100);
            List<Product> cat = productRepository.findByCategoryId(product.getCategory().getId(), pg).getContent();
            if (!cat.isEmpty()) {
                BigDecimal avg = cat.stream().map(Product::getPrice).filter(p -> p != null).reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(cat.size()), 2, RoundingMode.HALF_UP);
                BigDecimal min = cat.stream().map(Product::getPrice).filter(p -> p != null).min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                BigDecimal max = cat.stream().map(Product::getPrice).filter(p -> p != null).max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                Double avgR = cat.stream().map(Product::getReviewsCount).filter(c -> c != null).mapToDouble(Integer::doubleValue).average().orElse(0.0);
                b.categoryAvgPrice(avg).categoryMinPrice(min).categoryMaxPrice(max).categoryAvgReviews(avgR);
            }
        }
        return b.build();
    }

    private List<BestsellerPredictionResponse> mapBestsellers(List<BestsellerPrediction> list) {
        List<BestsellerPredictionResponse> r = new ArrayList<>();
        for (BestsellerPrediction p : list) {
            try {
                String n = p.getProductId();
                if (p.getProduct() != null) n = p.getProduct().getProductName();
                r.add(BestsellerPredictionResponse.builder()
                        .productId(p.getProductId()).productName(n)
                        .bestsellerProbability(p.getPredictedProbability() != null ? p.getPredictedProbability().doubleValue() : 0.0)
                        .isPotentialBestseller(p.isPotentialBestseller())
                        .confidenceLevel(p.getConfidenceLevel() != null ? p.getConfidenceLevel().name() : "LOW")
                        .potentialLevel(p.getPotentialLevel())
                        .recommendation(p.getRecommendation())
                        .predictedAt(p.getPredictionDate())
                        .build());
            } catch (Exception ignored) {}
        }
        return r;
    }

    private List<RankingTrendPredictionResponse> mapRankings(List<RankingTrendPrediction> list) {
        List<RankingTrendPredictionResponse> r = new ArrayList<>();
        for (RankingTrendPrediction p : list) {
            try {
                String n = p.getProductId();
                if (p.getProduct() != null) n = p.getProduct().getProductName();
                r.add(RankingTrendPredictionResponse.builder()
                        .productId(p.getProductId()).productName(n)
                        .currentRank(p.getCurrentRank())
                        .predictedTrend(p.getPredictedTrend() != null ? p.getPredictedTrend().name() : "STABLE")
                        .confidenceScore(p.getConfidenceScore() != null ? p.getConfidenceScore().doubleValue() : 0.0)
                        .estimatedChange(p.getEstimatedChange())
                        .predictedRank(p.getPredictedRank())
                        .recommendation(p.getRecommendation())
                        .isExperimental(p.getIsExperimental() != null ? p.getIsExperimental() : true)
                        .predictedAt(p.getPredictionDate())
                        .build());
            } catch (Exception ignored) {}
        }
        return r;
    }

    private List<PriceIntelligenceResponse> mapPrices(List<PriceIntelligenceEntity> list) {
        List<PriceIntelligenceResponse> r = new ArrayList<>();
        for (PriceIntelligenceEntity p : list) {
            try {
                String n = p.getProductId();
                if (p.getProduct() != null) n = p.getProduct().getProductName();
                r.add(PriceIntelligenceResponse.builder()
                        .productId(p.getProductId()).productName(n)
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
            } catch (Exception ignored) {}
        }
        return r;
    }
}