package com.dashboard.controller;

import com.dashboard.dto.response.*;
import com.dashboard.service.PredictionCacheService;
import com.dashboard.service.PredictionService;
import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.Data;
import lombok.Builder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
@Tag(name = "Predictions", description = "ML Prediction APIs")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PredictionController {

    private final PredictionService predictionService;
    private final ProductRepository productRepository;
    private final PredictionCacheService predictionCacheService;

    @GetMapping("/product/{asin}")
    @Operation(summary = "Get complete predictions for a product")
    public ResponseEntity<CompletePredictionResponse> getProductPredictions(@PathVariable String asin) {
        try {
            CompletePredictionResponse prediction = predictionService.getCompletePrediction(asin);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.error("Error getting predictions for product {}: {}", asin, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/bestseller/{asin}")
    @Operation(summary = "Get bestseller prediction for a product")
    public ResponseEntity<BestsellerPredictionResponse> getBestsellerPrediction(@PathVariable String asin) {
        try {
            BestsellerPredictionResponse prediction = predictionService.predictBestseller(asin);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.error("Error getting bestseller prediction for {}: {}", asin, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/ranking/{asin}")
    @Operation(summary = "Get ranking trend prediction for a product")
    public ResponseEntity<RankingTrendPredictionResponse> getRankingPrediction(@PathVariable String asin) {
        try {
            RankingTrendPredictionResponse prediction = predictionService.predictRankingTrend(asin);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.error("Error getting ranking prediction for {}: {}", asin, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/pricing/{asin}")
    @Operation(summary = "Get price intelligence for a product")
    public ResponseEntity<PriceIntelligenceResponse> getPricePrediction(@PathVariable String asin) {
        try {
            PriceIntelligenceResponse prediction = predictionService.analyzePricing(asin);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.error("Error getting price intelligence for {}: {}", asin, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/all")
    @Operation(summary = "Get all predictions for all products")
    public ResponseEntity<List<ProductPredictionDTO>> getAllPredictions() {
        try {
            // Get all products from database
            List<Product> products = productRepository.findAll();

            List<ProductPredictionDTO> result = products.stream()
                    .limit(100) // Limit to first 100 for performance
                    .map(product -> {
                        try {
                            CompletePredictionResponse complete = predictionService.getCompletePrediction(product.getAsin());

                            return ProductPredictionDTO.builder()
                                    .productId(product.getAsin())
                                    .productName(product.getProductName())
                                    .category(product.getCategory() != null ? product.getCategory().getName() : "N/A")
                                    .bestsellerPrediction(mapBestsellerPrediction(complete.getBestseller()))
                                    .rankingPrediction(mapRankingPrediction(complete.getRankingTrend()))
                                    .pricePrediction(mapPricePrediction(complete.getPriceIntelligence()))
                                    .generatedAt(formatDateTime(String.valueOf(complete.getPredictedAt())))
                                    .build();
                        } catch (Exception e) {
                            log.error("Error getting predictions for {}: {}", product.getAsin(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting all predictions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/bestsellers")
    @Operation(summary = "Get all potential bestsellers with full product info")
    public ResponseEntity<List<ProductPredictionDTO>> getAllBestsellers() {
        try {
            List<BestsellerPredictionResponse> bestsellers = predictionService.getAllPotentialBestsellers();

            List<ProductPredictionDTO> result = bestsellers.stream()
                    .map(bs -> {
                        try {
                            Product product = productRepository.findByAsin(bs.getProductId())
                                    .orElse(null);

                            if (product == null) return null;

                            // Get full predictions
                            CompletePredictionResponse complete = predictionService.getCompletePrediction(bs.getProductId());

                            return ProductPredictionDTO.builder()
                                    .productId(product.getAsin())
                                    .productName(product.getProductName())
                                    .category(product.getCategory() != null ? product.getCategory().getName() : "N/A")
                                    .bestsellerPrediction(mapBestsellerPrediction(complete.getBestseller()))
                                    .rankingPrediction(mapRankingPrediction(complete.getRankingTrend()))
                                    .pricePrediction(mapPricePrediction(complete.getPriceIntelligence()))
                                    .generatedAt(formatDateTime(String.valueOf(complete.getPredictedAt())))
                                    .build();
                        } catch (Exception e) {
                            log.error("Error mapping bestseller {}: {}", bs.getProductId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting all bestsellers: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/bestsellers/category/{categoryId}")
    @Operation(summary = "Get potential bestsellers for a category")
    public ResponseEntity<List<ProductPredictionDTO>> getCategoryBestsellers(@PathVariable Long categoryId) {
        try {
            List<BestsellerPredictionResponse> bestsellers = predictionService.predictBestsellersForCategory(categoryId);

            List<ProductPredictionDTO> result = bestsellers.stream()
                    .map(bs -> {
                        try {
                            Product product = productRepository.findByAsin(bs.getProductId())
                                    .orElse(null);

                            if (product == null) return null;

                            CompletePredictionResponse complete = predictionService.getCompletePrediction(bs.getProductId());

                            return ProductPredictionDTO.builder()
                                    .productId(product.getAsin())
                                    .productName(product.getProductName())
                                    .category(product.getCategory() != null ? product.getCategory().getName() : "N/A")
                                    .bestsellerPrediction(mapBestsellerPrediction(complete.getBestseller()))
                                    .rankingPrediction(mapRankingPrediction(complete.getRankingTrend()))
                                    .pricePrediction(mapPricePrediction(complete.getPriceIntelligence()))
                                    .generatedAt(formatDateTime(String.valueOf(complete.getPredictedAt())))
                                    .build();
                        } catch (Exception e) {
                            log.error("Error mapping bestseller {}: {}", bs.getProductId(), e.getMessage());
                            return null;
                        }
                    })
                    .filter(dto -> dto != null)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting category bestsellers: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh predictions for all products")
    public ResponseEntity<Void> refreshPredictions() {
        try {
            predictionService.refreshPredictionsForAllProducts();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error refreshing predictions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/train")
    @Operation(summary = "Trigger model training")
    public ResponseEntity<Void> trainModels() {
        try {
            predictionService.triggerModelTraining();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Error training models: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    @Operation(summary = "Get prediction statistics")
    public ResponseEntity<PredictionStatsDTO> getStats() {
        try {
            List<Product> products = productRepository.findAll();

            int totalPredictions = products.size();
            int potentialBestsellers = 0;
            int improvingProducts = 0;
            int priceRecommendations = 0;

            for (Product product : products) {
                try {
                    CompletePredictionResponse pred = predictionService.getCompletePrediction(product.getAsin());

                    if (pred.getBestseller().getIsPotentialBestseller()) {
                        potentialBestsellers++;
                    }

                    if ("IMPROVING".equals(pred.getRankingTrend().getPredictedTrend())) {
                        improvingProducts++;
                    }

                    if (!"MAINTAIN".equals(pred.getPriceIntelligence().getPriceAction())) {
                        priceRecommendations++;
                    }
                } catch (Exception e) {
                    // Skip errors for individual products
                }
            }

            PredictionStatsDTO stats = PredictionStatsDTO.builder()
                    .totalPredictions(totalPredictions)
                    .potentialBestsellersCount(potentialBestsellers)
                    .productsWithRankingImprovement(improvingProducts)
                    .productsWithPriceRecommendation(priceRecommendations)
                    .averageBestsellerProbability(0.0)
                    .averagePriceChangeRecommended(0.0)
                    .build();

            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting stats: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    // Helper methods
    private String formatDateTime(String dateTime) {
        if (dateTime == null) {
            return LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        }
        return dateTime;
    }

    private BestsellerPredictionDTO mapBestsellerPrediction(BestsellerPredictionResponse response) {
        return BestsellerPredictionDTO.builder()
                .bestsellerProbability(response.getBestsellerProbability())
                .isPotentialBestseller(response.getIsPotentialBestseller())
                .potentialLevel(response.getPotentialLevel())
                .recommendation(response.getRecommendation())
                .confidence(response.getConfidenceLevel().equals("HIGH") ? 0.9 :
                        response.getConfidenceLevel().equals("MEDIUM") ? 0.7 : 0.5)
                .build();
    }

    private RankingPredictionDTO mapRankingPrediction(RankingTrendPredictionResponse response) {
        return RankingPredictionDTO.builder()
                .predictedRanking(response.getPredictedRank())
                .currentRanking(response.getCurrentRank())
                .rankingChange(response.getEstimatedChange())
                .trend(response.getPredictedTrend())
                .trendDescription(response.getRecommendation())
                .confidence(response.getConfidenceScore())
                .build();
    }

    private PricePredictionDTO mapPricePrediction(PriceIntelligenceResponse response) {
        String recommendation = "Maintenir le prix actuel";
        if (response.getPriceAction() != null) {
            switch (response.getPriceAction()) {
                case "INCREASE":
                    recommendation = "Augmenter le prix";
                    break;
                case "DECREASE":
                    recommendation = "Diminuer le prix";
                    break;
            }
        }

        return PricePredictionDTO.builder()
                .recommendedPrice(response.getRecommendedPrice().doubleValue())
                .currentPrice(response.getCurrentPrice().doubleValue())
                .priceDifference(response.getPriceDifference().doubleValue())
                .priceChangePercentage(response.getPriceChangePercentage())
                .priceAction(response.getPriceAction())
                .actionDescription(recommendation)
                .shouldNotifySeller(response.getShouldNotifySeller())
                .confidence(0.85)
                .build();
    }
    @GetMapping("/latest")
    @Operation(summary = "Get latest predictions from cache (instant)")
    public ResponseEntity<LatestPredictionsResponse> getLatestPredictions() {
        log.info(" GET /api/predictions/latest - CACHE ENDPOINT");
        LatestPredictionsResponse response = predictionCacheService.getLatestPredictions();
        log.info("Returning {} cached predictions", response.getTotalCount());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-async")
    @Operation(summary = "Trigger background prediction refresh")
    public ResponseEntity<Map<String, Object>> triggerBackgroundRefresh() {
        log.info("POST /api/predictions/refresh-async");

        if (predictionCacheService.isRefreshCurrentlyRunning()) {
            return ResponseEntity.ok(Map.of(
                    "message", "Refresh already in progress",
                    "status", "RUNNING"
            ));
        }

        predictionCacheService.refreshPredictionsInBackground();

        return ResponseEntity.ok(Map.of(
                "message", "Background refresh started",
                "status", "STARTED"
        ));
    }

    @GetMapping("/refresh-status")
    @Operation(summary = "Check if refresh is currently running")
    public ResponseEntity<Map<String, Object>> getRefreshStatus() {
        boolean isRefreshing = predictionCacheService.isRefreshCurrentlyRunning();
        return ResponseEntity.ok(Map.of(
                "isRefreshing", isRefreshing,
                "status", isRefreshing ? "RUNNING" : "IDLE"
        ));
    }
}

@Data
@Builder
class ProductPredictionDTO {
    private String productId;
    private String productName;
    private String category;
    private BestsellerPredictionDTO bestsellerPrediction;
    private RankingPredictionDTO rankingPrediction;
    private PricePredictionDTO pricePrediction;
    private String generatedAt;
}

@Data
@Builder
class BestsellerPredictionDTO {
    private Double bestsellerProbability;
    private Boolean isPotentialBestseller;
    private String potentialLevel;
    private String recommendation;
    private Double confidence;
}

@Data
@Builder
class RankingPredictionDTO {
    private Integer predictedRanking;
    private Integer currentRanking;
    private Integer rankingChange;
    private String trend;
    private String trendDescription;
    private Double confidence;
}

@Data
@Builder
class PricePredictionDTO {
    private Double recommendedPrice;
    private Double currentPrice;
    private Double priceDifference;
    private Double priceChangePercentage;
    private String priceAction;
    private String actionDescription;
    private Boolean shouldNotifySeller;
    private Double confidence;
}

@Data
@Builder
class PredictionStatsDTO {
    private Integer totalPredictions;
    private Integer potentialBestsellersCount;
    private Integer productsWithRankingImprovement;
    private Integer productsWithPriceRecommendation;
    private Double averageBestsellerProbability;
    private Double averagePriceChangeRecommended;
}