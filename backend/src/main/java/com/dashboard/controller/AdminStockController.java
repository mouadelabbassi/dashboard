package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import com.dashboard.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/admin/stock")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin Stock Management", description = "Admin endpoints for managing product stock")
public class AdminStockController {

    private final ProductRepository productRepository;
    private final NotificationService notificationService;

    @GetMapping("/dashboard")
    @Operation(summary = "Get stock dashboard", description = "Returns stock overview statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getStockDashboard() {
        Map<String, Object> dashboard = new HashMap<>();

        long totalProducts = productRepository.count();
        dashboard.put("totalProducts", totalProducts);

        long mouadVisionProducts = productRepository.countBySellerIsNull();
        dashboard.put("mouadVisionProducts", mouadVisionProducts);

        long sellerProducts = totalProducts - mouadVisionProducts;
        dashboard.put("sellerProducts", sellerProducts);

        List<Product> lowStockProducts = productRepository.findByStockQuantityLessThanOrderByStockQuantityAsc(10);
        dashboard.put("lowStockCount", lowStockProducts.size());

        List<Product> outOfStockProducts = productRepository.findByStockQuantityEquals(0);
        dashboard.put("outOfStockCount", outOfStockProducts.size());

        long healthyStockCount = totalProducts - lowStockProducts.size();
        dashboard.put("healthyStockCount", healthyStockCount);

        Long totalUnits = productRepository.sumAllStockQuantity();
        dashboard.put("totalUnitsInStock", totalUnits != null ? totalUnits : 0);

        return ResponseEntity.ok(ApiResponse.success("Stock dashboard retrieved", dashboard));
    }

