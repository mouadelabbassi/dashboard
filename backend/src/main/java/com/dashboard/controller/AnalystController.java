package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.service.AnalystService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/analyst")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ANALYST', 'ADMIN')")
@Tag(name = "Analyst", description = "Analytics and reporting endpoints")
public class AnalystController {

    private final AnalystService analystService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get dashboard data", description = "Returns comprehensive dashboard data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDashboard() {
        Map<String, Object> dashboard = analystService.getDashboardData();
        return ResponseEntity.ok(ApiResponse.success("Dashboard data retrieved", dashboard));
    }

    @GetMapping("/kpis")
    @Operation(summary = "Get KPIs", description = "Returns key performance indicators")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getKPIs() {
        Map<String, Object> kpis = analystService.getKPIs();
        return ResponseEntity.ok(ApiResponse.success("KPIs retrieved", kpis));
    }


    @GetMapping("/reports/advanced")
    @Operation(summary = "Get advanced report data", description = "Returns comprehensive data for advanced PDF reports including top sellers, categories, and revenue analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAdvancedReportData() {
        log.info("Fetching advanced report data for PDF export");
        Map<String, Object> reportData = analystService.getAdvancedReportData();
        return ResponseEntity.ok(ApiResponse.success("Advanced report data retrieved", reportData));
    }

    @GetMapping("/reports/platform-revenue")
    @Operation(summary = "Get platform revenue overview", description = "Returns detailed platform revenue breakdown")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformRevenueOverview() {
        Map<String, Object> revenue = analystService.getPlatformRevenueOverview();
        return ResponseEntity.ok(ApiResponse.success("Platform revenue overview retrieved", revenue));
    }

    @GetMapping("/reports/top3-sellers")
    @Operation(summary = "Get top 3 best sellers", description = "Returns the top 3 sellers by revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTop3BestSellers() {
        List<Map<String, Object>> sellers = analystService.getTop3BestSellers();
        return ResponseEntity.ok(ApiResponse.success("Top 3 sellers retrieved", sellers));
    }

    @GetMapping("/reports/top3-categories")
    @Operation(summary = "Get top 3 categories by revenue", description = "Returns the top 3 categories by revenue")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTop3CategoriesByRevenue() {
        List<Map<String, Object>> categories = analystService.getTop3CategoriesByRevenue();
        return ResponseEntity.ok(ApiResponse.success("Top 3 categories retrieved", categories));
    }

    @GetMapping("/reports/most-sold-products")
    @Operation(summary = "Get most sold products", description = "Returns the most sold products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMostSoldProducts(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> products = analystService.getMostSoldProducts(limit);
        return ResponseEntity.ok(ApiResponse.success("Most sold products retrieved", products));
    }

    @GetMapping("/reports/monthly-trend")
    @Operation(summary = "Get monthly revenue trend", description = "Returns monthly revenue trend for the last 12 months")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getMonthlyRevenueTrend() {
        List<Map<String, Object>> trend = analystService.getMonthlyRevenueTrend();
        return ResponseEntity.ok(ApiResponse.success("Monthly revenue trend retrieved", trend));
    }

    @GetMapping("/reports/category-distribution")
    @Operation(summary = "Get category revenue distribution", description = "Returns revenue distribution by category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryRevenueDistribution() {
        List<Map<String, Object>> distribution = analystService.getCategoryRevenueDistribution();
        return ResponseEntity.ok(ApiResponse.success("Category revenue distribution retrieved", distribution));
    }

    @GetMapping("/reports/sales-performance")
    @Operation(summary = "Get sales performance metrics", description = "Returns sales performance metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesPerformanceMetrics() {
        Map<String, Object> metrics = analystService.getSalesPerformanceMetrics();
        return ResponseEntity.ok(ApiResponse.success("Sales performance metrics retrieved", metrics));
    }

    @GetMapping("/reports/order-status-distribution")
    @Operation(summary = "Get order status distribution", description = "Returns order count by status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getOrderStatusDistribution() {
        Map<String, Object> distribution = analystService.getOrderStatusDistribution();
        return ResponseEntity.ok(ApiResponse.success("Order status distribution retrieved", distribution));
    }

