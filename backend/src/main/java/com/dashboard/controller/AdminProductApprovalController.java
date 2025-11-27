package com.dashboard.controller;

import com.dashboard.dto.request.ProductApprovalRequest;
import com.dashboard.dto.response.*;
import com.dashboard.entity. SellerProductRequest;
import com. dashboard.service.AdminProductApprovalService;
import io. swagger.v3. oas.annotations. Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org. springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data. web.PageableDefault;
import org. springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org. springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/product-approvals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Admin Product Approvals", description = "Admin endpoints for managing seller product submissions")
public class AdminProductApprovalController {

    private final AdminProductApprovalService approvalService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get admin dashboard", description = "Returns admin dashboard with platform stats")
    public ResponseEntity<ApiResponse<AdminDashboardResponse>> getAdminDashboard() {
        AdminDashboardResponse dashboard = approvalService. getAdminDashboard();
        return ResponseEntity.ok(ApiResponse.success("Dashboard retrieved", dashboard));
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending product requests", description = "Returns all pending product submissions")
    public ResponseEntity<ApiResponse<Page<PendingProductResponse>>> getPendingRequests(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<PendingProductResponse> requests = approvalService.getPendingProductRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", requests));
    }

    @GetMapping("/pending/{requestId}")
    @Operation(summary = "Get pending request details", description = "Returns details of a pending product submission")
    public ResponseEntity<ApiResponse<PendingProductResponse>> getPendingRequestDetails(@PathVariable Long requestId) {
        PendingProductResponse request = approvalService.getProductRequestDetails(requestId);
        return ResponseEntity. ok(ApiResponse. success("Request details retrieved", request));
    }

    @PostMapping("/{requestId}/approve")
    @Operation(summary = "Approve product", description = "Approves a product submission and creates the product")
    public ResponseEntity<ApiResponse<SellerProductRequestResponse>> approveProduct(
            @PathVariable Long requestId,
            @Valid @RequestBody(required = false) ProductApprovalRequest request) {
        if (request == null) {
            request = new ProductApprovalRequest();
        }
        SellerProductRequestResponse response = approvalService. approveProduct(requestId, request);
        return ResponseEntity. ok(ApiResponse. success("Product approved successfully", response));
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject product", description = "Rejects a product submission")
    public ResponseEntity<ApiResponse<SellerProductRequestResponse>> rejectProduct(
            @PathVariable Long requestId,
            @Valid @RequestBody ProductApprovalRequest request) {
        SellerProductRequestResponse response = approvalService.rejectProduct(requestId, request);
        return ResponseEntity.ok(ApiResponse.success("Product rejected", response));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all product requests", description = "Returns all product submissions (history)")
    public ResponseEntity<ApiResponse<Page<SellerProductRequestResponse>>> getAllRequests(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<SellerProductRequestResponse> requests = approvalService.getAllProductRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success("All requests retrieved", requests));
    }

    @GetMapping("/status/{status}")
    @Operation(summary = "Get requests by status", description = "Returns product submissions filtered by status")
    public ResponseEntity<ApiResponse<Page<SellerProductRequestResponse>>> getRequestsByStatus(
            @PathVariable String status,
            @PageableDefault(size = 10) Pageable pageable) {
        SellerProductRequest. RequestStatus requestStatus =
                SellerProductRequest.RequestStatus.valueOf(status.toUpperCase());
        Page<SellerProductRequestResponse> requests =
                approvalService.getProductRequestsByStatus(requestStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success("Requests retrieved", requests));
    }
}