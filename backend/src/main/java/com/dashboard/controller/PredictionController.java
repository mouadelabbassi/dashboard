package com.dashboard.controller;

import com.dashboard.dto.request.PredictionRequestDTO;
import com.dashboard.dto.response.PredictionResponseDTO;
import com.dashboard.dto.response.PredictionStatsDTO;
import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import com.dashboard.service.FlaskMLClientService;
import com.dashboard.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Predictions", description = "ML Prediction endpoints")
public class PredictionController {

    private final PredictionService predictionService;
    private final FlaskMLClientService flaskClient;
    private final ProductRepository productRepository;

    @GetMapping("/health")
    @Operation(summary = "Check prediction service health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("springBootService", "UP");
        health.put("mlServiceAvailable", flaskClient.isServiceHealthy());
        flaskClient.getServiceStatus().ifPresent(status -> health.put("mlServiceStatus", status));
        return ResponseEntity.ok(health);
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get ML model metrics")
    public ResponseEntity<?> getModelMetrics() {
        return flaskClient.getModelMetrics()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    @PostMapping("/generate/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Generate prediction for a product")
    public ResponseEntity<PredictionResponseDTO> generatePrediction(@PathVariable String productId) {
        log.info("🔮 Demande de prédiction pour le produit: {}", productId);
        return predictionService.generatePredictionForProduct(productId)
                .map(pred -> {
                    log.info("✅ Prédiction générée avec succès pour: {}", productId);
                    return ResponseEntity.ok(pred);
                })
                .orElseGet(() -> {
                    log.warn("❌ Échec de génération de prédiction pour: {}", productId);
                    return ResponseEntity.notFound().build();
                });
    }

    @PostMapping("/generate/seller/{sellerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Generate predictions for all seller products")
    public ResponseEntity<List<PredictionResponseDTO>> generatePredictionsForSeller(@PathVariable Long sellerId) {
        log.info("🔮 Génération des prédictions pour le vendeur: {}", sellerId);
        List<PredictionResponseDTO> predictions = predictionService.generatePredictionsForSeller(sellerId);
        log.info("✅ {} prédictions générées pour le vendeur {}", predictions.size(), sellerId);
        return ResponseEntity.ok(predictions);
    }

    @PostMapping("/generate/all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate predictions for all products (async)")
    public ResponseEntity<Map<String, Object>> generateAllPredictions() {
        log.info("🚀 Déclenchement de la génération globale des prédictions");

        // Start async generation
        new Thread(() -> predictionService.generateDailyPredictions()).start();

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Génération des prédictions démarrée en arrière-plan");
        response.put("status", "PROCESSING");
        return ResponseEntity.accepted().body(response);
    }

    @PostMapping("/generate/sync")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Generate predictions synchronously (for testing)")
    public ResponseEntity<Map<String, Object>> generatePredictionsSync(
            @RequestParam(defaultValue = "10") int limit) {
        log.info("🔄 Génération synchrone de {} prédictions", limit);
        Map<String, Object> result = predictionService.generatePredictionsSync(limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get latest prediction for a product")
    public ResponseEntity<PredictionResponseDTO> getProductPrediction(@PathVariable String productId) {
        return predictionService.getLatestPrediction(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all latest predictions")
    public ResponseEntity<List<PredictionResponseDTO>> getAllPredictions() {
        List<PredictionResponseDTO> predictions = predictionService.getAllLatestPredictions();
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/bestsellers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get potential bestsellers")
    public ResponseEntity<List<PredictionResponseDTO>> getPotentialBestsellers() {
        List<PredictionResponseDTO> bestsellers = predictionService.getPotentialBestsellers();
        return ResponseEntity.ok(bestsellers);
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get predictions by category")
    public ResponseEntity<List<PredictionResponseDTO>> getPredictionsByCategory(@PathVariable String category) {
        List<PredictionResponseDTO> predictions = predictionService.getPredictionsByCategory(category);
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get prediction statistics")
    public ResponseEntity<PredictionStatsDTO> getPredictionStats() {
        PredictionStatsDTO stats = predictionService.getPredictionStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get prediction count and coverage")
    public ResponseEntity<Map<String, Object>> getPredictionCount() {
        long predictionCount = predictionService.getPredictionCount();
        long productCount = productRepository.count();
        boolean needsGeneration = predictionCount == 0 && productCount > 0;
        double coveragePercent = productCount > 0 ? ((double) predictionCount / productCount) * 100 : 0;

        Map<String, Object> response = new HashMap<>();
        response.put("predictionCount", predictionCount);
        response.put("productCount", productCount);
        response.put("needsGeneration", needsGeneration);
        response.put("coveragePercent", coveragePercent);

        log.info("📊 Prédictions: {}/{} produits ({}%)", predictionCount, productCount, String.format("%.1f", coveragePercent));

        return ResponseEntity.ok(response);
    }

    @GetMapping("/seller/{sellerId}/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get seller prediction alerts")
    public ResponseEntity<List<PredictionResponseDTO>> getSellerAlerts(@PathVariable Long sellerId) {
        List<PredictionResponseDTO> alerts = predictionService.getUnnotifiedPredictionsForSeller(sellerId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/advanced/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get advanced analysis")
    public ResponseEntity<?> getAdvancedAnalysis(@PathVariable String productId) {
        log.info("📊 Demande d'analyse avancée pour le produit: {}", productId);

        Optional<Product> productOpt = productRepository.findByAsin(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        PredictionRequestDTO request = buildPredictionRequest(product);

        return flaskClient.getFullAdvancedAnalysis(request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    @GetMapping("/health-score/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get health score")
    public ResponseEntity<?> getHealthScore(@PathVariable String productId) {
        log.info("💚 Demande de health score pour le produit: {}", productId);

        Optional<Product> productOpt = productRepository.findByAsin(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        PredictionRequestDTO request = buildPredictionRequest(product);

        return flaskClient.getHealthScore(request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    @GetMapping("/forecast/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get sales forecast")
    public ResponseEntity<?> getSalesForecast(
            @PathVariable String productId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("📈 Demande de prévision pour le produit: {} ({} jours)", productId, days);

        Optional<Product> productOpt = productRepository.findByAsin(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        PredictionRequestDTO request = buildPredictionRequest(product);

        return flaskClient.getSalesForecast(request, days)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    @GetMapping("/momentum/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get momentum analysis")
    public ResponseEntity<?> getMomentumAnalysis(@PathVariable String productId) {
        log.info("🚀 Demande d'analyse de momentum pour le produit: {}", productId);

        Optional<Product> productOpt = productRepository.findByAsin(productId);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        PredictionRequestDTO request = buildPredictionRequest(product);

        return flaskClient.getMomentumAnalysis(request)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    /**
     * 🔧 FIXED: Build prediction request from product with proper NULL handling
     * Supports both camelCase (Java) and snake_case (Python) field names
     */
    private PredictionRequestDTO buildPredictionRequest(Product product) {
        // Safely get price as double
        Double currentPrice = safeDouble(product.getPrice(), 0.0);

        // Safely get rating
        Double rating = safeDouble(product.getRating(), 3.0);

        // Safely get counts
        Integer reviewCount = safeInt(product.getReviewsCount(), 0);
        Integer salesCount = safeInt(product.getSalesCount(), 0);
        Integer stockQuantity = safeInt(product.getStockQuantity(), 100);

        // Calculate days since listed
        Integer daysSinceListed = calculateDaysSinceListed(product.getCreatedAt());

        // Safely get seller rating with fallback
        Double sellerRating = getSellerRating(product);

        // Safely get discount percentage
        Double discountPercentage = safeDouble(product.getDiscountPercentage(), 0.0);

        // Safely get category name
        String categoryName = getCategoryName(product);

        // Safely get ranking
        Integer ranking = safeInt(product.getRanking(), 100);

        log.debug("🔧 Built prediction request - Price: {}, Rating: {}, Reviews: {}, Sales: {}, Stock: {}, Days: {}, Seller: {}, Category: {}",
                currentPrice, rating, reviewCount, salesCount, stockQuantity, daysSinceListed, sellerRating, categoryName);

        return PredictionRequestDTO.builder()
                .productId(product.getAsin())
                .productName(product.getProductName())
                .currentPrice(currentPrice)
                .rating(rating)
                .reviewCount(reviewCount)
                .salesCount(salesCount)
                .stockQuantity(stockQuantity)
                .daysSinceListed(daysSinceListed)
                .sellerRating(sellerRating)
                .discountPercentage(discountPercentage)
                .category(categoryName)
                .currentRanking(ranking)
                .build();
    }

    /**
     * Helper methods for safe NULL handling
     */
    private Double safeDouble(BigDecimal value, Double defaultValue) {
        return (value != null) ? value.doubleValue() : defaultValue;
    }

    private Double safeDouble(Double value, Double defaultValue) {
        return (value != null) ? value : defaultValue;
    }

    private Integer safeInt(Integer value, Integer defaultValue) {
        return (value != null) ? value : defaultValue;
    }

    private Integer calculateDaysSinceListed(LocalDateTime createdAt) {
        if (createdAt != null) {
            long days = ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
            return (int) Math.max(0, days);
        }
        return 30; // Default
    }

    private Double getSellerRating(Product product) {
        if (product.getSeller() != null) {
            Double rating = product.getSeller().getSellerRating();
            if (rating != null && rating >= 1.0 && rating <= 5.0) {
                return rating;
            }
        }
        return 4.0; // Default seller rating
    }

    private String getCategoryName(Product product) {
        if (product.getCategory() != null && product.getCategory().getName() != null) {
            return product.getCategory().getName();
        }
        return "Electronics"; // Default category
    }
}