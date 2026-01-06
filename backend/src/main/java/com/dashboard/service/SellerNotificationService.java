package com.dashboard.service;

import com.dashboard.entity.PredictionNotification;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import com.dashboard.repository.PredictionNotificationRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;


@Slf4j
@Service
@RequiredArgsConstructor
public class SellerNotificationService {

    private final PredictionNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    @Transactional
    public void sendBestsellerAlert(Long sellerId, String productId, BigDecimal confidence) {
        log.info("Sending bestseller alert for seller {} product {}", sellerId, productId);

        Optional<User> sellerOpt = userRepository.findById(sellerId);
        Optional<Product> productOpt = productRepository.findByAsin(productId);

        if (sellerOpt.isEmpty() || productOpt.isEmpty()) {
            log.warn("Cannot send alert - seller or product not found");
            return;
        }

        User seller = sellerOpt.get();
        Product product = productOpt.get();

        String title = " Potentiel Bestseller Détecté!";
        String message = String.format(
                "Votre produit '%s' a une probabilité de %.0f%% de devenir un bestseller! " +
                        "Envisagez de le mettre en avant dans vos promotions.",
                product.getProductName(),
                confidence.multiply(new BigDecimal("100")).doubleValue()
        );

        PredictionNotification notification = PredictionNotification.builder()
                .user(seller)
                .productId(productId)
                .notificationType(PredictionNotification.NotificationType.BESTSELLER)
                .title(title)
                .message(message)
                .confidenceScore(confidence)
                .actionUrl("/seller/products/" + productId)
                .build();

        notificationRepository.save(notification);
        log.info("Bestseller alert sent to seller {}", seller.getEmail());
    }


    @Transactional
    public void sendDeclineTrendAlert(Long sellerId, String productId, BigDecimal confidence) {
        log.info("Sending decline trend alert for seller {} product {}", sellerId, productId);

        Optional<User> sellerOpt = userRepository.findById(sellerId);
        Optional<Product> productOpt = productRepository.findByAsin(productId);

        if (sellerOpt.isEmpty() || productOpt.isEmpty()) {
            return;
        }

        User seller = sellerOpt.get();
        Product product = productOpt.get();

        String title = " Alerte: Tendance à la Baisse";
        String message = String.format(
                "Le classement de votre produit '%s' risque de baisser. " +
                        "Envisagez d'ajuster le prix ou d'améliorer la description.",
                product.getProductName()
        );

        PredictionNotification notification = PredictionNotification.builder()
                .user(seller)
                .productId(productId)
                .notificationType(PredictionNotification.NotificationType.DECLINING_TREND)
                .title(title)
                .message(message)
                .confidenceScore(confidence)
                .actionUrl("/seller/products/" + productId)
                .build();

        notificationRepository.save(notification);
    }



    @Transactional
    public void sendPriceOpportunityAlert(Long sellerId, String productId,
                                          BigDecimal currentPrice, BigDecimal recommendedPrice, BigDecimal changePercentage) {
        log.info("Sending price opportunity alert for seller {} product {}", sellerId, productId);

        Optional<User> sellerOpt = userRepository.findById(sellerId);
        Optional<Product> productOpt = productRepository.findByAsin(productId);

        if (sellerOpt.isEmpty() || productOpt.isEmpty()) {
            return;
        }

        User seller = sellerOpt.get();
        Product product = productOpt.get();

        String direction = changePercentage.compareTo(BigDecimal.ZERO) > 0 ? "augmenter" : "réduire";
        String title = "💰 Opportunité de Prix";
        String message = String.format(
                "Votre produit '%s' pourrait bénéficier d'un ajustement de prix. " +
                        "Prix actuel: $%.2f | Prix recommandé: $%.2f (%.1f%% de différence). " +
                        "Envisagez de %s le prix.",
                product.getProductName(),
                currentPrice.doubleValue(),
                recommendedPrice.doubleValue(),
                Math.abs(changePercentage.doubleValue()),
                direction
        );

        PredictionNotification notification = PredictionNotification.builder()
                .user(seller)
                .productId(productId)
                .notificationType(PredictionNotification.NotificationType.PRICE_OPPORTUNITY)
                .title(title)
                .message(message)
                .confidenceScore(new BigDecimal("0.85"))
                .actionUrl("/seller/products/" + productId + "/edit")
                .build();

        notificationRepository.save(notification);
    }

    @Transactional
    public void sendRankingImprovementAlert(Long sellerId, String productId,
                                            int estimatedImprovement, BigDecimal confidence) {
        Optional<User> sellerOpt = userRepository.findById(sellerId);
        Optional<Product> productOpt = productRepository.findByAsin(productId);

        if (sellerOpt.isEmpty() || productOpt.isEmpty()) {
            return;
        }

        User seller = sellerOpt.get();
        Product product = productOpt.get();

        String title = "📈 Amélioration du Classement Prévue";
        String message = String.format(
                "Bonne nouvelle! Votre produit '%s' devrait améliorer son classement " +
                        "d'environ %d positions. Continuez votre bonne stratégie!",
                product.getProductName(),
                estimatedImprovement
        );

        PredictionNotification notification = PredictionNotification.builder()
                .user(seller)
                .productId(productId)
                .notificationType(PredictionNotification.NotificationType.RANKING_IMPROVEMENT)
                .title(title)
                .message(message)
                .confidenceScore(confidence)
                .actionUrl("/seller/products/" + productId)
                .build();

        notificationRepository.save(notification);
    }


    @Transactional(readOnly = true)
    public List<PredictionNotification> getUnreadNotifications(Long sellerId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(sellerId);
    }

    @Transactional(readOnly = true)
    public List<PredictionNotification> getAllNotifications(Long sellerId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(sellerId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId)
                .ifPresent(notification -> {
                    notification.markAsRead();
                    notificationRepository.save(notification);
                });
    }

    @Transactional
    public void markAllAsRead(Long sellerId) {
        List<PredictionNotification> unread = notificationRepository
                .findByUserIdAndIsReadFalseOrderByCreatedAtDesc(sellerId);

        unread.forEach(PredictionNotification::markAsRead);
        notificationRepository.saveAll(unread);
    }


    @Transactional(readOnly = true)
    public long getUnreadCount(Long sellerId) {
        return notificationRepository.countByUserIdAndIsReadFalse(sellerId);
    }
}