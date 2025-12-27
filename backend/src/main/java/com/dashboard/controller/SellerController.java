package com.dashboard.controller;

import com.dashboard.dto. request.SellerProductSubmissionRequest;
import com.dashboard.dto.request.SellerProfileUpdateRequest;
import com.dashboard.dto.request.StockUpdateRequest;
import com.dashboard.dto. response.*;
import com.dashboard.entity.Product;
import com. dashboard.service.SellerService;
import com.dashboard.service.StockManagementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain. Pageable;
import org.springframework. data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org. springframework.http.ResponseEntity;
import org.springframework.security. access.prepost. PreAuthorize;
import org.springframework.web.bind. annotation.*;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SELLER')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Seller", description = "Seller management endpoints")
public class SellerController {

    private final SellerService sellerService;
    private StockManagementService stockManagementService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get seller dashboard", description = "Returns seller's dashboard with revenue and product stats")
    public ResponseEntity<ApiResponse<SellerDashboardResponse>> getDashboard() {
        SellerDashboardResponse dashboard = sellerService. getDashboard();
        return ResponseEntity. ok(ApiResponse. success("Dashboard retrieved successfully", dashboard));
    }


    @GetMapping("/profile")
    @Operation(summary = "Get seller profile", description = "Returns current seller's profile")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getProfile() {
        SellerProfileResponse profile = sellerService.getMyProfile();
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update seller profile", description = "Updates current seller's profile")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> updateProfile(
            @Valid @RequestBody SellerProfileUpdateRequest request) {
        SellerProfileResponse profile = sellerService.updateMyProfile(request);
        return ResponseEntity. ok(ApiResponse. success("Profile updated successfully", profile));
    }


    @PostMapping("/products/submit")
    @Operation(summary = "Submit product for approval", description = "Submits a new product for admin approval")
    public ResponseEntity<ApiResponse<SellerProductRequestResponse>> submitProduct(
            @Valid @RequestBody SellerProductSubmissionRequest request) {
        SellerProductRequestResponse response = sellerService.submitProductForApproval(request);
        return ResponseEntity.status(HttpStatus. CREATED)
                .body(ApiResponse.success("Product submitted for approval", response));
    }

    @GetMapping("/products/requests")
    @Operation(summary = "Get my product requests", description = "Returns all product submission requests")
    public ResponseEntity<ApiResponse<Page<SellerProductRequestResponse>>> getMyProductRequests(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<SellerProductRequestResponse> requests = sellerService. getMyProductRequests(pageable);
        return ResponseEntity. ok(ApiResponse. success("Product requests retrieved", requests));
    }

    @GetMapping("/products/requests/{requestId}")
    @Operation(summary = "Get product request details", description = "Returns details of a specific product request")
    public ResponseEntity<ApiResponse<SellerProductRequestResponse>> getProductRequest(@PathVariable Long requestId) {
        SellerProductRequestResponse request = sellerService.getProductRequestById(requestId);
        return ResponseEntity. ok(ApiResponse. success("Product request retrieved", request));
    }


    @GetMapping("/products")
    @Operation(summary = "Get my products", description = "Returns all products owned by the seller")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getMyProducts(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ProductResponse> products = sellerService.getMyProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @GetMapping("/products/status/{status}")
    @Operation(summary = "Get my products by status", description = "Returns products filtered by approval status")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getMyProductsByStatus(
            @PathVariable String status,
            @PageableDefault(size = 10) Pageable pageable) {
        Product.ApprovalStatus approvalStatus = Product.ApprovalStatus.valueOf(status. toUpperCase());
        Page<ProductResponse> products = sellerService.getMyProductsByStatus(approvalStatus, pageable);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved", products));
    }

    @GetMapping("/products/{asin}")
    @Operation(summary = "Get my product by ASIN", description = "Returns a specific product owned by the seller")
    public ResponseEntity<ApiResponse<ProductResponse>> getMyProduct(@PathVariable String asin) {
        ProductResponse product = sellerService.getMyProductByAsin(asin);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved", product));
    }

    @DeleteMapping("/products/{asin}")
    @Operation(summary = "Delete my product", description = "Deletes a product owned by the seller")
    public ResponseEntity<ApiResponse<String>> deleteMyProduct(@PathVariable String asin) {
        sellerService.deleteMyProduct(asin);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", asin));
    }

    @PutMapping("/products/{asin}")
    @Operation(summary = "Update my product", description = "Updates a product owned by the seller")
    public ResponseEntity<ApiResponse<ProductResponse>> updateMyProduct(
            @PathVariable String asin,
            @Valid @RequestBody SellerProductSubmissionRequest request) {
        ProductResponse product = sellerService.updateMyProduct(asin, request);
        return ResponseEntity. ok(ApiResponse. success("Product updated", product));
    }


    @GetMapping("/orders")
    @Operation(summary = "Get my sold orders", description = "Returns orders containing seller's products")
    public ResponseEntity<ApiResponse<Page<SellerOrderResponse>>> getMySoldOrders(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<SellerOrderResponse> orders = sellerService. getMySoldOrders(pageable);
        return ResponseEntity. ok(ApiResponse. success("Orders retrieved", orders));
    }


    @GetMapping("/reviews")
    @Operation(summary = "Get my product reviews", description = "Returns all reviews for seller's products")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getMyProductReviews(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<ReviewResponse> reviews = sellerService.getMyProductReviews(pageable);
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved", reviews));
    }

    @GetMapping("/reviews/summary")
    @Operation(summary = "Get review summary", description = "Returns summary of all reviews for seller's products")
    public ResponseEntity<ApiResponse<SellerReviewSummary>> getReviewSummary() {
        SellerReviewSummary summary = sellerService. getReviewSummary();
        return ResponseEntity.ok(ApiResponse.success("Review summary retrieved", summary));
    }

    @PostMapping("/products/{asin}/request-stock")
    @Operation(summary = "Request stock update", description = "Request to add more stock to a product")
    public ResponseEntity<ApiResponse<com.dashboard.entity.StockUpdateRequest>> requestStockUpdate(
            @PathVariable String asin,
            @Valid @RequestBody StockUpdateRequest request) {
        com.dashboard.entity.StockUpdateRequest stockRequest = stockManagementService.requestStockUpdate(
                asin, request.getQuantity(), request.getReason());
        return ResponseEntity.ok(ApiResponse.success("Stock update request submitted", stockRequest));
    }

    @GetMapping("/stock-requests")
    @Operation(summary = "Get my stock requests", description = "Returns all stock update requests")
    public ResponseEntity<ApiResponse<Page<com.dashboard.entity.StockUpdateRequest>>> getMyStockRequests(
            @PageableDefault(size = 10) Pageable pageable) {
        Page<com.dashboard.entity.StockUpdateRequest> requests = stockManagementService.getMyStockRequests(pageable);
        return ResponseEntity.ok(ApiResponse.success("Stock requests retrieved", requests));
    }
}