    @GetMapping("/reports/weekly-trend")
    @Operation(summary = "Get weekly sales trend", description = "Returns sales trend for the last 7 days")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getWeeklySalesTrend() {
        List<Map<String, Object>> trend = analystService.getWeeklySalesTrend();
        return ResponseEntity.ok(ApiResponse.success("Weekly sales trend retrieved", trend));
    }


    @GetMapping("/sales/overview")
    @Operation(summary = "Get sales overview", description = "Returns sales overview for a date range")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesOverview(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> overview = analystService.getSalesOverview(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Sales overview retrieved", overview));
    }

    @GetMapping("/sales/trends")
    @Operation(summary = "Get sales trends", description = "Returns sales trends over time")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSalesTrends(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(defaultValue = "30") int days) {
        List<Map<String, Object>> trends = analystService.getSalesTrends(period, days);
        return ResponseEntity.ok(ApiResponse.success("Sales trends retrieved", trends));
    }

    @GetMapping("/sales/by-category")
    @Operation(summary = "Get sales by category", description = "Returns sales breakdown by category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSalesByCategory() {
        List<Map<String, Object>> sales = analystService.getSalesByCategory();
        return ResponseEntity.ok(ApiResponse.success("Sales by category retrieved", sales));
    }

    @GetMapping("/sales/top-products")
    @Operation(summary = "Get top selling products", description = "Returns top selling products")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopSellingProducts(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> products = analystService.getTopSellingProducts(limit);
        return ResponseEntity.ok(ApiResponse.success("Top selling products retrieved", products));
    }

    @GetMapping("/sales/growth")
    @Operation(summary = "Get sales growth", description = "Returns sales growth metrics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSalesGrowth() {
        Map<String, Object> growth = analystService.getSalesGrowth();
        return ResponseEntity.ok(ApiResponse.success("Sales growth retrieved", growth));
    }

    @GetMapping("/sales/peak-times")
    @Operation(summary = "Get peak sales times", description = "Returns peak sales times analysis")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPeakSalesTimes() {
        List<Map<String, Object>> peakTimes = analystService.getPeakSalesTimes();
        return ResponseEntity.ok(ApiResponse.success("Peak sales times retrieved", peakTimes));
    }


    @GetMapping("/products/overview")
    @Operation(summary = "Get products overview", description = "Returns products analytics overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getProductsOverview() {
        Map<String, Object> overview = analystService.getProductsOverview();
        return ResponseEntity.ok(ApiResponse.success("Products overview retrieved", overview));
    }

    @GetMapping("/products/performance")
    @Operation(summary = "Get product performance", description = "Returns product performance metrics")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getProductPerformance(
            @RequestParam(defaultValue = "20") int limit) {
        List<Map<String, Object>> performance = analystService.getProductPerformance(limit);
        return ResponseEntity.ok(ApiResponse.success("Product performance retrieved", performance));
    }

    @GetMapping("/products/price-distribution")
    @Operation(summary = "Get price distribution", description = "Returns product price distribution")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getPriceDistribution() {
        Map<String, Long> distribution = analystService.getPriceDistribution();
        return ResponseEntity.ok(ApiResponse.success("Price distribution retrieved", distribution));
    }

    @GetMapping("/products/rating-distribution")
    @Operation(summary = "Get rating distribution", description = "Returns product rating distribution")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getRatingDistribution() {
        Map<String, Long> distribution = analystService.getRatingDistribution();
        return ResponseEntity.ok(ApiResponse.success("Rating distribution retrieved", distribution));
    }

    @GetMapping("/products/low-stock")
    @Operation(summary = "Get low stock products", description = "Returns products with low stock")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int threshold) {
        List<Map<String, Object>> products = analystService.getLowStockProducts(threshold);
        return ResponseEntity.ok(ApiResponse.success("Low stock products retrieved", products));
    }

    @GetMapping("/products/bestseller-trends")
    @Operation(summary = "Get bestseller trends", description = "Returns bestseller trends")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getBestsellerTrends() {
        List<Map<String, Object>> trends = analystService.getBestsellerTrends();
        return ResponseEntity.ok(ApiResponse.success("Bestseller trends retrieved", trends));
    }


