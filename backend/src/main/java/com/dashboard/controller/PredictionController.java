package com.dashboard.controller;

import com.dashboard.dto.response.PredictionResponseDTO;
import com.dashboard.dto.response.PredictionStatsDTO;
import com.dashboard.service.FlaskMLClientService;
import com.dashboard.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Contrôleur REST pour les endpoints d'analyse prédictive.
 * Module:  Analyse Prédictive - Mini Projet JEE 2025
 */
@RestController
@RequestMapping("/api/predictions")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class PredictionController {

    private final PredictionService predictionService;
    private final FlaskMLClientService flaskClient;

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
    public ResponseEntity<? > getModelMetrics() {
        return flaskClient.getModelMetrics()
                .map(ResponseEntity:: ok)
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
        log.info("Génération des prédictions pour le vendeur:  {}", sellerId);
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

    @GetMapping("/seller/{sellerId}/alerts")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'SELLER')")
    public ResponseEntity<List<PredictionResponseDTO>> getSellerAlerts(@PathVariable Long sellerId) {
        List<PredictionResponseDTO> alerts = predictionService.getUnnotifiedPredictionsForSeller(sellerId);
        return ResponseEntity.ok(alerts);
    }
}