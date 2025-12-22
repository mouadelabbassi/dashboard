package com.dashboard.service;

import com.dashboard.dto.request.PredictionRequestDTO;
import com.dashboard.dto.response.PredictionResponseDTO;
import com.dashboard.dto.response.PredictionStatsDTO;
import com.dashboard.entity.Notification;
import com.dashboard.entity.Prediction;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import com.dashboard.repository.NotificationRepository;
import com.dashboard.repository.PredictionRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service principal pour la gestion des analyses prédictives.
 * Module: Analyse Prédictive - Mini Projet JEE 2025
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class PredictionService {

    private final FlaskMLClientService flaskClient;
    private final PredictionRepository predictionRepository;
    private final ProductRepository productRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Optional<PredictionResponseDTO> generatePredictionForProduct(String productId) {
        log.info("Génération de prédiction pour le produit: {}", productId);

        Optional<Product> productOpt = productRepository.findByAsin(productId);
        if (productOpt.isEmpty()) {
            log.warn("Produit non trouvé: {}", productId);
            return Optional.empty();
        }

        Product product = productOpt.get();
        PredictionRequestDTO request = buildPredictionRequest(product);

        Optional<Map<String, Object>> mlResponse = flaskClient.getFullPrediction(request);
        if (mlResponse.isEmpty()) {
            log.error("Échec de la prédiction ML pour le produit: {}", productId);
            return Optional.empty();
        }

        Map<String, Object> response = mlResponse.get();
        Prediction prediction = createPredictionFromMap(product, response);
        predictionRepository.save(prediction);

        checkAndSendNotification(prediction, product);

        return Optional.of(convertToDTO(prediction));
    }

    public long getPredictionCount() {
        return predictionRepository.findLatestPredictionsForAllProducts().size();
    }

    @Transactional
    public Map<String, Object> generatePredictionsSync(int limit) {
        log.info("🔄 Génération synchrone de {} prédictions", limit);

        int processed = 0;
        int successCount = 0;
        int failureCount = 0;

        // Get products that need predictions (not predicted in last 24h)
        LocalDateTime cutoff = LocalDateTime.now().minus(24, ChronoUnit.HOURS);
        List<Product> products = productRepository.findAll()
                .stream()
                .filter(p -> {
                    Optional<Prediction> latest = predictionRepository
                            .findTopByProductAsinOrderByGeneratedAtDesc(p.getAsin());
                    return latest.isEmpty() || latest.get().getGeneratedAt().isBefore(cutoff);
                })
                .limit(limit)
                .collect(Collectors.toList());

        log.info("📦 {} produits à traiter", products.size());

        for (Product product : products) {
            try {
                // ✅ Generate prediction via Flask
                Optional<Map<String, Object>> mlResult = flaskClient.getFullPrediction(
                        buildPredictionRequest(product)
                );

                if (mlResult.isPresent()) {
                    Map<String, Object> result = mlResult.get();

                    // ✅ Parse and save prediction
                    Prediction prediction = new Prediction();
                    prediction.setProductAsin(product.getAsin());
                    prediction.setProductName(product.getProductName());
                    prediction.setCategory(getCategoryName(product));
                    prediction.setGeneratedAt(LocalDateTime.now());

                    // Set seller ID
                    if (product.getSeller() != null) {
                        prediction.setSellerId(product.getSeller().getId());
                    }

                    // Parse ranking prediction
                    if (result.containsKey("ranking") && result.get("ranking") instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> ranking = (Map<String, Object>) result.get("ranking");
                        prediction.setCurrentRanking(getIntValue(ranking, "current_ranking"));
                        prediction.setPredictedRanking(getIntValue(ranking, "predicted_ranking"));
                        prediction.setRankingChange(getIntValue(ranking, "ranking_change"));
                        prediction.setRankingTrend(getStringValue(ranking, "trend"));
                        prediction.setRankingConfidence(getDoubleValue(ranking, "confidence"));
                    }

                    // Parse bestseller prediction
                    if (result.containsKey("bestseller") && result.get("bestseller") instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> bestseller = (Map<String, Object>) result.get("bestseller");
                        prediction.setBestsellerProbability(getDoubleValue(bestseller, "bestseller_probability"));
                        prediction.setIsPotentialBestseller(getBooleanValue(bestseller, "is_potential_bestseller"));
                        prediction.setPotentialLevel(getStringValue(bestseller, "potential_level"));
                        prediction.setBestsellerConfidence(getDoubleValue(bestseller, "confidence"));
                    }

                    // Parse price prediction
                    if (result.containsKey("price") && result.get("price") instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> price = (Map<String, Object>) result.get("price");
                        prediction.setCurrentPrice(getDoubleValue(price, "current_price"));
                        prediction.setRecommendedPrice(getDoubleValue(price, "recommended_price"));
                        prediction.setPriceDifference(getDoubleValue(price, "price_difference"));
                        prediction.setPriceChangePercentage(getDoubleValue(price, "price_change_percentage"));
                        prediction.setPriceAction(getStringValue(price, "price_action"));
                        prediction.setPriceConfidence(getDoubleValue(price, "confidence"));
                    }

                    // ✅ SAVE TO DATABASE!
                    predictionRepository.save(prediction);
                    successCount++;

                    log.debug("✅ Prédiction sauvegardée pour: {}", product.getAsin());
                } else {
                    failureCount++;
                    log.warn("❌ Échec prédiction pour: {}", product.getAsin());
                }

                processed++;

            } catch (Exception e) {
                failureCount++;
                log.error("❌ Erreur pour {}: {}", product.getAsin(), e.getMessage());
            }
        }

        log.info("✅ Terminé: {}/{} réussies, {} échecs", successCount, processed, failureCount);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("processed", processed);
        response.put("successCount", successCount);
        response.put("failureCount", failureCount);
        response.put("remainingProducts", Math.max(0,
                productRepository.count() - predictionRepository.count()));
        response.put("totalProducts", productRepository.count());

        return response;
    }

    @Transactional
    public List<PredictionResponseDTO> generatePredictionsForSeller(Long sellerId) {
        log.info("Génération des prédictions pour le vendeur: {}", sellerId);

        List<Product> products = productRepository.findBySellerId(sellerId);
        List<PredictionResponseDTO> predictions = new ArrayList<>();

        for (Product product : products) {
            generatePredictionForProduct(product.getAsin())
                    .ifPresent(predictions::add);
        }

        return predictions;
    }

    /**
     * Récupère la dernière prédiction d'un produit.
     */
    public Optional<PredictionResponseDTO> getLatestPrediction(String productId) {
        return predictionRepository.findTopByProductAsinOrderByGeneratedAtDesc(productId)
                .map(this::convertToDTO);
    }

    /**
     * Récupère toutes les dernières prédictions.
     */
    public List<PredictionResponseDTO> getAllLatestPredictions() {
        return predictionRepository.findLatestPredictionsForAllProducts()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les bestsellers potentiels.
     */
    public List<PredictionResponseDTO> getPotentialBestsellers() {
        return predictionRepository.findByIsPotentialBestsellerTrueOrderByBestsellerProbabilityDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les prédictions par catégorie.
     */
    public List<PredictionResponseDTO> getPredictionsByCategory(String category) {
        return predictionRepository.findByCategoryOrderByGeneratedAtDesc(category)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Récupère les statistiques globales des prédictions.
     */
    public PredictionStatsDTO getPredictionStats() {
        List<Prediction> allPredictions = predictionRepository.findLatestPredictionsForAllProducts();

        long totalPredictions = allPredictions.size();

        long potentialBestsellersCount = allPredictions.stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPotentialBestseller()))
                .count();

        double avgBestsellerProbability = allPredictions.stream()
                .filter(p -> p.getBestsellerProbability() != null)
                .mapToDouble(Prediction::getBestsellerProbability)
                .average()
                .orElse(0.0);

        double avgPriceChange = allPredictions.stream()
                .filter(p -> p.getPriceChangePercentage() != null)
                .mapToDouble(p -> Math.abs(p.getPriceChangePercentage()))
                .average()
                .orElse(0.0);

        long productsWithPriceRecommendation = allPredictions.stream()
                .filter(p -> p.getPriceAction() != null && !p.getPriceAction().equals("MAINTENIR"))
                .count();

        long improvingProducts = allPredictions.stream()
                .filter(p -> "AMÉLIORATION".equals(p.getRankingTrend()))
                .count();

        long decliningProducts = allPredictions.stream()
                .filter(p -> "DÉCLIN".equals(p.getRankingTrend()))
                .count();

        long stableProducts = allPredictions.stream()
                .filter(p -> "STABLE".equals(p.getRankingTrend()))
                .count();

        // Trend distribution
        Map<String, Long> trendDistribution = allPredictions.stream()
                .filter(p -> p.getRankingTrend() != null)
                .collect(Collectors.groupingBy(Prediction::getRankingTrend, Collectors.counting()));

        // Price action distribution
        Map<String, Long> priceActionDistribution = allPredictions.stream()
                .filter(p -> p.getPriceAction() != null)
                .collect(Collectors.groupingBy(Prediction::getPriceAction, Collectors.counting()));

        // Category stats
        List<PredictionStatsDTO.CategoryStatsDTO> categoryStats = predictionRepository.getPredictionStatsByCategory()
                .stream()
                .map(row -> PredictionStatsDTO.CategoryStatsDTO.builder()
                        .category((String) row[0])
                        .count(((Number) row[1]).longValue())
                        .productCount(((Number) row[1]).longValue())
                        .avgBestsellerProb(row[2] != null ? ((Number) row[2]).doubleValue() : 0.0)
                        .avgBestsellerProbability(row[2] != null ? ((Number) row[2]).doubleValue() : 0.0)
                        .avgPriceChange(row[3] != null ? ((Number) row[3]).doubleValue() : 0.0)
                        .build())
                .collect(Collectors.toList());

        PredictionStatsDTO stats = PredictionStatsDTO.builder()
                .totalPredictions(totalPredictions)
                .potentialBestsellers(potentialBestsellersCount)
                .potentialBestsellersCount(potentialBestsellersCount)
                .avgBestsellerProbability(avgBestsellerProbability)
                .averageBestsellerProbability(avgBestsellerProbability)
                .avgPriceChange(avgPriceChange)
                .averagePriceChangeRecommended(avgPriceChange)
                .productsWithPriceRecommendation(productsWithPriceRecommendation)
                .productsWithRankingImprovement(improvingProducts)
                .improvingProducts(improvingProducts)
                .decliningProducts(decliningProducts)
                .stableProducts(stableProducts)
                .trendDistribution(trendDistribution)
                .priceActionDistribution(priceActionDistribution)
                .categoryStats(categoryStats)
                .build();

        return stats;
    }

    public List<PredictionResponseDTO> getUnnotifiedPredictionsForSeller(Long sellerId) {
        return predictionRepository.findBySellerIdAndNotificationSentFalse(sellerId)
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPotentialBestseller()) ||
                        (p.getPriceChangePercentage() != null && Math.abs(p.getPriceChangePercentage()) > 15))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tâche planifiée pour générer des prédictions quotidiennes.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void generateDailyPredictions() {
        log.info("Début de la génération quotidienne des prédictions");

        List<Product> allProducts = productRepository.findAll();
        int successCount = 0;
        int failureCount = 0;

        for (Product product : allProducts) {
            try {
                generatePredictionForProduct(product.getAsin());
                successCount++;
            } catch (Exception e) {
                log.error("Erreur pour le produit {}: {}", product.getAsin(), e.getMessage());
                failureCount++;
            }
        }

        log.info("Génération quotidienne terminée: {} succès, {} échecs", successCount, failureCount);
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private PredictionRequestDTO buildPredictionRequest(Product product) {
        return PredictionRequestDTO.builder()
                .productId(product.getAsin())
                .productName(product.getProductName())
                .currentPrice(safeDouble(product.getPrice(), 0.0))
                .rating(safeDouble(product.getRating(), 3.0))
                .reviewCount(safeInt(product.getReviewsCount(), 0))
                .salesCount(safeInt(product.getSalesCount(), 0))
                .stockQuantity(safeInt(product.getStockQuantity(), 100))
                .daysSinceListed(calculateDaysSinceListed(product.getCreatedAt()))
                .sellerRating(getSellerRating(product))
                .discountPercentage(safeDouble(product.getDiscountPercentage(), 0.0))
                .category(getCategoryName(product))
                .currentRanking(safeInt(product.getRanking(), 100))
                .build();
    }

    private Prediction createPredictionFromMap(Product product, Map<String, Object> response) {
        Long sellerId = product.getSeller() != null ? product.getSeller().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        Prediction.PredictionBuilder builder = Prediction.builder()
                .productAsin(product.getAsin())
                .productName(product.getProductName())
                .sellerId(sellerId)
                .category(categoryName)
                .generatedAt(LocalDateTime.now());

        // Ranking prediction
        if (response.containsKey("ranking") && response.get("ranking") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> ranking = (Map<String, Object>) response.get("ranking");
            builder.currentRanking(getIntValue(ranking, "current_ranking"))
                    .predictedRanking(getIntValue(ranking, "predicted_ranking"))
                    .rankingChange(getIntValue(ranking, "ranking_change"))
                    .rankingTrend(getStringValue(ranking, "trend"))
                    .rankingConfidence(getDoubleValue(ranking, "confidence"));
        }

        // Bestseller prediction
        if (response.containsKey("bestseller") && response.get("bestseller") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> bestseller = (Map<String, Object>) response.get("bestseller");
            builder.bestsellerProbability(getDoubleValue(bestseller, "bestseller_probability"))
                    .isPotentialBestseller(getBooleanValue(bestseller, "is_potential_bestseller"))
                    .potentialLevel(getStringValue(bestseller, "potential_level"))
                    .bestsellerConfidence(getDoubleValue(bestseller, "confidence"));
        }

        // Price prediction
        if (response.containsKey("price") && response.get("price") instanceof Map) {
            @SuppressWarnings("unchecked")
            Map<String, Object> price = (Map<String, Object>) response.get("price");
            builder.currentPrice(getDoubleValue(price, "current_price"))
                    .recommendedPrice(getDoubleValue(price, "recommended_price"))
                    .priceDifference(getDoubleValue(price, "price_difference"))
                    .priceChangePercentage(getDoubleValue(price, "price_change_percentage"))
                    .priceAction(getStringValue(price, "price_action"))
                    .priceConfidence(getDoubleValue(price, "confidence"));
        }

        return builder.build();
    }

    private void checkAndSendNotification(Prediction prediction, Product product) {
        if (product.getSeller() == null) return;

        User seller = product.getSeller();
        boolean shouldNotify = false;
        String title = "";
        String message = "";
        Notification.NotificationType type = Notification.NotificationType.SYSTEM;

        if (Boolean.TRUE.equals(prediction.getIsPotentialBestseller())) {
            shouldNotify = true;
            type = Notification.NotificationType.PREDICTION_BESTSELLER;
            title = "🌟 Produit à fort potentiel détecté";
            message = String.format(
                    "Votre produit '%s' a été identifié comme un bestseller potentiel avec une probabilité de %.0f%%. Niveau: %s.",
                    product.getProductName(),
                    prediction.getBestsellerProbability() * 100,
                    prediction.getPotentialLevel()
            );
        }

        if (prediction.getPriceChangePercentage() != null && Math.abs(prediction.getPriceChangePercentage()) > 15) {
            shouldNotify = true;
            type = Notification.NotificationType.PREDICTION_PRICE;
            String action = prediction.getPriceChangePercentage() > 0 ? "augmenter" : "réduire";
            title = "💰 Recommandation de prix";
            message = String.format(
                    "Notre analyse suggère de %s le prix de '%s' de %.1f%% (de %.2f€ à %.2f€) pour optimiser vos ventes.",
                    action,
                    product.getProductName(),
                    Math.abs(prediction.getPriceChangePercentage()),
                    prediction.getCurrentPrice(),
                    prediction.getRecommendedPrice()
            );
        }

        if (shouldNotify) {
            try {
                Notification notification = Notification.builder()
                        .recipient(seller)
                        .type(type)
                        .title(title)
                        .message(message)
                        .referenceId(product.getAsin())
                        .referenceType("PRODUCT")
                        .isRead(false)
                        .build();

                notificationRepository.save(notification);
                prediction.setNotificationSent(true);
                predictionRepository.save(prediction);

                log.info("Notification envoyée au vendeur {} pour le produit {}", seller.getId(), product.getAsin());
            } catch (Exception e) {
                log.error("Erreur lors de l'envoi de la notification: {}", e.getMessage());
            }
        }
    }

    private PredictionResponseDTO convertToDTO(Prediction prediction) {
        return PredictionResponseDTO.builder()
                .productId(prediction.getProductAsin())
                .productName(prediction.getProductName())
                .category(prediction.getCategory())
                .generatedAt(prediction.getGeneratedAt())
                .rankingPrediction(PredictionResponseDTO.RankingPredictionDTO.builder()
                        .predictedRanking(prediction.getPredictedRanking())
                        .currentRanking(prediction.getCurrentRanking())
                        .rankingChange(prediction.getRankingChange())
                        .trend(prediction.getRankingTrend())
                        .confidence(prediction.getRankingConfidence())
                        .build())
                .bestsellerPrediction(PredictionResponseDTO.BestsellerPredictionDTO.builder()
                        .bestsellerProbability(prediction.getBestsellerProbability())
                        .isPotentialBestseller(prediction.getIsPotentialBestseller())
                        .potentialLevel(prediction.getPotentialLevel())
                        .confidence(prediction.getBestsellerConfidence())
                        .build())
                .pricePrediction(PredictionResponseDTO.PricePredictionDTO.builder()
                        .recommendedPrice(prediction.getRecommendedPrice())
                        .currentPrice(prediction.getCurrentPrice())
                        .priceDifference(prediction.getPriceDifference())
                        .priceChangePercentage(prediction.getPriceChangePercentage())
                        .priceAction(prediction.getPriceAction())
                        .confidence(prediction.getPriceConfidence())
                        .build())
                .build();
    }

    // Helper methods for Map extraction
    private Integer getIntValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).intValue();
        }
        return 0;
    }

    private Double getDoubleValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Number) {
            return ((Number) value).doubleValue();
        }
        return 0.0;
    }

    private String getStringValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        return value != null ? value.toString() : null;
    }

    private Boolean getBooleanValue(Map<String, Object> map, String key) {
        Object value = map.get(key);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        return false;
    }

    // Safe conversion helpers
    private Double safeDouble(BigDecimal value, Double defaultValue) {
        return (value != null) ? value.doubleValue() : defaultValue;
    }

    private Double safeDouble(Double value, Double defaultValue) {
        return (value != null) ? value : defaultValue;
    }

    private Integer safeInt(Integer value, Integer defaultValue) {
        return (value != null) ? value : defaultValue;
    }

    private Integer calculateDaysSinceListed(LocalDateTime createdAt) {
        if (createdAt != null) {
            long days = ChronoUnit.DAYS.between(createdAt, LocalDateTime.now());
            return (int) Math.max(1, days);
        }
        return 30;
    }

    private Double getSellerRating(Product product) {
        if (product.getSeller() != null) {
            Double rating = product.getSeller().getSellerRating();
            if (rating != null && rating >= 1.0 && rating <= 5.0) {
                return rating;
            }
        }
        return 4.0;
    }

    private String getCategoryName(Product product) {
        if (product.getCategory() != null && product.getCategory().getName() != null) {
            return product.getCategory().getName();
        }
        return "Electronics";
    }
}