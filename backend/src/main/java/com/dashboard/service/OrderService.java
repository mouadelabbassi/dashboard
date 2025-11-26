package com.dashboard.service;

import com.dashboard.dto.request.OrderRequest;
import com.dashboard.dto.response.OrderItemResponse;
import com.dashboard.dto.response.OrderResponse;
import com.dashboard.entity.Order;
import com.dashboard.entity.OrderItem;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.OrderRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public OrderResponse createOrder(Long userId, OrderRequest request) {
        log.info("Creating order for user {}", userId);

        // Validate request
        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new BadRequestException("Order must contain at least one item");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Create order
        Order order = Order.builder()
                .user(user)
                .status(Order.OrderStatus.PENDING)
                .build();

        // Add order items
        for (OrderRequest.OrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductAsin())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found with ASIN: " + itemRequest.getProductAsin()));

            if (itemRequest.getQuantity() <= 0) {
                throw new BadRequestException("Quantity must be greater than 0");
            }

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(product.getPrice())
                    .build();

            order.addOrderItem(orderItem);
        }

        // Save order
        Order savedOrder = orderRepository.save(order);

        // Create notification for admin
        notificationService.createOrderNotification(savedOrder);

        log.info("Order created successfully with id {}", savedOrder.getId());
        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByUser(Long userId) {
        log.info("Fetching orders for user {}", userId);
        List<Order> orders = orderRepository.findByUserIdOrderByOrderDateDesc(userId);
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(Long orderId) {
        log.info("Fetching order with id {}", orderId);
        Order order = orderRepository.findByIdWithItems(orderId);
        if (order == null) {
            throw new ResourceNotFoundException("Order not found with id: " + orderId);
        }
        return mapToOrderResponse(order);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getAllOrders() {
        log.info("Fetching all orders");
        List<Order> orders = orderRepository.findAllByOrderByOrderDateDesc();
        return orders.stream()
                .map(this::mapToOrderResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public OrderResponse confirmOrder(Long orderId) {
        log.info("Confirming order {}", orderId);
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found with id: " + orderId));

        order.setStatus(Order.OrderStatus.CONFIRMED);
        Order savedOrder = orderRepository.save(order);

        return mapToOrderResponse(savedOrder);
    }

    private OrderResponse mapToOrderResponse(Order order) {
        List<OrderItemResponse> items = order.getOrderItems().stream()
                .map(this::mapToOrderItemResponse)
                .collect(Collectors.toList());

        return OrderResponse.builder()
                .id(order.getId())
                .userId(order.getUser().getId())
                .userEmail(order.getUser().getEmail())
                .userFullName(order.getUser().getFullName())
                .orderDate(order.getOrderDate())
                .status(order.getStatus().name())
                .totalAmount(order.getTotalAmount())
                .items(items)
                .build();
    }

    private OrderItemResponse mapToOrderItemResponse(OrderItem item) {
        return OrderItemResponse.builder()
                .id(item.getId())
                .productAsin(item.getProduct().getAsin())
                .productName(item.getProduct().getProductName())
                .productImageUrl(item.getProduct().getImageUrl())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .build();
    }
}
