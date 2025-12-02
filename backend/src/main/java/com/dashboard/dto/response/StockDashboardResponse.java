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
public class StockDashboardResponse {
    private Long totalStockItems;
    private Long availableStockItems;
    private Long totalUnitsInStock;
    private Long totalUnitsAvailable;
    private BigDecimal totalInvestment;
    private BigDecimal estimatedValue;
    private BigDecimal potentialProfit;
    private Long itemsFullyListed;
    private Long itemsPartiallyListed;
}