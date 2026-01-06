package com.dashboard.service;

import com.dashboard.dto.response.NotificationResponse;
import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.NotificationRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public Notification createNotification(User recipient, Notification.NotificationType type,
                                           String title, String message, String referenceId,
                                           String referenceType, String actionUrl) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .referenceId(referenceId)
                .referenceType(referenceType)
                .actionUrl(actionUrl)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Created notification for user {}: {}", recipient.getEmail(), title);
        return notification;
    }

    // Seller notifications
    @Transactional
    public void notifySellerProductApproved(User seller, Product product) {
        createNotification(
                seller,
                Notification.NotificationType.PRODUCT_APPROVED,
                "Produit approuvé!  🎉",
                String.format("Votre produit '%s' a été approuvé et est maintenant en vente.", product.getProductName()),
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin()
        );
    }

    @Transactional
    public void notifySellerProductRejected(User seller, Product product, String reason) {
        createNotification(
                seller,
                Notification.NotificationType.PRODUCT_REJECTED,
                "Produit rejeté",
                String.format("Votre produit '%s' a été rejeté.Raison: %s", product.getProductName(), reason),
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin()
        );
    }

    @Transactional
    public void notifySellerProductPurchased(User seller, Product product, Order order, int quantity) {
        createNotification(
                seller,
                Notification.NotificationType.PRODUCT_PURCHASED,
                "Nouvelle vente!  💰",
                String.format("Votre produit '%s' a été acheté (x%d). Commande #%s",
                        product.getProductName(), quantity, order.getOrderNumber()),
                order.getOrderNumber(),
                "ORDER",
                "/seller/orders/" + order.getId()
        );
    }

    @Transactional
    public void notifyAdminProductPurchased(Product product, Order order, int quantity, double totalAmount, String buyerName) {
        List<User> admins = userRepository.findByRoleAndIsActiveTrue(User.Role.ADMIN);

        for (User admin : admins) {
            createNotification(
                    admin,
                    Notification.NotificationType.NEW_ORDER,
                    "New Order Received! 🛒",
                    String.format("'%s' purchased '%s' x%d for $%.2f.Order #%s",
                            buyerName, product.getProductName(), quantity, totalAmount, order.getOrderNumber()),
                    order.getOrderNumber(),
                    "ORDER",
                    "/admin/orders"
            );
        }
    }

    @Transactional
    public void notifySellerNewReview(User seller, Product product, ProductReview review) {
        String ratingStars = "⭐".repeat(review.getRating());
        String commentPreview = review.getComment() != null && ! review.getComment().isEmpty()
                ? review.getComment().substring(0, Math.min(50, review.getComment().length())) + "..."
                : "No comment";
        createNotification(
                seller,
                Notification.NotificationType.REVIEW_RECEIVED,
                "Nouvel avis reçu " + ratingStars,
                String.format("Un acheteur a laissé un avis sur '%s': %s",
                        product.getProductName(), commentPreview),
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin() + "/reviews"
        );
    }

    // Buyer notifications
    @Transactional
    public void notifyBuyerOrderConfirmed(User buyer, Order order) {
        createNotification(
                buyer,
                Notification.NotificationType.ORDER_CONFIRMED,
                "Commande confirmée ✓",
                String.format("Votre commande #%s a été confirmée.", order.getOrderNumber()),
                order.getOrderNumber(),
                "ORDER",
                "/orders/" + order.getId()
        );
    }

    @Transactional
    public void notifyAdminsNewProductSubmission(SellerProductRequest productRequest) {
        List<User> admins = userRepository.findByRoleAndIsActiveTrue(User.Role.ADMIN);
        for (User admin : admins) {
            createNotification(
                    admin,
                    Notification.NotificationType.NEW_SELLER_PRODUCT,
                    "Nouveau produit à approuver 📦",
                    String.format("Le vendeur '%s' a soumis un nouveau produit: %s",
                            productRequest.getSeller().getStoreName() != null
                                    ?  productRequest.getSeller().getStoreName()
                                    : productRequest.getSeller().getFullName(),
                            productRequest.getProductName()),
                    String.valueOf(productRequest.getId()),
                    "PRODUCT_REQUEST",
                    "/admin/product-approvals"
            );
        }
    }

    @Transactional
    public void notifyAdminsNewProductSubmission(Product product) {
        List<User> admins = userRepository.findByRoleAndIsActiveTrue(User.Role.ADMIN);
        for (User admin : admins) {
            createNotification(
                    admin,
                    Notification.NotificationType.NEW_SELLER_PRODUCT,
                    "Nouveau produit à approuver",
                    String.format("Le vendeur '%s' a soumis un nouveau produit: %s",
                            product.getSeller() != null && product.getSeller().getStoreName() != null
                                    ?  product.getSeller().getStoreName()
                                    : (product.getSeller() != null ? product.getSeller().getFullName() : "Unknown"),
                            product.getProductName()),
                    product.getAsin(),
                    "PRODUCT",
                    "/admin/product-approvals/" + product.getAsin()
            );
        }
    }

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getMyNotifications(Pageable pageable) {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientOrderByCreatedAtDesc(currentUser, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyUnreadNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(currentUser)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Long getUnreadCount() {
        User currentUser = getCurrentUser();
        return notificationRepository.countByRecipientAndIsReadFalse(currentUser);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification", "id", notificationId));

        if (! notification.getRecipient().getId().equals(currentUser.getId())) {
            throw new BadRequestException("You can only mark your own notifications as read");
        }

        notification.markAsRead();
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User currentUser = getCurrentUser();
        notificationRepository.markAllAsReadByRecipient(currentUser, LocalDateTime.now());
        log.info("Marked all notifications as read for user: {}", currentUser.getEmail());
    }

    @Transactional
    public void markMultipleAsRead(List<Long> notificationIds) {
        User currentUser = getCurrentUser();
        notificationRepository.markAsReadByIds(notificationIds, currentUser, LocalDateTime.now());
    }

    private NotificationResponse convertToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().name())
                .typeDescription(notification.getType().getDescription())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .actionUrl(notification.getActionUrl())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }

    @Transactional
    public void notifyAdminsStockUpdateRequest(User seller, Product product, Integer quantity) {
        List<User> admins = userRepository.findByRoleAndIsActiveTrue(User.Role.ADMIN);
        for (User admin : admins) {
            createNotification(
                    admin,
                    Notification.NotificationType.NEW_SELLER_PRODUCT,
                    "Stock Update Request 📦",
                    String.format("Seller '%s' wants to add %d units to '%s'",
                            seller.getStoreName() != null ? seller.getStoreName() : seller.getFullName(),
                            quantity,
                            product.getProductName()),
                    product.getAsin(),
                    "STOCK_REQUEST",
                    "/admin/stock-requests"
            );
        }
    }

    @Transactional
    public void notifySellerStockApproved(User seller, Product product, Integer quantity) {
        createNotification(
                seller,
                Notification.NotificationType.PRODUCT_APPROVED,
                "Stock Update Approved ✅",
                String.format("Your request to add %d units to '%s' has been approved",
                        quantity, product.getProductName()),
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin()
        );
    }

    @Transactional
    public void notifySellerLowStock(User seller, Product product, String customMessage) {
        int stock = product.getStockQuantity() != null ? product. getStockQuantity() : 0;
        String stockStatus = stock == 0 ? "OUT OF STOCK" : "LOW STOCK (" + stock + " units)";

        String message = customMessage != null && ! customMessage.isEmpty()
                ? customMessage
                : String.format("Your product '%s' is %s. Please update your stock to continue selling.",
                product. getProductName(), stockStatus);

        createNotification(
                seller,
                Notification.NotificationType.STOCK_ALERT,
                stock == 0 ? "⚠️ Product Out of Stock!" : "📦 Low Stock Alert",
                message,
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin() + "/edit"
        );
    }

    @Transactional
    public void notifySellerMultipleLowStock(User seller, List<Product> products) {
        int outOfStock = (int) products.stream().filter(p -> p.getStockQuantity() == null || p.getStockQuantity() == 0).count();
        int lowStock = products.size() - outOfStock;

        String message = String.format("You have %d product(s) with low stock and %d product(s) out of stock.  Please update your inventory.",
                lowStock, outOfStock);

        createNotification(
                seller,
                Notification.NotificationType.STOCK_ALERT,
                "📦 Stock Alert: " + products.size() + " Products Need Attention",
                message,
                String.valueOf(products.size()),
                "STOCK_ALERT",
                "/seller/products"
        );
    }

    @Transactional
    public void notifySellerStockRejected(User seller, Product product, String reason) {
        createNotification(
                seller,
                Notification.NotificationType.PRODUCT_REJECTED,
                "Stock Update Rejected ❌",
                String.format("Your stock update for '%s' was rejected. Reason: %s",
                        product.getProductName(), reason),
                product.getAsin(),
                "PRODUCT",
                "/seller/products/" + product.getAsin()
        );
    }
}