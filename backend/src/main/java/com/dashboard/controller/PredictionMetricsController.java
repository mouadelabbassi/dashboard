package com.dashboard.controller;

import com.dashboard.repository.PredictionRepository;
import com.dashboard.repository.ProductRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/predictions/metrics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Prediction Metrics", description = "Monitoring and health metrics")
public class PredictionMetricsController {

    private final PredictionRepository predictionRepository;
    private final ProductRepository productRepository;

    @GetMapping("/health-detailed")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get detailed health metrics")
    public ResponseEntity<Map<String, Object>> getDetailedHealth() {
        Map<String, Object> metrics = new HashMap<>();

        long totalProducts = productRepository.count();
        long totalPredictions = predictionRepository.count();
        long uniqueProductsPredicted = predictionRepository.findLatestPredictionsForAllProducts().size();

        metrics.put("totalProducts", totalProducts);
        metrics.put("totalPredictions", totalPredictions);
        metrics.put("uniqueProductsPredicted", uniqueProductsPredicted);
        metrics.put("coveragePercent", totalProducts > 0 ?
                (double) uniqueProductsPredicted / totalProducts * 100 : 0);

        LocalDateTime oneDayAgo = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        long recentPredictions = predictionRepository.findByGeneratedAtAfterOrderByGeneratedAtDesc(oneDayAgo).size();

        metrics.put("predictionsLast24h", recentPredictions);
        metrics.put("needsRefresh", recentPredictions == 0 && totalProducts > 0);

        long bestsellersDetected = predictionRepository.findByIsPotentialBestsellerTrueOrderByBestsellerProbabilityDesc().size();
        metrics.put("bestsellersDetected", bestsellersDetected);

        String status;
        if (uniqueProductsPredicted == 0) {
            status = "NEEDS_INITIAL_GENERATION";
        } else if (recentPredictions == 0) {
            status = "STALE_NEEDS_REFRESH";
        } else if (uniqueProductsPredicted < totalProducts * 0.8) {
            status = "PARTIAL_COVERAGE";
        } else {
            status = "HEALTHY";
        }
        metrics.put("status", status);
        metrics.put("timestamp", LocalDateTime.now());

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/model-info")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get ML model information")
    public ResponseEntity<Map<String, Object>> getModelInfo() {
        Map<String, Object> info = new HashMap<>();

        info.put("bestsellerModel", Map.of(
                "accuracy", "97.63%",
                "precision", "100%",
                "status", "PRODUCTION_READY",
                "recommendation", "Utilisez avec confiance"
        ));

        info.put("rankingModel", Map.of(
                "r2Score", "0.339",
                "mae", "92.26 positions",
                "status", "USE_WITH_CAUTION",
                "recommendation", "Afficher tendances uniquement, pas positions exactes"
        ));

        info.put("priceModel", Map.of(
                "r2Score", "0.673",
                "mape", "60.25%",
                "status", "DISABLED",
                "recommendation", "Nécessite plus de données - désactivé pour le moment"
        ));

        return ResponseEntity.ok(info);
    }
}