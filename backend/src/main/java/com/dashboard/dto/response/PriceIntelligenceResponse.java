package com.dashboard.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceIntelligenceResponse {

    @JsonProperty("product_id")
    private String productId;

    @JsonProperty("product_name")
    private String productName;

    @JsonProperty("current_price")
    private BigDecimal currentPrice;

    @JsonProperty("recommended_price")
    private BigDecimal recommendedPrice;

    @JsonProperty("price_difference")
    private BigDecimal priceDifference;

    @JsonProperty("price_change_percentage")
    private Double priceChangePercentage;

    @JsonProperty("price_action")
    private String priceAction;

    private String positioning;

    @JsonProperty("category_avg_price")
    private BigDecimal categoryAvgPrice;

    @JsonProperty("category_min_price")
    private BigDecimal categoryMinPrice;

    @JsonProperty("category_max_price")
    private BigDecimal categoryMaxPrice;

    @JsonProperty("analysis_method")
    private String analysisMethod;

    @JsonProperty("should_notify_seller")
    private Boolean shouldNotifySeller;

    @JsonProperty("analyzed_at")
    private LocalDateTime analyzedAt;
}