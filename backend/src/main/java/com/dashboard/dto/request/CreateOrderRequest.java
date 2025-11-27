package com.dashboard.dto.request;

import jakarta.validation.constraints. Min;
import jakarta. validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation. constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemRequest> items;

    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {

        @NotBlank(message = "Product ASIN is required")
        private String productAsin;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        private Integer quantity;
    }
}