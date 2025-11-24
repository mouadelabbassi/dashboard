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
public class CategoryStatsResponse {
    private String categoryName;
    private Long productCount;
    private BigDecimal totalRevenue;
    private BigDecimal avgPrice;
    private BigDecimal avgRating;
}