    @GetMapping("/products")
    @Operation(summary = "Get all products with stock info", description = "Returns paginated products for stock management")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getAllProductsStock(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "asin") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String filter,
            @RequestParam(required = false) String owner) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> products;

        if ("mouadvision".equalsIgnoreCase(owner)) {
            products = getFilteredMouadVisionProducts(filter, pageable);
        } else if ("sellers".equalsIgnoreCase(owner)) {
            products = getFilteredSellerProducts(filter, pageable);
        } else {
            products = getFilteredAllProducts(filter, pageable);
        }

        Page<Map<String, Object>> result = products.map(this::mapProductToStockInfo);

        return ResponseEntity.ok(ApiResponse.success("Products retrieved", result));
    }

    private Page<Product> getFilteredAllProducts(String filter, Pageable pageable) {
        if ("low".equalsIgnoreCase(filter)) {
            return productRepository.findByStockQuantityLessThan(10, pageable);
        } else if ("out".equalsIgnoreCase(filter)) {
            return productRepository.findByStockQuantityEqualsPageable(0, pageable);
        } else if ("healthy".equalsIgnoreCase(filter)) {
            return productRepository.findByStockQuantityGreaterThanEqual(10, pageable);
        } else {
            return productRepository.findAll(pageable);
        }
    }

    private Page<Product> getFilteredMouadVisionProducts(String filter, Pageable pageable) {
        if ("low".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNullAndStockQuantityLessThan(10, pageable);
        } else if ("out".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNullAndStockQuantityEquals(0, pageable);
        } else if ("healthy".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNullAndStockQuantityGreaterThanEqual(10, pageable);
        } else {
            return productRepository.findBySellerIsNull(pageable);
        }
    }

    private Page<Product> getFilteredSellerProducts(String filter, Pageable pageable) {
        if ("low".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNotNullAndStockQuantityLessThan(10, pageable);
        } else if ("out".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNotNullAndStockQuantityEquals(0, pageable);
        } else if ("healthy".equalsIgnoreCase(filter)) {
            return productRepository.findBySellerIsNotNullAndStockQuantityGreaterThanEqual(10, pageable);
        } else {
            return productRepository.findBySellerIsNotNull(pageable);
        }
    }

    @PutMapping("/products/{asin}")
    @Operation(summary = "Update product stock (MouadVision only)", description = "Updates stock for MouadVision products only")
    public ResponseEntity<ApiResponse<Map<String, Object>>> updateProductStock(
            @PathVariable String asin,
            @Valid @RequestBody StockUpdateAdminRequest request) {

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() != null) {
            throw new BadRequestException("Cannot update stock for seller products. Please notify the seller instead.");
        }

        int oldQuantity = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        product.setStockQuantity(request.getQuantity());
        product = productRepository.save(product);

        log.info("Admin updated MouadVision product stock {}: {} -> {}", asin, oldQuantity, request.getQuantity());

        Map<String, Object> result = mapProductToStockInfo(product);
        result.put("previousQuantity", oldQuantity);
        result.put("quantityChange", request.getQuantity() - oldQuantity);

        return ResponseEntity.ok(ApiResponse.success("Stock updated successfully", result));
    }

    @PutMapping("/products/{asin}/add")
    @Operation(summary = "Add stock (MouadVision only)", description = "Adds stock for MouadVision products only")
    public ResponseEntity<ApiResponse<Map<String, Object>>> addProductStock(
            @PathVariable String asin,
            @RequestParam int quantity) {

        if (quantity <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Quantity must be positive"));
        }

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() != null) {
            throw new BadRequestException("Cannot update stock for seller products. Please notify the seller instead.");
        }

        int oldQuantity = product.getStockQuantity() != null ?  product.getStockQuantity() : 0;
        int newQuantity = oldQuantity + quantity;
        product.setStockQuantity(newQuantity);
        product = productRepository.save(product);

        log.info("Admin added {} units to MouadVision product {}: {} -> {}", quantity, asin, oldQuantity, newQuantity);

        Map<String, Object> result = mapProductToStockInfo(product);
        result.put("previousQuantity", oldQuantity);
        result.put("addedQuantity", quantity);

        return ResponseEntity.ok(ApiResponse.success("Stock added successfully", result));
    }

    @PostMapping("/products/{asin}/notify-seller")
    @Operation(summary = "Notify seller about stock", description = "Sends notification to seller about low/out of stock")
    public ResponseEntity<ApiResponse<String>> notifySellerAboutStock(
            @PathVariable String asin,
            @RequestBody(required = false) NotifySellerRequest request) {

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() == null) {
            throw new BadRequestException("This is a MouadVision product. No seller to notify.");
        }

        User seller = product.getSeller();
        String message = request != null && request.getMessage() != null
                ? request.getMessage()
                : null;

        notificationService.notifySellerLowStock(seller, product, message);

        log.info("Admin notified seller {} about stock for product {}", seller.getEmail(), asin);

        return ResponseEntity.ok(ApiResponse.success(
                "Notification sent to " + seller.getFullName(),
                "Seller has been notified about the stock level"));
    }

    @PostMapping("/notify-low-stock-sellers")
    @Operation(summary = "Notify all sellers with low stock", description = "Sends notifications to all sellers with low stock products")
    public ResponseEntity<ApiResponse<Map<String, Object>>> notifyAllLowStockSellers() {
        List<Product> lowStockProducts = productRepository.findBySellerIsNotNullAndStockQuantityLessThan(15);

        log.info("Found {} low stock products from sellers", lowStockProducts.size());

        if (lowStockProducts.isEmpty()) {
            Map<String, Object> result = new HashMap<>();
            result.put("sellersNotified", 0);
            result.put("productsAffected", 0);
            result.put("message", "No sellers have low stock products");
            return ResponseEntity.ok(ApiResponse.success("No low stock products found", result));
        }

        Map<User, List<Product>> sellerProducts = new HashMap<>();
        for (Product product : lowStockProducts) {
            if (product.getSeller() != null) {
                sellerProducts.computeIfAbsent(product.getSeller(), k -> new ArrayList<>()).add(product);
            }
        }

        int notificationsSent = 0;
        for (Map.Entry<User, List<Product>> entry : sellerProducts.entrySet()) {
            try {
                notificationService.notifySellerMultipleLowStock(entry.getKey(), entry.getValue());
                notificationsSent++;
                log.info("Sent low stock notification to seller: {}", entry.getKey().getEmail());
            } catch (Exception e) {
                log.error("Failed to notify seller {}: {}", entry.getKey().getEmail(), e.getMessage());
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("sellersNotified", notificationsSent);
        result.put("productsAffected", lowStockProducts.size());

        log.info("Admin sent low stock notifications to {} sellers for {} products", notificationsSent, lowStockProducts.size());

        return ResponseEntity.ok(ApiResponse.success("Notifications sent", result));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products for stock management", description = "Search products by name or ASIN")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> searchProducts(
            @RequestParam String query) {

        List<Product> products = productRepository.searchByNameOrAsin(query);
        List<Map<String, Object>> result = products.stream()
                .map(this::mapProductToStockInfo)
                .toList();

        return ResponseEntity.ok(ApiResponse.success("Search results", result));
    }

    private Map<String, Object> mapProductToStockInfo(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("asin", product.getAsin());
        map.put("productName", product.getProductName());
        map.put("imageUrl", product.getImageUrl());
        map.put("price", product.getPrice());
        map.put("stockQuantity", product.getStockQuantity() != null ? product.getStockQuantity() : 0);
        map.put("categoryName", product.getCategory() != null ? product.getCategory().getName() : null);
        map.put("sellerName", product.getSellerName());
        map.put("sellerId", product.getSeller() != null ? product.getSeller().getId() : null);
        map.put("sellerEmail", product.getSeller() != null ?  product.getSeller().getEmail() : null);
        map.put("isMouadVisionProduct", product.getSeller() == null);
        map.put("salesCount", product.getSalesCount());
        map.put("canAdminEdit", product.getSeller() == null);

        int qty = product.getStockQuantity() != null ? product.getStockQuantity() : 0;
        String stockStatus;
        if (qty == 0) {
            stockStatus = "OUT_OF_STOCK";
        } else if (qty < 10) {
            stockStatus = "LOW_STOCK";
        } else {
            stockStatus = "IN_STOCK";
        }
        map.put("stockStatus", stockStatus);

        return map;
    }

    public static class StockUpdateAdminRequest {
        private Integer quantity;
        private String reason;

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    public static class NotifySellerRequest {
        private String message;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
}