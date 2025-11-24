package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsResponse {
    private Long totalProducts;
    private Long totalCategories;
    private BigDecimal avgPrice;
    private BigDecimal avgRating;
    private Long totalReviews;
    private BigDecimal totalRevenue;
    private Long totalSales;
    private BigDecimal totalInventoryValue;
}