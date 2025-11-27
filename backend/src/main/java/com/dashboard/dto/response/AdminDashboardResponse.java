package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok. Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardResponse {
    private Long totalProducts;
    private Long pendingApprovals;
    private Long totalSellers;
    private Long totalBuyers;
    private BigDecimal totalPlatformRevenue;
    private BigDecimal totalPlatformFees;
    private BigDecimal todayRevenue;
    private Long todayOrders;
}