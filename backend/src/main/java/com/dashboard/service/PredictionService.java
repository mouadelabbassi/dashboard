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

    /**
     * Génère une prédiction complète pour un produit.
     */
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

        Optional<JsonNode> mlResponse = flaskClient.getFullPrediction(request);
        if (mlResponse.isEmpty()) {
            log.error("Échec de la prédiction ML pour le produit: {}", productId);
            return Optional.empty();
        }

        JsonNode response = mlResponse.get();
        Prediction prediction = createPredictionFromResponse(product, response);
        predictionRepository.save(prediction);

        checkAndSendNotification(prediction, product);

        return Optional.of(convertToDTO(prediction));
    }

    /**
     * Génère des prédictions pour tous les produits d'un vendeur.
     */
    @Transactional
    public List<PredictionResponseDTO> generatePredictionsForSeller(Long sellerId) {
        log.info("Génération des prédictions pour le vendeur:  {}", sellerId);

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
        return predictionRepository.findFirstByProductIdOrderByGeneratedAtDesc(productId)
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

        long productsWithPriceRecommendation = allPredictions.stream()
                .filter(p -> !"MAINTENIR".equals(p.getPriceAction()))
                .count();

        long productsWithRankingImprovement = allPredictions.stream()
                .filter(p -> "AMÉLIORATION".equals(p.getRankingTrend()))
                .count();

        double averageBestsellerProbability = allPredictions.stream()
                .mapToDouble(p -> p.getBestsellerProbability() != null ? p.getBestsellerProbability() : 0)
                .average()
                .orElse(0.0);

        double averagePriceChangeRecommended = allPredictions.stream()
                .mapToDouble(p -> p.getPriceChangePercentage() != null ? Math.abs(p.getPriceChangePercentage()) : 0)
                .average()
                .orElse(0.0);

        Map<String, Long> trendDistribution = allPredictions.stream()
                .filter(p -> p.getRankingTrend() != null)
                .collect(Collectors.groupingBy(Prediction::getRankingTrend, Collectors.counting()));

        Map<String, Long> priceActionDistribution = allPredictions.stream()
                .filter(p -> p.getPriceAction() != null)
                .collect(Collectors.groupingBy(Prediction::getPriceAction, Collectors.counting()));

        List<PredictionStatsDTO.CategoryStatsDTO> categoryStats = allPredictions.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(Prediction::getCategory))
                .entrySet().stream()
                .map(entry -> PredictionStatsDTO.CategoryStatsDTO.builder()
                        .category(entry.getKey())
                        .productCount((long) entry.getValue().size())
                        .avgBestsellerProbability(entry.getValue().stream()
                                .mapToDouble(p -> p.getBestsellerProbability() != null ? p.getBestsellerProbability() : 0)
                                .average().orElse(0.0))
                        .avgPriceChange(entry.getValue().stream()
                                .mapToDouble(p -> p.getPriceChangePercentage() != null ? p.getPriceChangePercentage() : 0)
                                .average().orElse(0.0))
                        .build())
                .collect(Collectors.toList());

        return PredictionStatsDTO.builder()
                .totalPredictions(totalPredictions)
                .potentialBestsellersCount(potentialBestsellersCount)
                .productsWithPriceRecommendation(productsWithPriceRecommendation)
                .productsWithRankingImprovement(productsWithRankingImprovement)
                .averageBestsellerProbability(averageBestsellerProbability)
                .averagePriceChangeRecommended(averagePriceChangeRecommended)
                .trendDistribution(trendDistribution)
                .priceActionDistribution(priceActionDistribution)
                .categoryStats(categoryStats)
                .build();
    }

    /**
     * Récupère les prédictions non notifiées pour un vendeur.
     */
    public List<PredictionResponseDTO> getUnnotifiedPredictionsForSeller(Long sellerId) {
        return predictionRepository.findBySellerIdAndNotificationSentFalse(sellerId)
                .stream()
                .filter(p -> Boolean.TRUE.equals(p.getIsPotentialBestseller()) ||
                        (p.getPriceChangePercentage() != null && Math.abs(p.getPriceChangePercentage()) > 15))
                .map(this:: convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Tâche planifiée pour générer des prédictions quotidiennes.
     */
    @Scheduled(cron = "0 0 2 * * ? ")
    @Transactional
    public void generateDailyPredictions() {
        log.info("Début de la génération quotidienne des prédictions");

        List<Product> allProducts = productRepository.findAll();
        int successCount = 0;
        int failureCount = 0;

        for (Product product :  allProducts) {
            try {
                generatePredictionForProduct(product.getAsin());
                successCount++;
            } catch (Exception e) {
                log.error("Erreur pour le produit {}: {}", product.getAsin(), e.getMessage());
                failureCount++;
            }
        }

        log.info("Génération quotidienne terminée:  {} succès, {} échecs", successCount, failureCount);
    }

    // ==================== MÉTHODES PRIVÉES ====================

    private PredictionRequestDTO buildPredictionRequest(Product product) {
        int daysSinceListed = 30;
        if (product.getCreatedAt() != null) {
            daysSinceListed = (int) ChronoUnit.DAYS.between(product.getCreatedAt(), LocalDateTime.now());
        }

        // Extraire le nom de la catégorie
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : "Electronics";

        // Convertir BigDecimal en Double
        Double price = product.getPrice() != null ? product.getPrice().doubleValue() : 0.0;
        Double rating = product.getRating() != null ? product.getRating().doubleValue() : 3.0;

        return PredictionRequestDTO.builder()
                .productId(product.getAsin())
                .productName(product.getProductName())
                .currentPrice(price)
                .rating(rating)
                .reviewCount(product.getReviewsCount() != null ? product.getReviewsCount() : 0)
                .salesCount(product.getSalesCount() != null ? product.getSalesCount() : 0)
                .stockQuantity(product.getStockQuantity() != null ? product.getStockQuantity() : 0)
                .daysSinceListed(daysSinceListed)
                .sellerRating(3.5)
                .discountPercentage(0.0)  // Pas de champ discountPercentage dans Product
                .category(categoryName)
                .currentRanking(product.getRanking() != null ? product.getRanking() : 100)
                .build();
    }

    private Prediction createPredictionFromResponse(Product product, JsonNode response) {
        // Extraire le sellerId depuis l'objet User seller
        Long sellerId = product.getSeller() != null ? product.getSeller().getId() : null;

        // Extraire le nom de la catégorie
        String categoryName = product.getCategory() != null ? product.getCategory().getName() : null;

        Prediction.PredictionBuilder builder = Prediction.builder()
                .productId(product.getAsin())
                .productName(product.getProductName())
                .sellerId(sellerId)
                .category(categoryName)
                .generatedAt(LocalDateTime.now());

        JsonNode rankingNode = response.get("ranking_prediction");
        if (rankingNode != null) {
            builder.currentRanking(getIntValue(rankingNode, "current_ranking"))
                    .predictedRanking(getIntValue(rankingNode, "predicted_ranking"))
                    .rankingChange(getIntValue(rankingNode, "ranking_change"))
                    .rankingTrend(getTextValue(rankingNode, "trend"))
                    .rankingConfidence(getDoubleValue(rankingNode, "confidence"));
        }

        JsonNode bestsellerNode = response.get("bestseller_prediction");
        if (bestsellerNode != null) {
            builder.bestsellerProbability(getDoubleValue(bestsellerNode, "bestseller_probability"))
                    .isPotentialBestseller(getBooleanValue(bestsellerNode, "is_potential_bestseller"))
                    .potentialLevel(getTextValue(bestsellerNode, "potential_level"))
                    .bestsellerConfidence(getDoubleValue(bestsellerNode, "confidence"));
        }

        JsonNode priceNode = response.get("price_prediction");
        if (priceNode != null) {
            builder.currentPrice(getDoubleValue(priceNode, "current_price"))
                    .recommendedPrice(getDoubleValue(priceNode, "recommended_price"))
                    .priceDifference(getDoubleValue(priceNode, "price_difference"))
                    .priceChangePercentage(getDoubleValue(priceNode, "price_change_percentage"))
                    .priceAction(getTextValue(priceNode, "price_action"))
                    .priceConfidence(getDoubleValue(priceNode, "confidence"));
        }

        return builder.build();
    }

    private void checkAndSendNotification(Prediction prediction, Product product) {
        // Vérifier si le produit a un seller
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
                    "Votre produit '%s' a été identifié comme un bestseller potentiel avec une probabilité de %.0f%%. Niveau:  %s.",
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
                log.error("Erreur lors de l'envoi de la notification:  {}", e.getMessage());
            }
        }
    }

    private PredictionResponseDTO convertToDTO(Prediction prediction) {
        return PredictionResponseDTO.builder()
                .productId(prediction.getProductId())
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

    private Integer getIntValue(JsonNode node, String field) {
        return node.has(field) && ! node.get(field).isNull() ? node.get(field).asInt() : null;
    }

    private Double getDoubleValue(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asDouble() : null;
    }

    private String getTextValue(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asText() : null;
    }

    private Boolean getBooleanValue(JsonNode node, String field) {
        return node.has(field) && !node.get(field).isNull() ? node.get(field).asBoolean() : null;
    }
}