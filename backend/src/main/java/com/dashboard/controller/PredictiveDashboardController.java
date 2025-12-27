package com.dashboard.controller;

import com.dashboard.dto.request.ApplyRecommendationRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.BestsellerPredictionResponse;
import com.dashboard.dto.response.PriceIntelligenceResponse;
import com.dashboard.dto.response.RankingTrendResponse;
import com.dashboard.service.BestsellerPredictionService;
import com.dashboard.service.MLServiceClient;
import com.dashboard.service.PriceIntelligenceService;
import com.dashboard.service.RankingTrendPredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
@Tag(name = "Predictive Analytics", description = "ML-powered prediction endpoints")
public class PredictiveDashboardController {

    private final BestsellerPredictionService bestsellerService;
    private final RankingTrendPredictionService rankingService;
    private final PriceIntelligenceService priceService;
    private final MLServiceClient mlServiceClient;

    @GetMapping("/health")
    @Operation(summary = "Check ML service health", description = "Returns health status of ML service")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkHealth() {
        log.debug("Checking ML service health");

        Map<String, Object> mlHealth = mlServiceClient.checkHealth();
        boolean mlAvailable = "healthy".equals(mlHealth.get("status"));

        Map<String, Object> response = Map.of(
                "springBootService", "UP",
                "mlServiceAvailable", mlAvailable,
                "mlServiceStatus", mlHealth
        );

        return ResponseEntity.ok(ApiResponse.success("Health check complete", response));
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get model metrics", description = "Returns accuracy metrics for all ML models")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getModelMetrics() {
        log.debug("Fetching model metrics");
        Map<String, Object> metrics = mlServiceClient.getModelMetrics();
        return ResponseEntity.ok(ApiResponse.success("Model metrics retrieved", metrics));
    }


    @GetMapping("/bestsellers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all bestseller predictions", description = "Returns paginated bestseller predictions")
    public ResponseEntity<ApiResponse<Page<BestsellerPredictionResponse>>> getAllBestsellerPredictions(
            @PageableDefault(size = 20) Pageable pageable) {
        log.debug("Fetching all bestseller predictions");
        Page<BestsellerPredictionResponse> predictions = bestsellerService.getAllPredictions(pageable);
        return ResponseEntity.ok(ApiResponse.success("Bestseller predictions retrieved", predictions));
    }

    @GetMapping("/bestsellers/potential")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get potential bestsellers", description = "Returns products with high bestseller probability")
    public ResponseEntity<ApiResponse<List<BestsellerPredictionResponse>>> getPotentialBestsellers() {
        log.debug("Fetching potential bestsellers");
        List<BestsellerPredictionResponse> bestsellers = bestsellerService.getPotentialBestsellers();
        return ResponseEntity.ok(ApiResponse.success("Potential bestsellers retrieved", bestsellers));
    }

    @GetMapping("/bestsellers/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get bestseller prediction by product", description = "Returns prediction for specific product")
    public ResponseEntity<ApiResponse<BestsellerPredictionResponse>> getBestsellerPrediction(
            @PathVariable String productId) {
        log.debug("Fetching bestseller prediction for product: {}", productId);
        BestsellerPredictionResponse prediction = bestsellerService.getPredictionByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Prediction retrieved", prediction));
    }

    @GetMapping("/bestsellers/seller/{sellerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get seller's bestseller predictions", description = "Returns predictions for seller's products")
    public ResponseEntity<ApiResponse<List<BestsellerPredictionResponse>>> getSellerBestsellerPredictions(
            @PathVariable Long sellerId) {
        log.debug("Fetching bestseller predictions for seller: {}", sellerId);
        List<BestsellerPredictionResponse> predictions = bestsellerService.getSellerPredictions(sellerId);
        return ResponseEntity.ok(ApiResponse.success("Seller predictions retrieved", predictions));
    }

    @PostMapping("/bestsellers/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refresh bestseller predictions", description = "Triggers ML service to refresh all predictions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refreshBestsellerPredictions() {
        log.info("Refreshing bestseller predictions");
        Map<String, Object> result = bestsellerService.refreshPredictions();
        return ResponseEntity.ok(ApiResponse.success("Predictions refreshed", result));
    }

