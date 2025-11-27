package com.dashboard.service;

import com. dashboard.dto.request.OrderRequest;
import com.dashboard.dto. response.OrderResponse;
import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard. repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. Pageable;
import org.springframework. security.core.Authentication;
import org.springframework.security.core.context. SecurityContextHolder;
import org.springframework. stereotype.Service;
import org.springframework. transaction.annotation. Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java. util.List;
import java.util. Map;
import java.util. stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext(). getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public OrderResponse createOrder(OrderRequest request) {
        User buyer = getCurrentUser();
        log.info("Creating order for user: {}", buyer. getEmail());

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        Order order = Order.builder()
                .user(buyer)
                .status(Order.OrderStatus.PENDING)
                .notes(request.getNotes())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;
        int totalItems = 0;

        for (OrderRequest. OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findByAsin(itemRequest. getProductAsin())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Product not found: " + itemRequest.getProductAsin()));

            if (product.getPrice() == null) {
                throw new BadRequestException("Product price not available: " + product.getProductName());
            }

            int quantity = itemRequest. getQuantity() != null ? itemRequest. getQuantity() : 1;

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(quantity)
                    .unitPrice(product.getPrice())
                    .subtotal(product.getPrice().multiply(BigDecimal.valueOf(quantity)))
                    .productName(product.getProductName())
                    .productImage(product.getImageUrl())
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(orderItem.getSubtotal());
            totalItems += quantity;
        }

        order.setTotalAmount(totalAmount);
        order.setTotalItems(totalItems);

        order = orderRepository.save(order);
        log.info("Order created: {} with {} items, total: {}",
                order. getOrderNumber(), totalItems, totalAmount);

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    public OrderResponse confirmOrder(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        User currentUser = getCurrentUser();

        if (! order.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("You can only confirm your own orders");
        }

        if (order.getStatus() != Order.OrderStatus. PENDING) {
            throw new BadRequestException("Only pending orders can be confirmed");
        }

        order.confirm();
        order = orderRepository.save(order);

        log.info("Order confirmed: {}", order.getOrderNumber());

        // Update product sales count
        updateProductSalesCount(order);

        // Create notification
        createOrderNotification(order);

        return OrderResponse.fromEntity(order);
    }

    @Transactional
    protected void updateProductSalesCount(Order order) {
        for (OrderItem item : order.getItems()) {
            Product product = item.getProduct();
            product.incrementSalesCount(item.getQuantity());
            productRepository. save(product);
            log.info("Updated sales count for product {}: new count = {}",
                    product.getAsin(), product.getSalesCount());
        }
    }

    @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = orderRepository. findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        User currentUser = getCurrentUser();

        if (!order.getUser().getId().equals(currentUser.getId())
                && currentUser.getRole() != User.Role. ADMIN) {
            throw new BadRequestException("You can only cancel your own orders");
        }

        if (order.getStatus() == Order.OrderStatus. CANCELLED) {
            throw new BadRequestException("Order is already cancelled");
        }

        if (order.getStatus() == Order.OrderStatus.DELIVERED) {
            throw new BadRequestException("Cannot cancel a delivered order");
        }

        order. cancel();
        order = orderRepository.save(order);

        log.info("Order cancelled: {}", order.getOrderNumber());

        return OrderResponse.fromEntity(order);
    }

    public OrderResponse getOrderById(Long orderId) {
        Order order = orderRepository. findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderId));

        User currentUser = getCurrentUser();

        if (! order.getUser(). getId().equals(currentUser.getId())
                && currentUser. getRole() != User.Role.ADMIN
                && currentUser. getRole() != User.Role.ANALYST) {
            throw new BadRequestException("Access denied");
        }

        return OrderResponse.fromEntity(order);
    }

    public OrderResponse getOrderByNumber(String orderNumber) {
        Order order = orderRepository. findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + orderNumber));

        return OrderResponse.fromEntity(order);
    }

    // This matches what OrderController expects
    public List<OrderResponse> getMyOrders() {
        User user = getCurrentUser();
        return orderRepository.findByUserOrderByCreatedAtDesc(user)
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    public Page<OrderResponse> getAllOrders(Pageable pageable) {
        return orderRepository.findAll(pageable)
                .map(OrderResponse::fromEntity);
    }

    public List<OrderResponse> getRecentOrders(int limit) {
        return orderRepository.findRecentOrders(Pageable.ofSize(limit))
                .stream()
                .map(OrderResponse::fromEntity)
                .toList();
    }

    public Long countTodayOrders() {
        return orderRepository. countTodayOrders();
    }

    public BigDecimal getTodayRevenue() {
        BigDecimal revenue = orderRepository.calculateTodayRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private void createOrderNotification(Order order) {
        try {
            String itemsDescription = order.getItems().stream()
                    .map(item -> item.getProductName() + " x" + item.getQuantity())
                    . reduce((a, b) -> a + ", " + b)
                    . orElse("");

            Notification notification = Notification.builder()
                    .recipient(order.getUser())  // Required - the user who placed the order
                    . type(Notification.NotificationType.NEW_ORDER)
                    .title("🛒 New Order #" + order.getOrderNumber())
                    .message("Order from " + order.getUser().getFullName() + ": " + itemsDescription +
                            " - Total: " + order.getTotalAmount() + " MAD (" + order.getTotalItems() + " items)")
                    .referenceId(String.valueOf(order. getId()))  // Convert Long to String
                    .referenceType("ORDER")
                    .build();

            notificationRepository.save(notification);
            log.info("Notification created for order: {}", order.getOrderNumber());
        } catch (Exception e) {
            log.error("Failed to create notification for order {}: {}", order.getOrderNumber(), e. getMessage());
        }
    }
}