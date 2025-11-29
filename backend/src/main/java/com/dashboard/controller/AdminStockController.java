package com.dashboard.controller;

import com.dashboard.dto.request.ProductApprovalRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.StockUpdateRequest;
import com.dashboard.service.StockManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/stock-requests")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Stock Management", description = "Manage seller stock update requests")
public class AdminStockController {

    private final StockManagementService stockManagementService;

    @GetMapping("/pending")
    @Operation(summary = "Get pending stock requests")
    public ResponseEntity<ApiResponse<Page<StockUpdateRequest>>> getPendingRequests(
            @PageableDefault(size = 20) Pageable pageable) {
        Page<StockUpdateRequest> requests = stockManagementService.getPendingStockRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", requests));
    }

    @PostMapping("/{requestId}/approve")
    @Operation(summary = "Approve stock request")
    public ResponseEntity<ApiResponse<String>> approveStockRequest(
            @PathVariable Long requestId,
            @RequestBody(required = false) ProductApprovalRequest approval) {
        stockManagementService.approveStockRequest(requestId,
                approval != null ? approval.getAdminNotes() : null);
        return ResponseEntity.ok(ApiResponse.success("Stock request approved", "Success"));
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject stock request")
    public ResponseEntity<ApiResponse<String>> rejectStockRequest(
            @PathVariable Long requestId,
            @RequestBody ProductApprovalRequest approval) {
        stockManagementService.rejectStockRequest(requestId,
                approval.getRejectionReason(),
                approval.getAdminNotes());
        return ResponseEntity.ok(ApiResponse.success("Stock request rejected", "Success"));
    }

    @GetMapping("/count")
    @Operation(summary = "Get pending count")
    public ResponseEntity<ApiResponse<Long>> getPendingCount() {
        Long count = stockManagementService.getPendingStockRequestCount();
        return ResponseEntity.ok(ApiResponse.success("Count retrieved", count));
    }
}