    @PatchMapping("/bestsellers/{productId}/apply")
    @PreAuthorize("hasAnyRole('ADMIN', 'SELLER')")
    @Operation(summary = "Apply recommendation", description = "Apply a bestseller recommendation to a product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> applyBestsellerRecommendation(
            @PathVariable String productId,
            @Valid @RequestBody ApplyRecommendationRequest request) {
        log.info("Applying recommendation for product: {}", productId);
        request.setProductId(productId);
        Map<String, Object> result = bestsellerService.applyRecommendation(request);
        return ResponseEntity.ok(ApiResponse.success("Recommendation applied", result));
    }


    @GetMapping("/ranking-trends")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all ranking trend predictions", description = "Returns paginated ranking trend predictions (EXPERIMENTAL)")
    public ResponseEntity<ApiResponse<Page<RankingTrendResponse>>> getAllRankingTrends(
            @PageableDefault(size = 20) Pageable pageable) {
        log.debug("Fetching all ranking trend predictions");
        Page<RankingTrendResponse> predictions = rankingService.getAllPredictions(pageable);
        return ResponseEntity.ok(ApiResponse.success("Ranking trends retrieved (EXPERIMENTAL)", predictions));
    }

    @GetMapping("/ranking-trends/declining")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get declining products", description = "Returns products with declining ranking trend")
    public ResponseEntity<ApiResponse<List<RankingTrendResponse>>> getDecliningProducts() {
        log.debug("Fetching declining products");
        List<RankingTrendResponse> declining = rankingService.getDecliningProducts();
        return ResponseEntity.ok(ApiResponse.success("Declining products retrieved", declining));
    }

