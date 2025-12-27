package com.dashboard.service;

import com.dashboard.dto.response.RankingTrendResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.RankingTrendPrediction;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.RankingTrendPredictionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing ranking trend predictions.
 * ⚠️ EXPERIMENTAL: Uses synthetic labels - interpret with caution.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RankingTrendPredictionService {

    private final RankingTrendPredictionRepository predictionRepository;
    private final ProductRepository productRepository;
    private final MLServiceClient mlServiceClient;
    private final SellerNotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<RankingTrendResponse> getAllPredictions(Pageable pageable) {
        return predictionRepository.findAllByOrderByPredictionDateDesc(pageable)
                .map(RankingTrendResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<RankingTrendResponse> getDecliningProducts() {
        return predictionRepository.findByPredictedTrendOrderByConfidenceScoreDesc(
                        RankingTrendPrediction.PredictedTrend.DECLINING)
                .stream()
                .map(RankingTrendResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RankingTrendResponse getPredictionByProductId(String productId) {
        RankingTrendPrediction prediction = predictionRepository
                .findTopByProductIdOrderByPredictionDateDesc(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction", "productId", productId));
        return RankingTrendResponse.fromEntity(prediction);
    }

    @Transactional
    public Map<String, Object> refreshPredictions() {
        log.info("Refreshing ranking trend predictions from ML service...");

        List<Product> products = productRepository.findAllExcludingRejected();

        if (products.isEmpty()) {
            return Map.of("status", "no_products", "message", "No products to predict");
        }

        int successCount = 0;
        int failureCount = 0;

        for (Product product : products) {
            try {
                Map<String, Object> prediction = mlServiceClient.predictRankingTrend(product);

                if (prediction != null && !prediction.containsKey("error")) {
                    savePrediction(product, prediction);
                    successCount++;
                    checkAndNotifySeller(product, prediction);
                } else {
                    failureCount++;
                }
            } catch (Exception e) {
                failureCount++;
                log.error("Error predicting ranking for {}: {}", product.getAsin(), e.getMessage());
            }
        }

        return Map.of(
                "status", "completed",
                "totalProducts", products.size(),
                "successCount", successCount,
                "failureCount", failureCount,
                "timestamp", LocalDateTime.now().toString(),
                "experimental", true
        );
    }

    @Transactional
    public RankingTrendPrediction savePrediction(Product product, Map<String, Object> mlResponse) {
        String trend = String.valueOf(mlResponse.getOrDefault("predicted_trend", "STABLE"));
        BigDecimal confidence = new BigDecimal(String.valueOf(mlResponse.getOrDefault("confidence_score", 0.5)));
        int estimatedChange = ((Number) mlResponse.getOrDefault("estimated_change", 0)).intValue();
        String recommendation = String.valueOf(mlResponse.getOrDefault("recommendation", ""));

        RankingTrendPrediction.PredictedTrend predictedTrend;
        try {
            if (trend.contains("AMÉLIORATION") || trend.contains("IMPROVING")) {
                predictedTrend = RankingTrendPrediction.PredictedTrend.IMPROVING;
            } else if (trend.contains("DÉCLIN") || trend.contains("DECLINING")) {
                predictedTrend = RankingTrendPrediction.PredictedTrend.DECLINING;
            } else {
                predictedTrend = RankingTrendPrediction.PredictedTrend.STABLE;
            }
        } catch (Exception e) {
            predictedTrend = RankingTrendPrediction.PredictedTrend.STABLE;
        }

        int currentRank = product.getRanking() != null ? product.getRanking() : 999;
        int predictedRank = Math.max(1, currentRank - estimatedChange);

        RankingTrendPrediction prediction = RankingTrendPrediction.builder()
                .productId(product.getAsin())
                .currentRank(currentRank)
                .predictedTrend(predictedTrend)
                .confidenceScore(confidence)
                .estimatedChange(estimatedChange)
                .predictedRank(predictedRank)
                .recommendation(recommendation)
                .isExperimental(true)
                .predictionDate(LocalDateTime.now())
                .build();

        return predictionRepository.save(prediction);
    }

    private void checkAndNotifySeller(Product product, Map<String, Object> prediction) {
        if (product.getSeller() == null) return;

        String trend = String.valueOf(prediction.getOrDefault("predicted_trend", "STABLE"));
        double confidence = Double.parseDouble(String.valueOf(prediction.getOrDefault("confidence_score", 0.0)));

        if ((trend.contains("DECLINING") || trend.contains("DÉCLIN")) && confidence >= 0.70) {
            notificationService.sendDeclineTrendAlert(
                    product.getSeller().getId(),
                    product.getAsin(),
                    new BigDecimal(confidence)
            );
        }
    }
}