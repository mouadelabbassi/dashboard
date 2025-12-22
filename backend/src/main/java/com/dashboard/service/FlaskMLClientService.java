package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequestDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class FlaskMLClientService {

    @Value("${ml.service.url:http://localhost:5001}")
    private String mlServiceUrl;

    private final RestTemplate restTemplate;

    public FlaskMLClientService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public boolean isServiceHealthy() {
        try {
            String url = mlServiceUrl + "/health";
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.debug("ML service non disponible: {}", e.getMessage());
            return false;
        }
    }

    public Optional<Map<String, Object>> getServiceStatus() {
        try {
            String url = mlServiceUrl + "/status";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                return Optional.of(body);
            }
        } catch (Exception e) {
            log.debug("Impossible de récupérer le status ML: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<Map<String, Object>> getModelMetrics() {
        try {
            String url = mlServiceUrl + "/metrics";
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> body = response.getBody();
                return Optional.of(body);
            }
        } catch (Exception e) {
            log.error("Erreur lors de la récupération des métriques: {}", e.getMessage());
        }
        return Optional.empty();
    }

    /**
     * ✅ FIXED: Retourne Map<String, Object> au lieu de JsonNode
     */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getFullPrediction(PredictionRequestDTO request) {
        try {
            String url = mlServiceUrl + "/predict/full";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PredictionRequestDTO> entity = new HttpEntity<>(request, headers);

            log.debug("📤 Envoi requête ML pour produit: {}", request.getProductId());

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                log.debug("✅ Réponse ML reçue pour produit: {}", request.getProductId());
                return Optional.of((Map<String, Object>) response.getBody());
            }

            log.warn("⚠️ Réponse ML vide pour produit: {}", request.getProductId());
            return Optional.empty();

        } catch (Exception e) {
            log.error("❌ Erreur lors de l'appel ML pour {}: {}", request.getProductId(), e.getMessage());
            return Optional.empty();
        }
    }

    /**
     * Advanced analysis endpoints
     */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getFullAdvancedAnalysis(PredictionRequestDTO request) {
        try {
            String url = mlServiceUrl + "/predict/full";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequestDTO> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of((Map<String, Object>) response.getBody());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Erreur analyse avancée: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getHealthScore(PredictionRequestDTO request) {
        try {
            String url = mlServiceUrl + "/predict/health-score";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequestDTO> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of((Map<String, Object>) response.getBody());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Erreur health score: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getSalesForecast(PredictionRequestDTO request, int days) {
        try {
            String url = mlServiceUrl + "/predict/forecast?days=" + days;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequestDTO> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of((Map<String, Object>) response.getBody());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Erreur forecast: {}", e.getMessage());
            return Optional.empty();
        }
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getMomentumAnalysis(PredictionRequestDTO request) {
        try {
            String url = mlServiceUrl + "/predict/momentum";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<PredictionRequestDTO> entity = new HttpEntity<>(request, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return Optional.of((Map<String, Object>) response.getBody());
            }
            return Optional.empty();
        } catch (Exception e) {
            log.error("Erreur momentum: {}", e.getMessage());
            return Optional.empty();
        }
    }
}