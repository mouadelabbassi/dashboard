package com.dashboard.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints. NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotEmpty(message = "Order must contain at least one item")
    @Valid
    private List<OrderItemRequest> items;

    private String notes;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderItemRequest {
        @jakarta.validation.constraints. NotBlank(message = "Product ASIN is required")
        private String productAsin;

        @jakarta. validation.constraints.Min(value = 1, message = "Quantity must be at least 1")
        @Builder.Default
        private Integer quantity = 1;
    }
}