package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.DashboardResponse;
import com.dashboard.dto.response.DashboardStatsResponse;
import com.dashboard.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Dashboard analytics endpoints")
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard stats", description = "Returns main dashboard statistics for cards")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getDashboardStats() {
        DashboardStatsResponse stats = dashboardService.getDashboardStats();
        return ResponseEntity.ok(ApiResponse.success("Dashboard stats retrieved successfully", stats));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get dashboard summary", description = "Returns main KPIs and dashboard summary")
    public ResponseEntity<ApiResponse<DashboardResponse>> getDashboardSummary() {
        DashboardResponse summary = dashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Dashboard summary retrieved successfully", summary));
    }

    @GetMapping("/category-distribution")
    @Operation(summary = "Get category distribution", description = "Returns number of products per category")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCategoryDistribution() {
        Map<String, Long> distribution = dashboardService.getCategoryDistribution();
        return ResponseEntity.ok(ApiResponse.success("Category distribution retrieved successfully", distribution));
    }

    @GetMapping("/price-distribution")
    @Operation(summary = "Get price distribution", description = "Returns products grouped by price ranges")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getPriceDistribution() {
        Map<String, Long> distribution = dashboardService.getPriceDistribution();
        return ResponseEntity.ok(ApiResponse.success("Price distribution retrieved successfully", distribution));
    }

    @GetMapping("/rating-distribution")
    @Operation(summary = "Get rating distribution", description = "Returns products grouped by rating")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getRatingDistribution() {
        Map<String, Long> distribution = dashboardService.getRatingDistribution();
        return ResponseEntity.ok(ApiResponse.success("Rating distribution retrieved successfully", distribution));
    }

    @GetMapping("/trends")
    @Operation(summary = "Get sales trends", description = "Returns sales trends and analytics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTrends() {
        // This can be expanded with more complex trend analysis
        Map<String, Object> trends = Map.of(
                "message", "Trends analysis coming soon",
                "status", "placeholder"
        );
        return ResponseEntity.ok(ApiResponse.success("Trends retrieved successfully", trends));
    }
}