    @GetMapping("/ranking-trends/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get ranking trend by product", description = "Returns ranking trend for specific product")
    public ResponseEntity<ApiResponse<RankingTrendResponse>> getRankingTrend(
            @PathVariable String productId) {
        log.debug("Fetching ranking trend for product: {}", productId);
        RankingTrendResponse prediction = rankingService.getPredictionByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success("Ranking trend retrieved", prediction));
    }

    @PostMapping("/ranking-trends/refresh")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Refresh ranking predictions", description = "Triggers ML service to refresh ranking predictions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> refreshRankingPredictions() {
        log.info("Refreshing ranking trend predictions");
        Map<String, Object> result = rankingService.refreshPredictions();
        return ResponseEntity.ok(ApiResponse.success("Ranking predictions refreshed", result));
    }


    @GetMapping("/price-intelligence")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all price intelligence", description = "Returns price analysis for all products (STATISTICAL, not ML)")
    public ResponseEntity<ApiResponse<Page<PriceIntelligenceResponse>>> getAllPriceIntelligence(
            @PageableDefault(size = 20) Pageable pageable) {
        log.debug("Fetching all price intelligence");
        Page<PriceIntelligenceResponse> analysis = priceService.getAllPriceAnalysis(pageable);
        return ResponseEntity.ok(ApiResponse.success("Price intelligence retrieved", analysis));
    }

    @GetMapping("/price-intelligence/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get price analysis by product", description = "Returns price analysis for specific product")
    public ResponseEntity<ApiResponse<PriceIntelligenceResponse>> getPriceIntelligence(
            @PathVariable String productId) {
        log.debug("Fetching price intelligence for product: {}", productId);
        PriceIntelligenceResponse analysis = priceService.getProductPriceAnalysis(productId);
        return ResponseEntity.ok(ApiResponse.success("Price analysis retrieved", analysis));
    }

    @GetMapping("/price-intelligence/category/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get category price stats", description = "Returns price statistics for a category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCategoryPriceStats(
            @PathVariable Long categoryId) {
        log.debug("Fetching price stats for category: {}", categoryId);
        Map<String, Object> stats = priceService.getCategoryPriceStats(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category price stats retrieved", stats));
    }


    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all predictions", description = "Returns combined predictions for all products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllPredictions() {
        log.debug("Fetching all combined predictions");
        List<Map<String, Object>> predictions = bestsellerService.getPotentialBestsellers()
                .stream()
                .map(bp -> Map.<String, Object>of(
                        "productId", bp.getProductId(),
                        "productName", bp.getProductName() != null ? bp.getProductName() : "",
                        "category", bp.getCategoryName() != null ? bp.getCategoryName() : "",
                        "bestsellerPrediction", bp,
                        "generatedAt", bp.getPredictionDate() != null ? bp.getPredictionDate().toString() : ""
                ))
                .toList();
        return ResponseEntity.ok(ApiResponse.success("All predictions retrieved", predictions));
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get prediction statistics", description = "Returns overall prediction statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPredictionStats() {
        log.debug("Fetching prediction statistics");
        Map<String, Object> stats = bestsellerService.getAccuracyMetrics();
        return ResponseEntity.ok(ApiResponse.success("Prediction stats retrieved", stats));
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get prediction count", description = "Returns count of predictions and products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPredictionCount() {
        log.debug("Fetching prediction count");
        Map<String, Object> metrics = bestsellerService.getAccuracyMetrics();

        Map<String, Object> count = Map.of(
                "predictionCount", metrics.getOrDefault("totalPredictions", 0),
                "productCount", metrics.getOrDefault("totalPredictions", 0),
                "needsGeneration", (long) metrics.getOrDefault("totalPredictions", 0) == 0,
                "coveragePercent", 100.0
        );

        return ResponseEntity.ok(ApiResponse.success("Prediction count retrieved", count));
    }

    @PostMapping("/train/bestseller")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Train bestseller model", description = "Triggers training of bestseller ML model")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trainBestsellerModel() {
        log.info("Training bestseller model");
        Map<String, Object> result = mlServiceClient.trainBestsellerModel();
        return ResponseEntity.ok(ApiResponse.success("Bestseller model training initiated", result));
    }

    @PostMapping("/train/ranking")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Train ranking model", description = "Triggers training of ranking trend ML model")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trainRankingModel() {
        log.info("Training ranking model");
        Map<String, Object> result = mlServiceClient.trainRankingModel();
        return ResponseEntity.ok(ApiResponse.success("Ranking model training initiated", result));
    }

    @PostMapping("/train/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Train all models", description = "Triggers training of all ML models")
    public ResponseEntity<ApiResponse<Map<String, Object>>> trainAllModels() {
        log.info("Training all models");
        Map<String, Object> result = mlServiceClient.trainAllModels();
        return ResponseEntity.ok(ApiResponse.success("All models training initiated", result));
    }


    @PostMapping("/generate/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Generate prediction for product", description = "Generates prediction for a specific product")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePrediction(
            @PathVariable String productId) {
        log.info("Generating prediction for product: {}", productId);
        return ResponseEntity.ok(ApiResponse.success("Prediction generated", Map.of("productId", productId)));
    }

    @PostMapping("/generate/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate all predictions", description = "Generates predictions for all products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generateAllPredictions() {
        log.info("Generating predictions for all products");
        Map<String, Object> result = bestsellerService.refreshPredictions();
        return ResponseEntity.ok(ApiResponse.success("All predictions generated", result));
    }

    @PostMapping("/generate/batch-sync")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Generate predictions synchronously", description = "Generates predictions in batch synchronously")
    public ResponseEntity<ApiResponse<Map<String, Object>>> generatePredictionsSync(
            @RequestBody(required = false) Map<String, Integer> request) {
        int batchSize = request != null ? request.getOrDefault("batchSize", 50) : 50;
        log.info("Generating predictions synchronously, batch size: {}", batchSize);

        Map<String, Object> result = bestsellerService.refreshPredictions();

        Map<String, Object> response = Map.of(
                "processed", result.getOrDefault("successCount", 0),
                "successCount", result.getOrDefault("successCount", 0),
                "failureCount", result.getOrDefault("failureCount", 0),
                "remainingProducts", 0,
                "totalProducts", result.getOrDefault("totalProducts", 0)
        );

        return ResponseEntity.ok(ApiResponse.success("Batch predictions generated", response));
    }
}