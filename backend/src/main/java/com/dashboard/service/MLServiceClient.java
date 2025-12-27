package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequest;
import com.dashboard.dto.response.BestsellerPredictionResponse;
import com.dashboard.dto.response.CompletePredictionResponse;
import com.dashboard.dto.response.PriceIntelligenceResponse;
import com.dashboard.dto.response.RankingTrendPredictionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class MLServiceClient {

    @Qualifier("mlRestTemplate")
    private final RestTemplate restTemplate;

    public BestsellerPredictionResponse predictBestseller(PredictionRequest request) {
        try {
            log.info("Calling ML service for bestseller prediction: {}", request.getAsin());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<BestsellerPredictionResponse> response = restTemplate.exchange(
                    "/predict/bestseller",
                    HttpMethod.POST,
                    entity,
                    BestsellerPredictionResponse.class
            );

            log.info("Bestseller prediction successful for: {}", request.getAsin());
            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling ML service for bestseller prediction: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable", e);
        }
    }

    public RankingTrendPredictionResponse predictRankingTrend(PredictionRequest request) {
        try {
            log.info("Calling ML service for ranking prediction: {}", request.getAsin());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<RankingTrendPredictionResponse> response = restTemplate.exchange(
                    "/predict/ranking",
                    HttpMethod.POST,
                    entity,
                    RankingTrendPredictionResponse.class
            );

            log.info("Ranking prediction successful for: {}", request.getAsin());
            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling ML service for ranking prediction: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable", e);
        }
    }

    public PriceIntelligenceResponse analyzePricing(PredictionRequest request) {
        try {
            log.info("Calling ML service for price analysis: {}", request.getAsin());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<PriceIntelligenceResponse> response = restTemplate.exchange(
                    "/predict/price-intelligence",
                    HttpMethod.POST,
                    entity,
                    PriceIntelligenceResponse.class
            );

            log.info("Price analysis successful for: {}", request.getAsin());
            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling ML service for price analysis: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable", e);
        }
    }

    public CompletePredictionResponse predictComplete(PredictionRequest request) {
        try {
            log.info("Calling ML service for complete prediction: {}", request.getAsin());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<PredictionRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<CompletePredictionResponse> response = restTemplate.exchange(
                    "/predict/complete",
                    HttpMethod.POST,
                    entity,
                    CompletePredictionResponse.class
            );

            log.info("Complete prediction successful for: {}", request.getAsin());
            return response.getBody();

        } catch (RestClientException e) {
            log.error("Error calling ML service for complete prediction: {}", e.getMessage());
            throw new RuntimeException("ML service unavailable", e);
        }
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

        } catch (RestClientException e) {
            log.error("ML service health check failed: {}", e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("status", "unavailable");
            errorResponse.put("error", e.getMessage());
            return errorResponse;
        }
    }

    public void trainAllModels() {
        try {
            log.info("Triggering ML model training");

            ResponseEntity<Map> response = restTemplate.exchange(
                    "/train/all",
                    HttpMethod.POST,
                    null,
                    Map.class
            );

            log.info("Model training triggered successfully");

        } catch (RestClientException e) {
            log.error("Error triggering model training: {}", e.getMessage());
            throw new RuntimeException("Failed to trigger model training", e);
        }
    }
}