    @GetMapping("/sellers/overview")
    @Operation(summary = "Get sellers overview", description = "Returns sellers analytics overview")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSellersOverview() {
        Map<String, Object> overview = analystService.getSellersOverview();
        return ResponseEntity.ok(ApiResponse.success("Sellers overview retrieved", overview));
    }

    @GetMapping("/sellers/ranking")
    @Operation(summary = "Get sellers ranking", description = "Returns sellers ranked by performance")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSellersRanking(
            @RequestParam(defaultValue = "10") int limit) {
        List<Map<String, Object>> ranking = analystService.getSellersRanking(limit);
        return ResponseEntity.ok(ApiResponse.success("Sellers ranking retrieved", ranking));
    }

    @GetMapping("/sellers/growth")
    @Operation(summary = "Get seller growth", description = "Returns seller growth over time")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getSellerGrowth() {
        List<Map<String, Object>> growth = analystService.getSellerGrowth();
        return ResponseEntity.ok(ApiResponse.success("Seller growth retrieved", growth));
    }

    @GetMapping("/sellers/platform-comparison")
    @Operation(summary = "Get platform vs sellers comparison", description = "Compares platform vs seller performance")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPlatformComparison() {
        Map<String, Object> comparison = analystService.getPlatformVsSellersComparison();
        return ResponseEntity.ok(ApiResponse.success("Platform comparison retrieved", comparison));
    }

    @GetMapping("/sellers/{sellerId}/details")
    @Operation(summary = "Get seller details", description = "Returns detailed seller information")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSellerDetails(@PathVariable Long sellerId) {
        Map<String, Object> details = analystService.getSellerDetails(sellerId);
        return ResponseEntity.ok(ApiResponse.success("Seller details retrieved", details));
    }


    @GetMapping("/categories/overview")
    @Operation(summary = "Get categories overview", description = "Returns category analytics summary")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoriesOverview() {
        List<Map<String, Object>> overview = analystService.getCategoriesOverview();
        return ResponseEntity.ok(ApiResponse.success("Categories overview retrieved", overview));
    }

    @GetMapping("/categories/{categoryId}/metrics")
    @Operation(summary = "Get category metrics", description = "Returns detailed metrics for a specific category")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCategoryMetrics(@PathVariable Long categoryId) {
        Map<String, Object> metrics = analystService.getCategoryMetrics(categoryId);
        return ResponseEntity.ok(ApiResponse.success("Category metrics retrieved", metrics));
    }

    @GetMapping("/categories/comparison")
    @Operation(summary = "Get category comparison", description = "Returns comparative analysis of categories")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryComparison() {
        List<Map<String, Object>> comparison = analystService.getCategoryComparison();
        return ResponseEntity.ok(ApiResponse.success("Category comparison retrieved", comparison));
    }

    @GetMapping("/categories/revenue-contribution")
    @Operation(summary = "Get category revenue contribution", description = "Returns revenue share by category")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getCategoryRevenueContribution() {
        List<Map<String, Object>> contribution = analystService.getCategoryRevenueContribution();
        return ResponseEntity.ok(ApiResponse.success("Revenue contribution retrieved", contribution));
    }



    @GetMapping("/reports/summary")
    @Operation(summary = "Get report summary", description = "Returns summary data for reports")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getReportSummary(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Map<String, Object> summary = analystService.getReportSummary(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Report summary retrieved", summary));
    }

    @GetMapping("/reports/export/sales")
    @Operation(summary = "Export sales data", description = "Returns sales data for CSV/Excel export")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> exportSalesData(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Map<String, Object>> data = analystService.exportSalesData(startDate, endDate);
        return ResponseEntity.ok(ApiResponse.success("Sales data exported", data));
    }

    @GetMapping("/reports/export/products")
    @Operation(summary = "Export products data", description = "Returns products data for CSV/Excel export")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> exportProductsData() {
        List<Map<String, Object>> data = analystService.exportProductsData();
        return ResponseEntity.ok(ApiResponse.success("Products data exported", data));
    }

    @GetMapping("/reports/export/sellers")
    @Operation(summary = "Export sellers data", description = "Returns sellers data for CSV/Excel export")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> exportSellersData() {
        List<Map<String, Object>> data = analystService.exportSellersData();
        return ResponseEntity.ok(ApiResponse.success("Sellers data exported", data));
    }
}