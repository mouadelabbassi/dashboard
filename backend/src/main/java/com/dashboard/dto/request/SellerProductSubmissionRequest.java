package com.dashboard.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductSubmissionRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 500, message = "Product name must be less than 500 characters")
    private String productName;

    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    private BigDecimal price;

    @NotNull(message = "Stock quantity is required")
    @Min(value = 1, message = "Stock quantity must be at least 1")
    private Integer stockQuantity;

    private String imageUrl;

    private String additionalImages;

    @NotNull(message = "Category is required")
    private Long categoryId;
}