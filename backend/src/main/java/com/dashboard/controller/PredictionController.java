package com.dashboard.controller;

import com.dashboard.dto.request.PredictionRequestDTO;
import com.dashboard.dto.response.PredictionResponseDTO;
import com.dashboard.dto.response.PredictionStatsDTO;
import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import com.dashboard.service.FlaskMLClientService;
import com.dashboard.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
public class PredictionController {

    private final PredictionService predictionService;
    private final FlaskMLClientService flaskClient;
    private final ProductRepository productRepository;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("springBootService", "UP");
        health.put("mlServiceAvailable", flaskClient.isServiceHealthy());
        flaskClient.getServiceStatus().ifPresent(status -> health.put("mlServiceStatus", status));
        return ResponseEntity.ok(health);
    }

    @GetMapping("/metrics")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<?> getModelMetrics() {
        return flaskClient.getModelMetrics()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
    }

    @PostMapping("/generate/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    public ResponseEntity<PredictionResponseDTO> generatePrediction(@PathVariable String productId) {
        log.info("Demande de prédiction pour le produit: {}", productId);
        return predictionService.generatePredictionForProduct(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/generate/seller/{sellerId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    public ResponseEntity<List<PredictionResponseDTO>> generatePredictionsForSeller(@PathVariable Long sellerId) {
        log.info("Génération des prédictions pour le vendeur: {}", sellerId);
        List<PredictionResponseDTO> predictions = predictionService.generatePredictionsForSeller(sellerId);
        return ResponseEntity.ok(predictions);
    }

    @PostMapping("/generate/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> generateAllPredictions() {
        log.info("Déclenchement de la génération globale des prédictions");
        new Thread(() -> predictionService.generateDailyPredictions()).start();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Génération des prédictions démarrée en arrière-plan");
        response.put("status", "PROCESSING");
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/product/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    public ResponseEntity<PredictionResponseDTO> getProductPrediction(@PathVariable String productId) {
        return predictionService.getLatestPrediction(productId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<PredictionResponseDTO>> getAllPredictions() {
        List<PredictionResponseDTO> predictions = predictionService.getAllLatestPredictions();
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/bestsellers")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<PredictionResponseDTO>> getPotentialBestsellers() {
        List<PredictionResponseDTO> bestsellers = predictionService.getPotentialBestsellers();
        return ResponseEntity.ok(bestsellers);
    }

    @GetMapping("/category/{category}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<PredictionResponseDTO>> getPredictionsByCategory(@PathVariable String category) {
        List<PredictionResponseDTO> predictions = predictionService.getPredictionsByCategory(category);
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<PredictionStatsDTO> getPredictionStats() {
        PredictionStatsDTO stats = predictionService.getPredictionStats();
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<Map<String, Object>> getPredictionCount() {
        long count = predictionService.getPredictionCount();
        long productCount = productRepository.count();
        Map<String, Object> response = new HashMap<>();
        response.put("predictionCount", count);
        response.put("productCount", productCount);
        response.put("needsGeneration", count == 0 && productCount > 0);
        response.put("coveragePercent", productCount > 0 ? (count * 100.0 / productCount) : 0);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/generate/sync")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> generatePredictionsSync(
            @RequestParam(defaultValue = "50") int limit) {
        log.info("Génération synchrone des prédictions (limite: {})", limit);

        if (!flaskClient.isServiceHealthy()) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("message", "Service ML non disponible. Veuillez démarrer le microservice Flask.");
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(error);
        }

        Map<String, Object> result = predictionService.generatePredictionsSync(limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/seller/{sellerId}/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    public ResponseEntity<List<PredictionResponseDTO>> getSellerAlerts(@PathVariable Long sellerId) {
        List<PredictionResponseDTO> alerts = predictionService.getUnnotifiedPredictionsForSeller(sellerId);
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/advanced/{productId}")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    @Operation(summary = "Get advanced analysis", description = "Returns health score, forecast, and momentum for a product")
    public ResponseEntity<?> getAdvancedAnalysis(@PathVariable String productId) {
        log.info("Demande d'analyse avancée pour le produit: {}", productId);

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
    @Operation(summary = "Get health score", description = "Returns the product health score with breakdown")
    public ResponseEntity<?> getHealthScore(@PathVariable String productId) {
        log.info("Demande de health score pour le produit: {}", productId);

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
    @Operation(summary = "Get sales forecast", description = "Returns 30-day sales forecast")
    public ResponseEntity<?> getSalesForecast(
            @PathVariable String productId,
            @RequestParam(defaultValue = "30") int days) {
        log.info("Demande de prévision pour le produit: {} ({} jours)", productId, days);

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
    @Operation(summary = "Get momentum analysis", description = "Returns trend and momentum indicators")
    public ResponseEntity<?> getMomentumAnalysis(@PathVariable String productId) {
        log.info("Demande d'analyse de momentum pour le produit: {}", productId);

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

    private PredictionRequestDTO buildPredictionRequest(Product product) {
        int daysSinceListed = 30;
        if (product.getCreatedAt() != null) {
            daysSinceListed = (int) ChronoUnit.DAYS.between(product.getCreatedAt(), LocalDateTime.now());
        }

        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Electronics";
        Double price = product.getPrice() != null ? product.getPrice().doubleValue() : 0.0;
        Double rating = product.getRating() != null ? product.getRating().doubleValue() : 3.0;

        return PredictionRequestDTO.builder()
                .productId(product.getAsin())
                .productName(product.getProductName())
                .currentPrice(price)
                .rating(rating)
                .reviewCount(product.getReviewsCount() != null ? product.getReviewsCount() : 0)
                .salesCount(product.getSalesCount() != null ? product.getSalesCount() : 0)
                .stockQuantity(product.getStockQuantity() != null ? product.getStockQuantity() : 0)
                .daysSinceListed(daysSinceListed)
                .sellerRating(3.5)
                .discountPercentage(0.0)
                .category(categoryName)
                .currentRanking(product.getRanking() != null ? product.getRanking() : 100)
                .build();
    }
}