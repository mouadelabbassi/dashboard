package com.dashboard.service;

import com.dashboard.entity.Product;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Client for communicating with Flask ML Service.
 * Handles all ML prediction requests to the Python microservice.
 */
@Slf4j
@Service
public class MLServiceClient {

    private final WebClient webClient;

    @Value("${flask.ml.url:http://localhost:5001}")
    private String flaskUrl;

    public MLServiceClient(WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder
                .baseUrl("http://localhost:5001")
                .build();
    }

    /**
     * Check if ML service is healthy.
     */
    public Map<String, Object> checkHealth() {
        try {
            return webClient.get()
                    .uri("/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn(Map.of("status", "unavailable", "error", "Service not responding"))
                    .block();
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage());
            return Map.of("status", "unavailable", "error", e.getMessage());
        }
    }

    /**
     * Get model accuracy metrics.
     */
    public Map<String, Object> getModelMetrics() {
        try {
            return webClient.get()
                    .uri("/model/accuracy")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn(Map.of("error", "Failed to get metrics"))
                    .block();
        } catch (Exception e) {
            log.error("Failed to get model metrics: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Predict bestseller probability for a single product.
     */
    public Map<String, Object> predictBestseller(Product product) {
        try {
            Map<String, Object> requestBody = productToMap(product);

            return webClient.post()
                    .uri("/predict/bestseller")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .onErrorReturn(Map.of("error", "Prediction failed"))
                    .block();
        } catch (Exception e) {
            log.error("Bestseller prediction failed for {}: {}", product.getAsin(), e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Predict ranking trend for a single product.
     */
    public Map<String, Object> predictRankingTrend(Product product) {
        try {
            Map<String, Object> requestBody = productToMap(product);

            return webClient.post()
                    .uri("/predict/ranking-trend")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .onErrorReturn(Map.of("error", "Prediction failed"))
                    .block();
        } catch (Exception e) {
            log.error("Ranking prediction failed for {}: {}", product.getAsin(), e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Get complete prediction (bestseller + ranking + price) for a product.
     */
    public Map<String, Object> predictComplete(Product product) {
        try {
            Map<String, Object> requestBody = productToMapWithCategoryStats(product);

            return webClient.post()
                    .uri("/predict/complete")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(30))
                    .onErrorReturn(Map.of("error", "Complete prediction failed"))
                    .block();
        } catch (Exception e) {
            log.error("Complete prediction failed for {}: {}", product.getAsin(), e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Batch prediction for multiple products.
     */
    public Map<String, Object> predictBatch(List<Product> products) {
        try {
            List<Map<String, Object>> productMaps = products.stream()
                    .map(this::productToMapWithCategoryStats)
                    .collect(Collectors.toList());

            Map<String, Object> requestBody = Map.of("products", productMaps);

            return webClient.post()
                    .uri("/predict/complete/batch")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofSeconds(120)) // Longer timeout for batch
                    .onErrorReturn(Map.of("error", "Batch prediction failed"))
                    .block();
        } catch (Exception e) {
            log.error("Batch prediction failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Train bestseller model.
     */
    public Map<String, Object> trainBestsellerModel() {
        try {
            return webClient.post()
                    .uri("/train/bestseller")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMinutes(5))
                    .onErrorReturn(Map.of("error", "Training failed"))
                    .block();
        } catch (Exception e) {
            log.error("Bestseller training failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Train ranking model.
     */
    public Map<String, Object> trainRankingModel() {
        try {
            return webClient.post()
                    .uri("/train/ranking")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMinutes(5))
                    .onErrorReturn(Map.of("error", "Training failed"))
                    .block();
        } catch (Exception e) {
            log.error("Ranking training failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Train all models.
     */
    public Map<String, Object> trainAllModels() {
        try {
            return webClient.post()
                    .uri("/train/all")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .timeout(Duration.ofMinutes(10))
                    .onErrorReturn(Map.of("error", "Training failed"))
                    .block();
        } catch (Exception e) {
            log.error("Model training failed: {}", e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    /**
     * Convert Product entity to Map for API request.
     */
    private Map<String, Object> productToMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("asin", product.getAsin());
        map.put("product_id", product.getAsin());
        map.put("productName", product.getProductName());
        map.put("product_name", product.getProductName());
        map.put("price", product.getPrice() != null ? product.getPrice().doubleValue() : 0.0);
        map.put("rating", product.getRating() != null ? product.getRating().doubleValue() : 0.0);
        map.put("reviews_count", product.getReviewsCount() != null ? product.getReviewsCount() : 0);
        map.put("reviewsCount", product.getReviewsCount() != null ? product.getReviewsCount() : 0);
        map.put("ranking", product.getRanking() != null ? product.getRanking() : 999);
        map.put("sales_count", product.getSalesCount() != null ? product.getSalesCount() : 0);
        map.put("salesCount", product.getSalesCount() != null ? product.getSalesCount() : 0);
        map.put("stock_quantity", product.getStockQuantity() != null ? product.getStockQuantity() : 0);
        map.put("is_bestseller", product.getIsBestseller() != null ? product.getIsBestseller() : false);

        if (product.getCategory() != null) {
            map.put("category", product.getCategory().getName());
            map.put("categoryName", product.getCategory().getName());
            map.put("category_id", product.getCategory().getId());
        }

        if (product.getSeller() != null) {
            map.put("seller_id", product.getSeller().getId());
        }

        return map;
    }

    /**
     * Convert Product to Map with category statistics for price intelligence.
     */
    private Map<String, Object> productToMapWithCategoryStats(Product product) {
        Map<String, Object> map = productToMap(product);

        // Add category statistics (these would normally come from a service)
        // For now, we'll include placeholders that the Flask service can use
        if (product.getCategory() != null) {
            // These should be calculated from actual category data
            double price = product.getPrice() != null ? product.getPrice().doubleValue() : 50.0;
            map.put("category_avg_price", price * 1.1);  // Placeholder
            map.put("category_min_price", price * 0.5);  // Placeholder
            map.put("category_max_price", price * 2.0);  // Placeholder
        }

        return map;
    }

    /**
     * Check if ML service is available.
     */
    public boolean isServiceAvailable() {
        Map<String, Object> health = checkHealth();
        return "healthy".equals(health.get("status"));
    }
}