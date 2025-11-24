package com.dashboard.controller;

import com.dashboard.dto.request.ProductRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.ProductResponse;
import com.dashboard.service.ProductService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product management endpoints")
public class ProductController {

    private final ProductService productService;

    @GetMapping
    @Operation(summary = "Get all products", description = "Returns paginated list of all products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getAllProducts(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "ranking") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "asc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<ProductResponse> products = productService.getAllProducts(pageable);
        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", products));
    }

    @GetMapping("/{asin}")
    @Operation(summary = "Get product by ASIN", description = "Returns a single product by its ASIN")
    public ResponseEntity<ApiResponse<ProductResponse>> getProductByAsin(
            @Parameter(description = "Product ASIN") @PathVariable String asin) {

        ProductResponse product = productService.getProductByAsin(asin);
        return ResponseEntity.ok(ApiResponse.success("Product retrieved successfully", product));
    }

    @GetMapping("/search")
    @Operation(summary = "Search products", description = "Search products by name, description, or ASIN")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> searchProducts(
            @Parameter(description = "Search query") @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<ProductResponse> products = productService.searchProducts(q, pageable);
        return ResponseEntity.ok(ApiResponse.success("Search completed successfully", products));
    }

    @GetMapping("/filter")
    @Operation(summary = "Filter products", description = "Filter products by category, price range, and rating")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> filterProducts(
            @Parameter(description = "Category Name") @RequestParam(required = false) String categoryName,
            @Parameter(description = "Minimum price") @RequestParam(required = false) BigDecimal minPrice,
            @Parameter(description = "Maximum price") @RequestParam(required = false) BigDecimal maxPrice,
            @Parameter(description = "Minimum rating") @RequestParam(required = false) BigDecimal minRating,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "ranking") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortBy));
        Page<ProductResponse> products = productService.filterProducts(categoryName, minPrice, maxPrice, minRating, pageable);
        return ResponseEntity.ok(ApiResponse.success("Products filtered successfully", products));
    }

    @GetMapping("/top/{n}")
    @Operation(summary = "Get top N products", description = "Returns top N products by ranking")
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getTopProducts(
            @Parameter(description = "Number of top products") @PathVariable Integer n) {

        List<ProductResponse> products = productService.getTopProducts(n);
        return ResponseEntity.ok(ApiResponse.success("Top products retrieved successfully", products));
    }

    @PostMapping
    @Operation(summary = "Create product", description = "Creates a new product")
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {

        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Product created successfully", product));
    }

    @PutMapping("/{asin}")
    @Operation(summary = "Update product", description = "Updates an existing product")
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @Parameter(description = "Product ASIN") @PathVariable String asin,
            @Valid @RequestBody ProductRequest request) {

        ProductResponse product = productService.updateProduct(asin, request);
        return ResponseEntity.ok(ApiResponse.success("Product updated successfully", product));
    }

    @DeleteMapping("/{asin}")
    @Operation(summary = "Delete product", description = "Deletes a product by ASIN")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            @Parameter(description = "Product ASIN") @PathVariable String asin) {

        productService.deleteProduct(asin);
        return ResponseEntity.ok(ApiResponse.success("Product deleted successfully", null));
    }
}