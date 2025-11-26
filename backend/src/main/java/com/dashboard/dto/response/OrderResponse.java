package com.dashboard.dto.response;

import com.dashboard.entity. Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util. List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {
    private Long id;
    private String orderNumber;
    private Long userId;
    private String userName;
    private String userEmail;
    private String status;
    private String statusDescription;
    private BigDecimal totalAmount;
    private Integer totalItems;
    private LocalDateTime orderDate;
    private LocalDateTime confirmedAt;
    private LocalDateTime cancelledAt;
    private String notes;
    private List<OrderItemResponse> items;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemResponse {
        private Long id;
        private String productAsin;
        private String productName;
        private String productImage;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal subtotal;
    }

    public static OrderResponse fromEntity(Order order) {
        return OrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .userId(order.getUser().getId())
                .userName(order. getUser().getFullName())
                . userEmail(order. getUser().getEmail())
                .status(order.getStatus().name())
                .statusDescription(order.getStatus().getDescription())
                .totalAmount(order.getTotalAmount())
                .totalItems(order.getTotalItems())
                .orderDate(order.getOrderDate())
                .confirmedAt(order.getConfirmedAt())
                .cancelledAt(order.getCancelledAt())
                .notes(order.getNotes())
                .items(order.getItems().stream()
                        . map(item -> OrderItemResponse. builder()
                                . id(item.getId())
                                . productAsin(item.getProduct().getAsin())
                                .productName(item.getProductName())
                                .productImage(item.getProductImage())
                                .quantity(item.getQuantity())
                                .unitPrice(item.getUnitPrice())
                                . subtotal(item. getSubtotal())
                                .build())
                        .toList())
                . createdAt(order.getCreatedAt())
                .build();
    }
}