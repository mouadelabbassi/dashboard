package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time. LocalDate;
import java.util. List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardResponse {
    private Long sellerId;
    private String storeName;
    private Boolean isVerifiedSeller;

    private Long totalProducts;
    private Long approvedProducts;
    private Long pendingProducts;
    private Long pendingRequests;
    private Long totalSalesCount;
    private Long totalUnitsSold;

    private BigDecimal totalRevenue;
    private BigDecimal monthlyRevenue;
    private BigDecimal weeklyRevenue;
    private BigDecimal todayRevenue;

    private List<DailyRevenuePoint> revenueTrend;
    private List<TopProductRevenue> topProducts;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyRevenuePoint {
        private LocalDate date;
        private BigDecimal revenue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class TopProductRevenue {
        private String asin;
        private String productName;
        private Long unitsSold;
        private BigDecimal revenue;
    }
}