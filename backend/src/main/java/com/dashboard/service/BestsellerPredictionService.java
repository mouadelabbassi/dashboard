package com.dashboard.service;

import com.dashboard.dto.request.ApplyRecommendationRequest;
import com.dashboard.dto.response.BestsellerPredictionResponse;
import com.dashboard.entity.BestsellerPrediction;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.BestsellerPredictionRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
@Slf4j
@Service
@RequiredArgsConstructor
public class BestsellerPredictionService {

    private final BestsellerPredictionRepository predictionRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final MLServiceClient mlServiceClient;
    private final SellerNotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<BestsellerPredictionResponse> getAllPredictions(Pageable pageable) {
        log.debug("Fetching all bestseller predictions");
        return predictionRepository.findAllByOrderByPredictionDateDesc(pageable)
                .map(BestsellerPredictionResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public List<BestsellerPredictionResponse> getPredictionsByConfidence(BigDecimal threshold) {
        log.debug("Fetching predictions with probability >= {}", threshold);
        return predictionRepository.findByPredictedProbabilityGreaterThanEqualOrderByPredictedProbabilityDesc(threshold)
                .stream()
                .map(BestsellerPredictionResponse::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional(readOnly = true)
    public List<BestsellerPredictionResponse> getPotentialBestsellers() {
        return getPredictionsByConfidence(new BigDecimal("0.70"));
    }

    @Transactional(readOnly = true)
    public BestsellerPredictionResponse getPredictionByProductId(String productId) {
        log.debug("Fetching prediction for product: {}", productId);

        BestsellerPrediction prediction = predictionRepository.findTopByProductIdOrderByPredictionDateDesc(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Prediction", "productId", productId));

        return BestsellerPredictionResponse.fromEntity(prediction);
    }
    @Transactional(readOnly = true)
    public List<BestsellerPredictionResponse> getSellerPredictions(Long sellerId) {
        log.debug("Fetching predictions for seller: {}", sellerId);

        userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        List<String> productIds = productRepository.findBySellerId(sellerId)
                .stream()
                .map(Product::getAsin)
                .collect(Collectors.toList());

        if (productIds.isEmpty()) {
            return List.of();
        }

        return predictionRepository.findLatestByProductIds(productIds)
                .stream()
                .map(BestsellerPredictionResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> refreshPredictions() {
        log.info("Refreshing bestseller predictions from ML service...");

        List<Product> products = productRepository.findAllExcludingRejected();

        if (products.isEmpty()) {
            return Map.of("status", "no_products", "message", "No products to predict");
        }

        int successCount = 0;
        int failureCount = 0;

        for (Product product : products) {
            try {
                Map<String, Object> prediction = mlServiceClient.predictBestseller(product);

                if (prediction != null && !prediction.containsKey("error")) {
                    savePrediction(product, prediction);
                    successCount++;

                    checkAndNotifySeller(product, prediction);
                } else {
                    failureCount++;
                    log.warn("Failed to predict for product: {}", product.getAsin());
                }
            } catch (Exception e) {
                failureCount++;
                log.error("Error predicting for product {}: {}", product.getAsin(), e.getMessage());
            }
        }

        log.info("Prediction refresh complete. Success: {}, Failures: {}", successCount, failureCount);

        return Map.of(
                "status", "completed",
                "totalProducts", products.size(),
                "successCount", successCount,
                "failureCount", failureCount,
                "timestamp", LocalDateTime.now().toString()
        );
    }

    @Transactional
    public BestsellerPrediction savePrediction(Product product, Map<String, Object> mlResponse) {
        BigDecimal probability = new BigDecimal(String.valueOf(mlResponse.getOrDefault("bestseller_probability", 0.0)));
        String potentialLevel = String.valueOf(mlResponse.getOrDefault("potential_level", "FAIBLE"));
        String recommendation = String.valueOf(mlResponse.getOrDefault("recommendation", ""));

        BestsellerPrediction.ConfidenceLevel confidenceLevel;
        double prob = probability.doubleValue();
        if (prob >= 0.85) {
            confidenceLevel = BestsellerPrediction.ConfidenceLevel.HIGH;
        } else if (prob >= 0.70) {
            confidenceLevel = BestsellerPrediction.ConfidenceLevel.MEDIUM;
        } else if (prob >= 0.50) {
            confidenceLevel = BestsellerPrediction.ConfidenceLevel.LOW;
        } else {
            confidenceLevel = BestsellerPrediction.ConfidenceLevel.VERY_LOW;
        }

        BestsellerPrediction prediction = BestsellerPrediction.builder()
                .productId(product.getAsin())
                .asin(product.getAsin())
                .predictedProbability(probability)
                .confidenceLevel(confidenceLevel)
                .potentialLevel(potentialLevel)
                .recommendation(recommendation)
                .predictionDate(LocalDateTime.now())
                .build();

        return predictionRepository.save(prediction);
    }

    private void checkAndNotifySeller(Product product, Map<String, Object> prediction) {
        if (product.getSeller() == null) {
            return;
        }

        double probability = Double.parseDouble(String.valueOf(prediction.getOrDefault("bestseller_probability", 0.0)));

        if (probability >= 0.85) {

            notificationService.sendBestsellerAlert(
                    product.getSeller().getId(),
                    product.getAsin(),
                    new BigDecimal(probability)
            );
        }
    }

    @Transactional
    public Map<String, Object> applyRecommendation(ApplyRecommendationRequest request) {
        log.info("Applying recommendation for product: {}", request.getProductId());

        Product product = productRepository.findByAsin(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", request.getProductId()));

        User currentUser = getCurrentUser();
        if (product.getSeller() != null &&
                !product.getSeller().getId().equals(currentUser.getId()) &&
                currentUser.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("You don't have permission to apply recommendations for this product");
        }

        Map<String, Object> result = new HashMap<>();
        result.put("productId", request.getProductId());
        result.put("recommendationType", request.getRecommendationType());
        result.put("appliedAt", LocalDateTime.now());
        result.put("appliedBy", currentUser.getEmail());

        switch (request.getRecommendationType()) {
            case BESTSELLER_FEATURE:
                product.setIsBestseller(true);
                productRepository.save(product);
                result.put("action", "Product marked as featured/bestseller");
                break;
            case PRICE_CHANGE:
                result.put("action", "Price change recommendation logged");
                result.put("note", "Manual price change required by seller");
                break;
            case MARKETING_BOOST:
                result.put("action", "Marketing boost recommendation logged");
                break;
            default:
                result.put("action", "Recommendation logged");
        }

        result.put("status", "success");
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAccuracyMetrics() {
        log.debug("Fetching accuracy metrics");

        Map<String, Object> metrics = new HashMap<>();

        long totalPredictions = predictionRepository.count();
        metrics.put("totalPredictions", totalPredictions);

        long trackedPredictions = predictionRepository.countByActualOutcomeIsNotNull();
        metrics.put("trackedPredictions", trackedPredictions);

        if (trackedPredictions > 0) {
            long correctPredictions = predictionRepository.countCorrectPredictions();
            double accuracy = (double) correctPredictions / trackedPredictions;

            metrics.put("correctPredictions", correctPredictions);
            metrics.put("accuracy", accuracy);
        } else {
            metrics.put("accuracy", null);
            metrics.put("note", "No predictions have been validated yet");
        }
        long highConfidencePredictions = predictionRepository.countByConfidenceLevel(
                BestsellerPrediction.ConfidenceLevel.HIGH);
        metrics.put("highConfidencePredictions", highConfidencePredictions);
        long potentialBestsellers = predictionRepository.countByPredictedProbabilityGreaterThanEqual(
                new BigDecimal("0.70"));
        metrics.put("potentialBestsellers", potentialBestsellers);

        return metrics;
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }
}