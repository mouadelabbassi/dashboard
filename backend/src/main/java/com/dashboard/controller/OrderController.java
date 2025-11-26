package com.dashboard.controller;

import com. dashboard.dto.request.OrderRequest;
import com.dashboard. dto.response.ApiResponse;
import com.dashboard.dto. response.OrderResponse;
import com.dashboard.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas. annotations.Parameter;
import io.swagger. v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data. domain.Page;
import org.springframework. data.domain.PageRequest;
import org.springframework.data. domain.Pageable;
import org. springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework. http.ResponseEntity;
import org.springframework.security.access. prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util. Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    @Operation(summary = "Create new order", description = "Creates a new order for the current user")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(
            @Valid @RequestBody OrderRequest request) {

        OrderResponse order = orderService.createOrder(request);
        return ResponseEntity. status(HttpStatus. CREATED)
                .body(ApiResponse.success("Order created successfully", order));
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Confirm order", description = "Confirms a pending order")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrder(
            @Parameter(description = "Order ID") @PathVariable Long id) {

        OrderResponse order = orderService.confirmOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order confirmed successfully", order));
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Cancel order", description = "Cancels an order")
    public ResponseEntity<ApiResponse<OrderResponse>> cancelOrder(
            @Parameter(description = "Order ID") @PathVariable Long id) {

        OrderResponse order = orderService.cancelOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order cancelled successfully", order));
    }

    @GetMapping("/my-orders")
    @Operation(summary = "Get my orders", description = "Returns all orders for the current user")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        List<OrderResponse> orders = orderService.getMyOrders();
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", orders));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get order by ID", description = "Returns a single order by its ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(
            @Parameter(description = "Order ID") @PathVariable Long id) {

        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", order));
    }

    @GetMapping("/by-number/{orderNumber}")
    @Operation(summary = "Get order by number", description = "Returns a single order by its order number")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderByNumber(
            @Parameter(description = "Order number") @PathVariable String orderNumber) {

        OrderResponse order = orderService.getOrderByNumber(orderNumber);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", order));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all orders (Admin)", description = "Returns paginated list of all orders")
    public ResponseEntity<ApiResponse<Page<OrderResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("asc")
                ? Sort. Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<OrderResponse> orders = orderService.getAllOrders(pageable);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", orders));
    }

    @GetMapping("/recent")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get recent orders (Admin)", description = "Returns recent orders")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getRecentOrders(
            @RequestParam(defaultValue = "10") int limit) {

        List<OrderResponse> orders = orderService. getRecentOrders(limit);
        return ResponseEntity.ok(ApiResponse.success("Recent orders retrieved successfully", orders));
    }

    @GetMapping("/stats/today")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    @Operation(summary = "Get today's order stats", description = "Returns today's order statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getTodayStats() {
        Long todayOrders = orderService. countTodayOrders();
        BigDecimal todayRevenue = orderService. getTodayRevenue();

        Map<String, Object> stats = Map.of(
                "ordersCount", todayOrders,
                "revenue", todayRevenue
        );

        return ResponseEntity. ok(ApiResponse. success("Stats retrieved successfully", stats));
    }
}