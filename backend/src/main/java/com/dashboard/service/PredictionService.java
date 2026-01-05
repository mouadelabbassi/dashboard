package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequest;
import com.dashboard.dto.response.*;
import com.dashboard.entity.Product;
import com.dashboard.entity.Category;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionService {

    private final MLServiceClient mlServiceClient;
    private final ProductRepository productRepository;
    private final ExecutorService executorService = Executors.newFixedThreadPool(10);

    public BestsellerPredictionResponse predictBestseller(String asin) {
        log.info("Getting bestseller prediction for product: {}", asin);
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new RuntimeException("Product not found: " + asin));
        PredictionRequest request = buildPredictionRequest(product);
        return mlServiceClient.predictBestseller(request);
    }

    public RankingTrendPredictionResponse predictRankingTrend(String asin) {
        log.info("Getting ranking trend prediction for product: {}", asin);
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new RuntimeException("Product not found: " + asin));
        PredictionRequest request = buildPredictionRequest(product);
        return mlServiceClient.predictRankingTrend(request);
    }

    public PriceIntelligenceResponse analyzePricing(String asin) {
        log.info("Getting price intelligence for product: {}", asin);
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new RuntimeException("Product not found: " + asin));
        PredictionRequest request = buildPredictionRequest(product);
        return mlServiceClient.analyzePricing(request);
    }

    public CompletePredictionResponse getCompletePrediction(String asin) {
        log.info("Getting complete prediction for product: {}", asin);
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new RuntimeException("Product not found: " + asin));
        PredictionRequest request = buildPredictionRequest(product);
        return mlServiceClient.predictComplete(request);
    }

    @Transactional(readOnly = true)
    public List<BestsellerPredictionResponse> predictBestsellersForCategory(Long categoryId) {
        log.info("Getting bestseller predictions for category: {}", categoryId);
        Pageable pageable = PageRequest.of(0, 100);
        Page<Product> productPage = productRepository.findByCategoryId(categoryId, pageable);
        List<Product> products = productPage.getContent();

        return products.stream()
                .map(product -> {
                    try {
                        PredictionRequest request = buildPredictionRequest(product);
                        return mlServiceClient.predictBestseller(request);
                    } catch (Exception e) {
                        log.error("Error predicting for product {}: {}", product.getAsin(), e.getMessage());
                        return null;
                    }
                })
                .filter(prediction -> prediction != null && prediction.getIsPotentialBestseller())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BestsellerPredictionResponse> getAllPotentialBestsellers() {
        log.info("Getting all potential bestsellers");
        Pageable pageable = PageRequest.of(0, 300);
        Page<Product> productPage = productRepository.findAll(pageable);
        List<Product> products = productPage.getContent();

        return products.stream()
                .map(product -> {
                    try {
                        PredictionRequest request = buildPredictionRequest(product);
                        return mlServiceClient.predictBestseller(request);
                    } catch (Exception e) {
                        log.error("Error predicting for product {}: {}", product.getAsin(), e.getMessage());
                        return null;
                    }
                })
                .filter(prediction -> prediction != null && prediction.getIsPotentialBestseller())
                .sorted((a, b) -> Double.compare(b.getBestsellerProbability(), a.getBestsellerProbability()))
                .collect(Collectors.toList());
    }

    public void generatePredictionsAsync(int batchSize) {
        log.info("Starting async prediction generation for {} products", batchSize);
        Pageable pageable = PageRequest.of(0, batchSize);
        Page<Product> productPage = productRepository.findAll(pageable);
        List<Product> products = productPage.getContent();

        List<CompletableFuture<Void>> futures = products.stream()
                .map(product -> CompletableFuture.runAsync(() -> {
                    try {
                        PredictionRequest request = buildPredictionRequest(product);
                        mlServiceClient.predictComplete(request);
                        log.debug("Generated prediction for {}", product.getAsin());
                    } catch (Exception e) {
                        log.error("Error generating prediction for {}: {}", product.getAsin(), e.getMessage());
                    }
                }, executorService))
                .collect(Collectors.toList());

        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        log.info("Async prediction generation completed");
    }

    public void refreshPredictionsForAllProducts() {
        log.info("Refreshing predictions for all products");
        generatePredictionsAsync(500);
        log.info("Prediction refresh completed");
    }

    public void triggerModelTraining() {
        log.info("Triggering ML model training");
        mlServiceClient.trainAllModels();
    }

    public Map<String, Object> getMLServiceHealth() {
        return mlServiceClient.getMLServiceHealth();
    }

    private PredictionRequest buildPredictionRequest(Product product) {
        PredictionRequest.PredictionRequestBuilder builder = PredictionRequest.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .price(product.getPrice())
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .salesCount(product.getSalesCount())
                .ranking(product.getRanking())
                .stockQuantity(product.getStockQuantity())
                .discountPercentage(product.getDiscountPercentage())
                .daysSinceListed(product.getDaysSinceListed());

        if (product.getCategory() != null) {
            Category category = product.getCategory();
            Pageable pageable = PageRequest.of(0, 100);
            List<Product> categoryProducts = productRepository.findByCategoryId(category.getId(), pageable).getContent();

            if (!categoryProducts.isEmpty()) {
                BigDecimal avgPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(categoryProducts.size()), 2, RoundingMode.HALF_UP);

                BigDecimal minPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                BigDecimal maxPrice = categoryProducts.stream()
                        .map(Product::getPrice)
                        .filter(p -> p != null)
                        .max(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);

                Double avgReviews = categoryProducts.stream()
                        .map(Product::getReviewsCount)
                        .filter(c -> c != null)
                        .mapToDouble(Integer::doubleValue)
                        .average()
                        .orElse(0.0);

                builder.categoryAvgPrice(avgPrice)
                        .categoryMinPrice(minPrice)
                        .categoryMaxPrice(maxPrice)
                        .categoryAvgReviews(avgReviews);
            }
        }

        return builder.build();
    }
}