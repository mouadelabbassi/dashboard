package com.dashboard.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionRequest {

    private String asin;

    @JsonProperty("product_name")
    private String productName;

    private BigDecimal price;

    private BigDecimal rating;

    @JsonProperty("reviews_count")
    private Integer reviewsCount;

    @JsonProperty("sales_count")
    private Integer salesCount;

    private Integer ranking;

    @JsonProperty("stock_quantity")
    private Integer stockQuantity;

    @JsonProperty("discount_percentage")
    private Double discountPercentage;

    @JsonProperty("days_since_listed")
    private Integer daysSinceListed;

    @JsonProperty("category_avg_price")
    private BigDecimal categoryAvgPrice;

    @JsonProperty("category_avg_reviews")
    private Double categoryAvgReviews;

    @JsonProperty("category_min_price")
    private BigDecimal categoryMinPrice;

    @JsonProperty("category_max_price")
    private BigDecimal categoryMaxPrice;
}