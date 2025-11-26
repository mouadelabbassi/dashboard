package com.dashboard.controller;

import com.dashboard.dto.request.OrderRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.OrderResponse;
import com.dashboard.service.OrderService;
import com.dashboard.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders", description = "Order management endpoints")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;
    private final UserService userService;

    @PostMapping
    @PreAuthorize("hasAuthority('BUYER')")
    @Operation(summary = "Create a new order", description = "Create a new order for the authenticated buyer")
    public ResponseEntity<ApiResponse<OrderResponse>> createOrder(@Valid @RequestBody OrderRequest request) {
        Long userId = userService.getCurrentUserProfile().getId();
        OrderResponse order = orderService.createOrder(userId, request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Order created successfully", order));
    }

    @GetMapping("/my-orders")
    @PreAuthorize("hasAuthority('BUYER')")
    @Operation(summary = "Get current user's orders", description = "Fetch all orders for the authenticated buyer")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getMyOrders() {
        Long userId = userService.getCurrentUserProfile().getId();
        List<OrderResponse> orders = orderService.getOrdersByUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Orders retrieved successfully", orders));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Get order by ID", description = "Fetch a specific order by ID")
    public ResponseEntity<ApiResponse<OrderResponse>> getOrderById(@PathVariable Long id) {
        OrderResponse order = orderService.getOrderById(id);
        return ResponseEntity.ok(ApiResponse.success("Order retrieved successfully", order));
    }

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ANALYST')")
    @Operation(summary = "Get all orders (Admin)", description = "Fetch all orders - Admin/Analyst only")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getAllOrders() {
        List<OrderResponse> orders = orderService.getAllOrders();
        return ResponseEntity.ok(ApiResponse.success("All orders retrieved successfully", orders));
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyAuthority('ADMIN', 'ANALYST')")
    @Operation(summary = "Confirm order (Admin)", description = "Confirm an order - Admin/Analyst only")
    public ResponseEntity<ApiResponse<OrderResponse>> confirmOrder(@PathVariable Long id) {
        OrderResponse order = orderService.confirmOrder(id);
        return ResponseEntity.ok(ApiResponse.success("Order confirmed successfully", order));
    }
}
