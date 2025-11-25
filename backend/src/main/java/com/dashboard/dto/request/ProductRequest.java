package com.dashboard.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    @Size(max = 20, message = "ASIN must not exceed 20 characters")
    private String asin;

    @Size(max = 500, message = "Product name must not exceed 500 characters")
    private String productName;

    private String description;

    @DecimalMin(value = "0.0", inclusive = false, message = "Price must be greater than 0")
    private BigDecimal price;

    // These fields are read-only (set by customer activity, not admin)
    // They can be set during import but not through regular create/update
    @DecimalMin(value = "1.0", message = "Rating must be at least 1.0")
    @DecimalMax(value = "5.0", message = "Rating must not exceed 5.0")
    private BigDecimal rating;

    @Min(value = 0, message = "Reviews count cannot be negative")
    private Integer reviewsCount;

    @Min(value = 1, message = "Ranking must be at least 1")
    private Integer ranking;

    @Min(value = 1, message = "Number of sellers must be at least 1")
    private Integer noOfSellers;

    private String productLink;

    private String imageUrl;

    private Long categoryId;
}