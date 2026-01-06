package com.dashboard.controller;

import com.dashboard.dto.response.*;
import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import com.dashboard.service.PredictionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/predictions")
@RequiredArgsConstructor
@Tag(name = "Predictions", description = "ML Prediction APIs")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class PredictionController {

    private final PredictionService predictionService;
    private final ProductRepository productRepository;

    @GetMapping("/products-with-recommendations")
    @Operation(summary = "Get products with price recommendations as cards")
    public ResponseEntity<List<ProductPredictionCardResponse>> getProductsWithRecommendations(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("GET /api/predictions/products-with-recommendations - page:{} size:{}", page, size);

        try {
            List<Product> allProducts = productRepository.findAll();
            List<ProductPredictionCardResponse> cards = new ArrayList<>();

            for (Product product : allProducts) {
                try {
                    CompletePredictionResponse prediction = predictionService.getCompletePrediction(product.getAsin());

                    if (prediction != null && prediction.getPriceIntelligence() != null) {
                        String priceAction = prediction.getPriceIntelligence().getPriceAction();
                        if (priceAction != null && !priceAction.equals("MAINTAIN") && !priceAction.equals("MAINTENIR")) {

                            ProductPredictionCardResponse card = ProductPredictionCardResponse.builder()
                                    .asin(product.getAsin())
                                    .productName(product.getProductName())
                                    .description(product.getDescription())
                                    .imageUrl(product.getImageUrl())
                                    .categoryName(product.getCategory() != null ? product.getCategory().getName() : "N/A")
                                    .currentPrice(product.getPrice())
                                    .rating(product.getRating())
                                    .reviewsCount(product.getReviewsCount())
                                    .salesCount(product.getSalesCount())
                                    .stockQuantity(product.getStockQuantity())
                                    .sellerName(product.getSeller() != null ? product.getSeller().getFullName() : "Amazon")
                                    .build();

                            if (prediction.getPriceIntelligence() != null) {
                                card.setRecommendedPrice(prediction.getPriceIntelligence().getRecommendedPrice());
                                card.setPriceDifference(prediction.getPriceIntelligence().getPriceDifference());
                                card.setPriceChangePercentage(prediction.getPriceIntelligence().getPriceChangePercentage());
                                card.setPriceAction(prediction.getPriceIntelligence().getPriceAction());
                                card.setPositioning(prediction.getPriceIntelligence().getPositioning());
                            }

                            if (prediction.getBestseller() != null) {
                                card.setBestsellerProbability(prediction.getBestseller().getBestsellerProbability());
                                card.setIsPotentialBestseller(prediction.getBestseller().getIsPotentialBestseller());
                                card.setConfidenceLevel(prediction.getBestseller().getConfidenceLevel());
                            }

                            if (prediction.getRankingTrend() != null) {
                                card.setCurrentRank(prediction.getRankingTrend().getCurrentRank());
                                card.setPredictedRank(prediction.getRankingTrend().getPredictedRank());
                                card.setRankingTrend(prediction.getRankingTrend().getPredictedTrend());
                                card.setRankingChange(prediction.getRankingTrend().getEstimatedChange());
                            }

                            card.setPredictedAt(LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
                            cards.add(card);
                        }
                    }
                } catch (Exception e) {
                    log.warn("Failed to get prediction for product {}: {}", product.getAsin(), e.getMessage());
                }

                if (cards.size() >= size) {
                    break;
                }
            }

            log.info("Returning {} product cards with recommendations", cards.size());
            return ResponseEntity.ok(cards);

        } catch (Exception e) {
            log.error("Error getting products with recommendations: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/product/{asin}")
    @Operation(summary = "Get complete predictions for a product")
    public ResponseEntity<CompletePredictionResponse> getProductPredictions(@PathVariable String asin) {
        try {
            CompletePredictionResponse prediction = predictionService.getCompletePrediction(asin);
            return ResponseEntity.ok(prediction);
        } catch (Exception e) {
            log.error("Error getting predictions for product {}: {}", asin, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}