package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequestDTO;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class FlaskMLClientService {

    private static final Logger logger = LoggerFactory.getLogger(FlaskMLClientService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${flask.ml.url:http://localhost:5001}")
    private String flaskServiceUrl;

    public FlaskMLClientService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isServiceHealthy() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    flaskServiceUrl + "/health", String.class);
            return response.getStatusCode() == HttpStatus.OK;
        } catch (RestClientException e) {
            logger.warn("Le microservice ML n'est pas accessible:  {}", e.getMessage());
            return false;
        }
    }

    public Optional<Map<String, Object>> getServiceStatus() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    flaskServiceUrl + "/status", String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                JsonNode jsonNode = objectMapper.readTree(response.getBody());
                Map<String, Object> status = objectMapper.convertValue(jsonNode, Map.class);
                return Optional.of(status);
            }
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération du statut ML: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<JsonNode> predictRanking(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/ranking", request);
    }

    public Optional<JsonNode> predictBestseller(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/bestseller", request);
    }

    public Optional<JsonNode> predictPrice(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/price", request);
    }
    public Optional<JsonNode> getFullPrediction(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/full", request);
    }

    public Optional<JsonNode> getBatchPredictions(List<PredictionRequestDTO> requests) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = new HashMap<>();
            body.put("products", requests.stream()
                    .map(this::convertToMap)
                    .toList());

            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    flaskServiceUrl + "/predict/batch", entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return Optional.of(objectMapper.readTree(response.getBody()));
            }
        } catch (Exception e) {
            logger.error("Erreur lors des prédictions en lot: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<JsonNode> getModelMetrics() {
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(
                    flaskServiceUrl + "/metrics", String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return Optional.of(objectMapper.readTree(response.getBody()));
            }
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des métriques:  {}", e.getMessage());
        }
        return Optional.empty();
    }

    private Optional<JsonNode> callPredictionEndpoint(String endpoint, PredictionRequestDTO request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = convertToMap(request);
            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(body), headers);

            logger.debug("Appel de l'endpoint ML: {}", endpoint);
            ResponseEntity<String> response = restTemplate.postForEntity(
                    flaskServiceUrl + endpoint, entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return Optional.of(objectMapper.readTree(response.getBody()));
            } else {
                logger.warn("Réponse non-OK du service ML: {}", response.getStatusCode());
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'appel à {}: {}", endpoint, e.getMessage());
        }
        return Optional.empty();
    }

    private Map<String, Object> convertToMap(PredictionRequestDTO request) {
        Map<String, Object> map = new HashMap<>();
        map.put("product_id", request.getProductId());
        map.put("product_name", request.getProductName());
        map.put("current_price", request.getCurrentPrice());
        map.put("rating", request.getRating());
        map.put("review_count", request.getReviewCount());
        map.put("sales_count", request.getSalesCount());
        map.put("stock_quantity", request.getStockQuantity());
        map.put("days_since_listed", request.getDaysSinceListed());
        map.put("seller_rating", request.getSellerRating());
        map.put("discount_percentage", request.getDiscountPercentage());
        map.put("category", request.getCategory());
        map.put("current_ranking", request.getCurrentRanking());
        return map;
    }

    public Optional<JsonNode> getHealthScore(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/health-score", request);
    }

    public Optional<JsonNode> getSalesForecast(PredictionRequestDTO request, int days) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> body = convertToMap(request);
            body.put("forecast_days", days);

            HttpEntity<String> entity = new HttpEntity<>(
                    objectMapper.writeValueAsString(body), headers);

            ResponseEntity<String> response = restTemplate.postForEntity(
                    flaskServiceUrl + "/predict/forecast", entity, String.class);

            if (response.getStatusCode() == HttpStatus.OK) {
                return Optional.of(objectMapper.readTree(response.getBody()));
            }
        } catch (Exception e) {
            logger.error("Erreur lors de la prévision des ventes: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public Optional<JsonNode> getMomentumAnalysis(PredictionRequestDTO request) {
        return callPredictionEndpoint("/predict/momentum", request);
    }

    public Optional<JsonNode> getFullAdvancedAnalysis(PredictionRequestDTO request) {
        try {
            // Call all three endpoints and combine
            Optional<JsonNode> health = getHealthScore(request);
            Optional<JsonNode> forecast = getSalesForecast(request, 30);
            Optional<JsonNode> momentum = getMomentumAnalysis(request);

            if (health.isPresent() || forecast.isPresent() || momentum.isPresent()) {
                ObjectNode combined = objectMapper.createObjectNode();
                combined.put("product_id", request.getProductId());
                combined.put("product_name", request.getProductName());

                health.ifPresent(h -> combined.set("health_score", h.get("data")));
                forecast.ifPresent(f -> combined.set("sales_forecast", f.get("data")));
                momentum.ifPresent(m -> combined.set("momentum", m.get("data")));

                return Optional.of(combined);
            }
        } catch (Exception e) {
            logger.error("Erreur lors de l'analyse avancée: {}", e.getMessage());
        }
        return Optional.empty();
    }
}