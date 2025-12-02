package com.dashboard.controller;

import com.dashboard.dto.request.ListFromStockRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.SellerProductRequestResponse;
import com.dashboard.dto.response.SellerStockResponse;
import com.dashboard.dto.response.StockDashboardResponse;
import com.dashboard.entity.SellerProductRequest;
import com.dashboard.service.SellerStockService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/stock")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
@Tag(name = "Seller Stock Management", description = "Endpoints for managing seller inventory/stock")
public class SellerStockController {

    private final SellerStockService stockService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get stock dashboard", description = "Returns stock statistics and metrics")
    public ResponseEntity<ApiResponse<StockDashboardResponse>> getStockDashboard() {
        StockDashboardResponse dashboard = stockService.getStockDashboard();
        return ResponseEntity.ok(ApiResponse.success("Stock dashboard retrieved", dashboard));
    }

    @GetMapping
    @Operation(summary = "Get all stock items", description = "Returns paginated list of all stock items")
    public ResponseEntity<ApiResponse<Page<SellerStockResponse>>> getMyStock(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SellerStockResponse> stock = stockService.getMyStock(pageable);
        return ResponseEntity.ok(ApiResponse.success("Stock retrieved", stock));
    }

    @GetMapping("/available")
    @Operation(summary = "Get available stock", description = "Returns stock items available for listing")
    public ResponseEntity<ApiResponse<List<SellerStockResponse>>> getAvailableStock() {
        List<SellerStockResponse> stock = stockService.getAvailableStock();
        return ResponseEntity.ok(ApiResponse.success("Available stock retrieved", stock));
    }

    @GetMapping("/{stockId}")
    @Operation(summary = "Get stock item details", description = "Returns details of a specific stock item")
    public ResponseEntity<ApiResponse<SellerStockResponse>> getStockById(@PathVariable Long stockId) {
        SellerStockResponse stock = stockService.getStockById(stockId);
        return ResponseEntity.ok(ApiResponse.success("Stock item retrieved", stock));
    }

    @PostMapping("/list")
    @Operation(summary = "List product from stock", description = "Creates a product listing from existing stock")
    public ResponseEntity<ApiResponse<String>> listFromStock(
            @Valid @RequestBody ListFromStockRequest request) {
        SellerProductRequest productRequest = stockService.listFromStock(request);
        return ResponseEntity.ok(ApiResponse.success(
                "Product submitted for approval from stock",
                "Request ID: " + productRequest.getId()));
    }

    @GetMapping("/search")
    @Operation(summary = "Search stock items", description = "Search stock by product name or ASIN")
    public ResponseEntity<ApiResponse<Page<SellerStockResponse>>> searchStock(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<SellerStockResponse> results = stockService.searchStock(query, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search results", results));
    }
}