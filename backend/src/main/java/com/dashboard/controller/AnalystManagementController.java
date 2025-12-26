package com.dashboard.controller;

import com.dashboard.dto.request.AnalystRequest;
import com.dashboard.dto.request.AnalystUpdateRequest;
import com.dashboard.dto.response.AnalystResponse;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.service.AnalystManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/analysts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Analyst Management", description = "Admin endpoints for managing analyst accounts")
@CrossOrigin(origins = "*")
public class AnalystManagementController {

    private final AnalystManagementService analystManagementService;

    @GetMapping
    @Operation(summary = "Get all analysts", description = "Returns paginated list of all analyst accounts")
    public ResponseEntity<ApiResponse<Page<AnalystResponse>>> getAllAnalysts(
            @PageableDefault(size = 10) Pageable pageable) {
        log.info("GET /api/admin/analysts - Fetching all analysts");
        Page<AnalystResponse> analysts = analystManagementService.getAllAnalysts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Analysts retrieved successfully", analysts));
    }

    @GetMapping("/all")
    @Operation(summary = "Get all analysts without pagination")
    public ResponseEntity<ApiResponse<List<AnalystResponse>>> getAllAnalystsNoPagination() {
        log.info("GET /api/admin/analysts/all - Fetching all analysts (no pagination)");
        List<AnalystResponse> analysts = analystManagementService.getAllAnalysts();
        return ResponseEntity.ok(ApiResponse.success("Analysts retrieved successfully", analysts));
    }

    @GetMapping("/{analystId}")
    @Operation(summary = "Get analyst by ID", description = "Returns detailed information about a specific analyst")
    public ResponseEntity<ApiResponse<AnalystResponse>> getAnalystById(@PathVariable Long analystId) {
        log.info("GET /api/admin/analysts/{} - Fetching analyst details", analystId);
        AnalystResponse analyst = analystManagementService.getAnalystById(analystId);
        return ResponseEntity.ok(ApiResponse.success("Analyst retrieved successfully", analyst));
    }

    @PostMapping
    @Operation(summary = "Create new analyst", description = "Creates a new analyst account")
    public ResponseEntity<ApiResponse<AnalystResponse>> createAnalyst(
            @Valid @RequestBody AnalystRequest request) {
        log.info("POST /api/admin/analysts - Creating new analyst: {}", request.getEmail());
        AnalystResponse analyst = analystManagementService.createAnalyst(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Analyst created successfully", analyst));
    }

    @PutMapping("/{analystId}")
    @Operation(summary = "Update analyst", description = "Updates an existing analyst account")
    public ResponseEntity<ApiResponse<AnalystResponse>> updateAnalyst(
            @PathVariable Long analystId,
            @Valid @RequestBody AnalystUpdateRequest request) {
        log.info("PUT /api/admin/analysts/{} - Updating analyst", analystId);
        AnalystResponse analyst = analystManagementService.updateAnalyst(analystId, request);
        return ResponseEntity.ok(ApiResponse.success("Analyst updated successfully", analyst));
    }

    @DeleteMapping("/{analystId}")
    @Operation(summary = "Delete analyst", description = "Permanently deletes an analyst account")
    public ResponseEntity<ApiResponse<Void>> deleteAnalyst(@PathVariable Long analystId) {
        log.info("DELETE /api/admin/analysts/{} - Deleting analyst", analystId);
        analystManagementService.deleteAnalyst(analystId);
        return ResponseEntity.ok(ApiResponse.success("Analyst deleted successfully", null));
    }

    @PatchMapping("/{analystId}/toggle-status")
    @Operation(summary = "Toggle analyst status", description = "Activates or deactivates an analyst account")
    public ResponseEntity<ApiResponse<AnalystResponse>> toggleAnalystStatus(@PathVariable Long analystId) {
        log.info("PATCH /api/admin/analysts/{}/toggle-status - Toggling analyst status", analystId);
        AnalystResponse analyst = analystManagementService.toggleAnalystStatus(analystId);
        return ResponseEntity.ok(ApiResponse.success("Analyst status toggled successfully", analyst));
    }

    @GetMapping("/{analystId}/statistics")
    @Operation(summary = "Get analyst statistics", description = "Returns activity statistics for an analyst")
    public ResponseEntity<ApiResponse<AnalystResponse>> getAnalystStatistics(@PathVariable Long analystId) {
        log.info("GET /api/admin/analysts/{}/statistics - Fetching analyst statistics", analystId);
        AnalystResponse statistics = analystManagementService.getAnalystStatistics(analystId);
        return ResponseEntity.ok(ApiResponse.success("Analyst statistics retrieved successfully", statistics));
    }

    @GetMapping("/summary")
    @Operation(summary = "Get analysts summary", description = "Returns summary statistics for all analysts")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAnalystsSummary() {
        log.info("GET /api/admin/analysts/summary - Fetching analysts summary");

        List<AnalystResponse> analysts = analystManagementService.getAllAnalysts();

        Map<String, Object> summary = new HashMap<>();
        summary.put("totalAnalysts", analysts.size());
        summary.put("activeAnalysts", analysts.stream().filter(AnalystResponse::getIsActive).count());
        summary.put("inactiveAnalysts", analysts.stream().filter(a -> !a.getIsActive()).count());

        return ResponseEntity.ok(ApiResponse.success("Analysts summary retrieved successfully", summary));
    }
}