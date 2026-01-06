package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequest;
import com.dashboard.dto.response.BestsellerPredictionResponse;
import com.dashboard.dto.response.CompletePredictionResponse;
import com.dashboard.dto.response.PriceIntelligenceResponse;
import com.dashboard.dto.response.RankingTrendPredictionResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class MLServiceClient {

    private final RestTemplate restTemplate;

    @Value("${ml.service.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${ml.service.retry.delay:1000}")
    private long retryDelay;

    public MLServiceClient(@Qualifier("mlRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public BestsellerPredictionResponse predictBestseller(PredictionRequest request) {
        return executeWithRetry(() -> {
            HttpEntity<PredictionRequest> entity = createHttpEntity(request);
            ResponseEntity<BestsellerPredictionResponse> response = restTemplate.exchange(
                    "/predict/bestseller",
                    HttpMethod.POST,
                    entity,
                    BestsellerPredictionResponse.class
            );
            return response.getBody();
        }, "bestseller", request.getAsin());
    }

    public RankingTrendPredictionResponse predictRankingTrend(PredictionRequest request) {
        return executeWithRetry(() -> {
            HttpEntity<PredictionRequest> entity = createHttpEntity(request);
            ResponseEntity<RankingTrendPredictionResponse> response = restTemplate.exchange(
                    "/predict/ranking",
                    HttpMethod.POST,
                    entity,
                    RankingTrendPredictionResponse.class
            );
            return response.getBody();
        }, "ranking", request.getAsin());
    }

    public PriceIntelligenceResponse analyzePricing(PredictionRequest request) {
        return executeWithRetry(() -> {
            HttpEntity<PredictionRequest> entity = createHttpEntity(request);
            ResponseEntity<PriceIntelligenceResponse> response = restTemplate.exchange(
                    "/predict/price-intelligence",
                    HttpMethod.POST,
                    entity,
                    PriceIntelligenceResponse.class
            );
            return response.getBody();
        }, "price", request.getAsin());
    }

    public CompletePredictionResponse predictComplete(PredictionRequest request) {
        return executeWithRetry(() -> {
            HttpEntity<PredictionRequest> entity = createHttpEntity(request);
            ResponseEntity<CompletePredictionResponse> response = restTemplate.exchange(
                    "/predict/complete",
                    HttpMethod.POST,
                    entity,
                    CompletePredictionResponse.class
            );
            return response.getBody();
        }, "complete", request.getAsin());
    }

    public Map<String, Object> getMLServiceHealth() {
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    "/health",
                    HttpMethod.GET,
                    null,
                    Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            log.error("ML service health check failed: {}", e.getMessage());
            return createUnavailableResponse(e.getMessage());
        }
    }

    public void trainAllModels() {
        executeWithRetry(() -> {
            restTemplate.exchange(
                    "/train/all",
                    HttpMethod.POST,
                    null,
                    Map.class
            );
            return null;
        }, "training", "all-models");
    }

    private <T> T executeWithRetry(RetryableOperation<T> operation, String operationType, String productId) {
        Exception lastException = null;

        for (int attempt = 1; attempt <= maxRetryAttempts; attempt++) {
            try {
                return operation.execute();
            } catch (ResourceAccessException e) {
                lastException = e;
                log.warn("ML service {} prediction attempt {}/{} failed for {}: {}",
                        operationType, attempt, maxRetryAttempts, productId, e.getMessage());

                if (attempt < maxRetryAttempts) {
                    sleepBeforeRetry(attempt);
                }
            } catch (RestClientException e) {
                lastException = e;
                log.error("ML service {} prediction failed for {}: {}",
                        operationType, productId, e.getMessage());
                throw new RuntimeException("ML service unavailable", e);
            }
        }

        throw new RuntimeException(
                String.format("ML service %s prediction failed after %d attempts for %s",
                        operationType, maxRetryAttempts, productId),
                lastException);
    }

    private HttpEntity<PredictionRequest> createHttpEntity(PredictionRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new HttpEntity<>(request, headers);
    }

    private void sleepBeforeRetry(int attempt) {
        try {
            long backoffDelay = retryDelay * (long) Math.pow(2, attempt - 1);
            Thread.sleep(Math.min(backoffDelay, 10000));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private Map<String, Object> createUnavailableResponse(String error) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("status", "unavailable");
        errorResponse.put("error", error);
        return errorResponse;
    }

    @FunctionalInterface
    private interface RetryableOperation<T> {
        T execute() throws RestClientException;
    }
}