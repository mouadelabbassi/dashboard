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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PredictionService {

    private final FlaskMLClientService flaskClient;
    private final PredictionRepository predictionRepository;
    private final ProductRepository productRepository;
    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    @Autowired
    private MLTrackingService mlTrackingService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Optional<PredictionResponseDTO> generatePredictionForProduct(String productId) {
        log.info("🔮 Génération de prédiction pour le produit: {}", productId);

        try {
            Optional<Product> productOpt = productRepository.findByAsin(productId);
            if (productOpt.isEmpty()) {
                log.warn("❌ Produit non trouvé: {}", productId);
                return Optional.empty();
            }

            Product product = productOpt.get();
            PredictionRequestDTO request = buildPredictionRequest(product);

            Optional<Map<String, Object>> mlResponse = flaskClient.getFullPrediction(request);
            if (mlResponse.isEmpty()) {
                log.error("❌ Échec de la prédiction ML pour le produit: {}", productId);
                return Optional.empty();
            }

            Map<String, Object> response = mlResponse.get();
            Prediction prediction = createPredictionFromMap(product, response);

            if (prediction.getProductAsin() == null || prediction.getProductAsin().isEmpty()) {
                log.error("❌ Prédiction invalide (ASIN null) pour: {}", productId);
                return Optional.empty();
            }

            Prediction savedPrediction = predictionRepository.save(prediction);
            predictionRepository.flush();

            // ✅ NEW: Track bestseller prediction for accuracy monitoring
            if (savedPrediction.getBestsellerProbability() != null) {
                mlTrackingService.trackBestsellerPrediction(
                        productId,
                        savedPrediction.getIsPotentialBestseller(),
                        BigDecimal.valueOf(savedPrediction.getBestsellerProbability())
                );
            }

            log.info("✅ Prédiction sauvegardée: {} (ID: {})", productId, savedPrediction.getId());

            checkAndSendNotification(savedPrediction, product);

            return Optional.of(convertToDTO(savedPrediction));

        } catch (Exception e) {
            log.error("❌ Exception lors de la prédiction pour {}: {}", productId, e.getMessage(), e);
            return Optional.empty();
        }
    }

    public long getPredictionCount() {
        return predictionRepository.findLatestPredictionsForAllProducts().size();
    }

    /**
     * ✅ FIXED: No longer wraps everything in one transaction
     * Each prediction is independent
     */
    public Map<String, Object> generatePredictionsSync(int limit) {
        log.info("🔄 Génération synchrone de {} prédictions", limit);

        int processed = 0;
        int successCount = 0;
        int failureCount = 0;

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
                // ✅ Each call is in its own transaction
                Optional<PredictionResponseDTO> result = generatePredictionForProduct(product.getAsin());

                if (result.isPresent()) {
                    successCount++;
                    log.debug("✅ Prédiction réussie: {}", product.getAsin());
                } else {
                    failureCount++;
                    log.warn("❌ Échec prédiction pour: {}", product.getAsin());
                }

                processed++;

            } catch (Exception e) {
                failureCount++;
                log.error("❌ Exception pour {}: {}", product.getAsin(), e.getMessage());
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

    public List<PredictionResponseDTO> generatePredictionsForSeller(Long sellerId) {
        log.info("🔮 Génération des prédictions pour le vendeur: {}", sellerId);

        List<Product> products = productRepository.findBySellerId(sellerId);
        List<PredictionResponseDTO> predictions = new ArrayList<>();

        for (Product product : products) {
            generatePredictionForProduct(product.getAsin())
                    .ifPresent(predictions::add);
        }

        return predictions;
    }

    @Transactional(readOnly = true)
    public Optional<PredictionResponseDTO> getLatestPrediction(String productId) {
        return predictionRepository.findTopByProductAsinOrderByGeneratedAtDesc(productId)
                .map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public List<PredictionResponseDTO> getAllLatestPredictions() {
        return predictionRepository.findLatestPredictionsForAllProducts()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PredictionResponseDTO> getPotentialBestsellers() {
        return predictionRepository.findByIsPotentialBestsellerTrueOrderByBestsellerProbabilityDesc()
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PredictionResponseDTO> getPredictionsByCategory(String category) {
        return predictionRepository.findByCategoryOrderByGeneratedAtDesc(category)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
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

        Map<String, Long> trendDistribution = allPredictions.stream()
                .filter(p -> p.getRankingTrend() != null)
                .collect(Collectors.groupingBy(Prediction::getRankingTrend, Collectors.counting()));

        Map<String, Long> priceActionDistribution = allPredictions.stream()
                .filter(p -> p.getPriceAction() != null)
                .collect(Collectors.groupingBy(Prediction::getPriceAction, Collectors.counting()));

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

        return PredictionStatsDTO.builder()
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
    }

    @Transactional(readOnly = true)
    public List<PredictionResponseDTO> getUnnotifiedPredictionsForSeller(Long sellerId) {
        return predictionRepository.findBySellerIdAndNotificationSentFalse(sellerId)
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPotentialBestseller()) ||
                        (p.getPriceChangePercentage() != null && Math.abs(p.getPriceChangePercentage()) > 15))
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Scheduled(cron = "0 0 2 * * ?")
    public void generateDailyPredictions() {
        log.info("⏰ Déclenchement planifié de la génération quotidienne");
        generateDailyPredictionsAsync();
    }

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

    /**
     * ✅ ULTRA-DEFENSIVE: Comprehensive null checking for ALL nested fields
     */
    private Prediction createPredictionFromMap(Product product, Map<String, Object> response) {
        Long sellerId = product.getSeller() != null ? product.getSeller().getId() : null;
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        Prediction.PredictionBuilder builder = Prediction.builder()
                .productAsin(product.getAsin())  // ✅ CRITICAL: Must be set!
                .productName(product.getProductName())
                .sellerId(sellerId)
                .category(categoryName)
                .generatedAt(LocalDateTime.now())
                .notificationSent(false);

        // ✅ DEFENSIVE: Extract with comprehensive null checks
        try {
            // Extract Ranking Prediction
            if (response.containsKey("ranking") && response.get("ranking") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> ranking = (Map<String, Object>) response.get("ranking");
                builder.currentRanking(safeGetInt(ranking, "currentRanking", 9999))
                        .predictedRanking(safeGetInt(ranking, "predictedRanking", 9999))
                        .rankingChange(safeGetInt(ranking, "rankingChange", 0))
                        .rankingTrend(safeGetString(ranking, "trend", "STABLE"))
                        .rankingConfidence(safeGetDouble(ranking, "confidence", 0.5));
            } else {
                // Set defaults if ranking data is missing
                builder.currentRanking(9999)
                        .predictedRanking(9999)
                        .rankingChange(0)
                        .rankingTrend("STABLE")
                        .rankingConfidence(0.5);
            }

            // Extract Bestseller Prediction
            if (response.containsKey("bestseller") && response.get("bestseller") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> bestseller = (Map<String, Object>) response.get("bestseller");
                builder.bestsellerProbability(safeGetDouble(bestseller, "bestsellerProbability", 0.0))
                        .isPotentialBestseller(safeGetBoolean(bestseller, "isPotentialBestseller", false))
                        .potentialLevel(safeGetString(bestseller, "potentialLevel", "FAIBLE"))
                        .bestsellerConfidence(safeGetDouble(bestseller, "confidence", 0.5));
            } else {
                // Set defaults if bestseller data is missing
                builder.bestsellerProbability(0.0)
                        .isPotentialBestseller(false)
                        .potentialLevel("FAIBLE")
                        .bestsellerConfidence(0.5);
            }

            // Extract Price Prediction
            if (response.containsKey("price") && response.get("price") instanceof Map) {
                @SuppressWarnings("unchecked")
                Map<String, Object> price = (Map<String, Object>) response.get("price");
                builder.currentPrice(safeGetDouble(price, "currentPrice", 0.0))
                        .recommendedPrice(safeGetDouble(price, "recommendedPrice", 0.0))
                        .priceDifference(safeGetDouble(price, "priceDifference", 0.0))
                        .priceChangePercentage(safeGetDouble(price, "priceChangePercentage", 0.0))
                        .priceAction(safeGetString(price, "priceAction", "MAINTENIR"))
                        .priceConfidence(safeGetDouble(price, "confidence", 0.5));
            } else {
                // Set defaults if price data is missing
                double currentPrice = safeDouble(product.getPrice(), 0.0);
                builder.currentPrice(currentPrice)
                        .recommendedPrice(currentPrice)
                        .priceDifference(0.0)
                        .priceChangePercentage(0.0)
                        .priceAction("MAINTENIR")
                        .priceConfidence(0.5);
            }

        } catch (Exception e) {
            log.error("❌ Error extracting prediction data for {}: {}", product.getAsin(), e.getMessage());
            // Even if extraction fails, we have defaults set
        }

        Prediction prediction = builder.build();

        log.debug("📊 Created prediction for {}: bestseller={}, ranking={}, price={}",
                product.getAsin(),
                prediction.getIsPotentialBestseller(),
                prediction.getPredictedRanking(),
                prediction.getRecommendedPrice());

        return prediction;
    }

    /**
     * ✅ NEW: Safe extraction helpers with defaults
     */
    private Integer safeGetInt(Map<String, Object> map, String key, Integer defaultValue) {
        try {
            Object value = map.get(key);
            if (value == null) return defaultValue;
            if (value instanceof Number) {
                return ((Number) value).intValue();
            }
            return Integer.parseInt(value.toString());
        } catch (Exception e) {
            log.warn("Failed to extract int for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    private Double safeGetDouble(Map<String, Object> map, String key, Double defaultValue) {
        try {
            Object value = map.get(key);
            if (value == null) return defaultValue;
            if (value instanceof Number) {
                return ((Number) value).doubleValue();
            }
            return Double.parseDouble(value.toString());
        } catch (Exception e) {
            log.warn("Failed to extract double for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    private String safeGetString(Map<String, Object> map, String key, String defaultValue) {
        try {
            Object value = map.get(key);
            return value != null ? value.toString() : defaultValue;
        } catch (Exception e) {
            log.warn("Failed to extract string for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    private Boolean safeGetBoolean(Map<String, Object> map, String key, Boolean defaultValue) {
        try {
            Object value = map.get(key);
            if (value == null) return defaultValue;
            if (value instanceof Boolean) {
                return (Boolean) value;
            }
            return Boolean.parseBoolean(value.toString());
        } catch (Exception e) {
            log.warn("Failed to extract boolean for key {}: {}", key, e.getMessage());
            return defaultValue;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    private void checkAndSendNotification(Prediction prediction, Product product) {
        try {
            if (product.getSeller() == null) return;

            User seller = product.getSeller();
            boolean shouldNotify = false;
            String title = "";
            String message = "";
            Notification.NotificationType type = Notification.NotificationType.SYSTEM;

            // Bestseller notification
            if (Boolean.TRUE.equals(prediction.getIsPotentialBestseller())) {
                shouldNotify = true;
                type = Notification.NotificationType.PREDICTION_BESTSELLER;
                title = "🌟 Produit à fort potentiel détecté";
                message = String.format(
                        "Votre produit '%s' a été identifié comme un bestseller potentiel avec une probabilité de %.0f%%. Niveau: %s.",
                        product.getProductName(),
                        (prediction.getBestsellerProbability() != null ? prediction.getBestsellerProbability() : 0.0) * 100,
                        prediction.getPotentialLevel()
                );
            }

            // Price notification
//            if (prediction.getPriceChangePercentage() != null && Math.abs(prediction.getPriceChangePercentage()) > 15) {
//                shouldNotify = true;
//                type = Notification.NotificationType.PREDICTION_PRICE;
//                String action = prediction.getPriceChangePercentage() > 0 ? "augmenter" : "réduire";
//                title = "💰 Recommandation de prix";
//                message = String.format(
//                        "Notre analyse suggère de %s le prix de '%s' de %.1f%% (de %.2f€ à %.2f€) pour optimiser vos ventes.",
//                        action,
//                        product.getProductName(),
//                        Math.abs(prediction.getPriceChangePercentage()),
//                        prediction.getCurrentPrice(),
//                        prediction.getRecommendedPrice()
//                );
//            }

            if (shouldNotify) {
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

                log.info("📧 Notification envoyée au vendeur {} pour le produit {}", seller.getId(), product.getAsin());
            }
        } catch (Exception e) {
            log.error("❌ Erreur lors de l'envoi de la notification: {}", e.getMessage());
            // Don't propagate - notification failure shouldn't fail the prediction
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
                        .trendDescription(getTrendDescription(prediction.getRankingTrend(), prediction.getRankingChange()))
                        .confidence(prediction.getRankingConfidence())
                        .build())
                .bestsellerPrediction(PredictionResponseDTO.BestsellerPredictionDTO.builder()
                        .bestsellerProbability(prediction.getBestsellerProbability())
                        .isPotentialBestseller(prediction.getIsPotentialBestseller())
                        .potentialLevel(prediction.getPotentialLevel())
                        .recommendation(getBestsellerRecommendation(prediction.getBestsellerProbability()))
                        .confidence(prediction.getBestsellerConfidence())
                        .build())
                .pricePrediction(PredictionResponseDTO.PricePredictionDTO.builder()
                        .recommendedPrice(prediction.getRecommendedPrice())
                        .currentPrice(prediction.getCurrentPrice())
                        .priceDifference(prediction.getPriceDifference())
                        .priceChangePercentage(prediction.getPriceChangePercentage())
                        .priceAction(prediction.getPriceAction())
                        .actionDescription(getPriceActionDescription(prediction.getPriceAction(), prediction.getPriceChangePercentage()))
                        .shouldNotifySeller(false)
                        .confidence(prediction.getPriceConfidence())
                        .isReliable(false)
                        .reliabilityReason("Modèle nécessite plus de données de ventes (MAPE: 60%)")  // ✅ NEW
                        .build())
                .build();
    }

    private String getTrendDescription(String trend, Integer change) {
        if (trend == null) return "Tendance inconnue";

        int changeAbs = Math.abs(change != null ? change : 0);

        switch (trend) {
            case "AMÉLIORATION":
                if (changeAbs > 500) {
                    return "🚀 Forte amélioration prévue du classement";
                } else if (changeAbs > 100) {
                    return "📈 Amélioration significative prévue";
                } else {
                    return "📊 Légère amélioration prévue";
                }

            case "DÉCLIN":
                if (changeAbs > 500) {
                    return "⚠️ Déclin important prévu - action recommandée";
                } else if (changeAbs > 100) {
                    return "📉 Déclin modéré prévu";
                } else {
                    return "📊 Légère baisse prévue";
                }

            default:
                return "✅ Classement stable prévu (±" + changeAbs + " positions)";
        }
    }

    private String getBestsellerRecommendation(Double probability) {
        if (probability == null) return "Données insuffisantes";
        if (probability >= 0.80) return "Excellent potentiel! Augmentez la visibilité marketing.";
        if (probability >= 0.60) return "Bon potentiel. Considérez des promotions ciblées.";
        if (probability >= 0.40) return "Potentiel modéré. Analysez les avis clients.";
        return "Potentiel faible. Réévaluez le positionnement.";
    }

    private String getPriceActionDescription(String action, Double percentage) {
        if (action == null) return "Aucune action recommandée";
        if (percentage == null) percentage = 0.0;

        switch (action) {
            case "AUGMENTER":
                return String.format("Augmentation de %.1f%% recommandée", Math.abs(percentage));
            case "DIMINUER":
                return String.format("Réduction de %.1f%% recommandée", Math.abs(percentage));
            default:
                return "Le prix actuel est optimal";
        }
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

    @Async("predictionExecutor")
    public void generateDailyPredictionsAsync() {
        log.info("🌙 Début de la génération quotidienne des prédictions (async)");

        List<Product> allProducts = productRepository.findAll();
        int successCount = 0;
        int failureCount = 0;

        for (Product product : allProducts) {
            try {
                generatePredictionForProduct(product.getAsin());
                successCount++;
                if ((successCount + failureCount) % 50 == 0) {
                    log.info("📊 Progression: {}/{} produits traités",
                            successCount + failureCount, allProducts.size());
                }
            } catch (Exception e) {
                log.error("❌ Erreur pour le produit {}: {}",
                        product.getAsin(), e.getMessage());
                failureCount++;
            }
        }
        log.info("✅ Génération quotidienne terminée: {} succès, {} échecs",
                successCount, failureCount);
    }

    private boolean validatePrediction(Prediction prediction) {
        if (prediction.getProductAsin() == null || prediction.getProductAsin().isEmpty()) {
            log.warn("⚠️  Product ASIN is null");
            return false;
        }
        return true;
    }

}