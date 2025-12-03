package com.dashboard.controller;

import com.dashboard.dto.request.SmartSearchRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.SmartSearchResponse;
import com.dashboard.entity.Product;
import com.dashboard.service.SmartSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Smart Search", description = "AI-powered intelligent search endpoints")
public class SmartSearchController {

    private final SmartSearchService smartSearchService;

    @PostMapping("/smart")
    @Operation(summary = "Perform AI-powered search")
    public ResponseEntity<ApiResponse<SmartSearchResponse>> smartSearch(
            @RequestBody SmartSearchRequest request) {

        log.info("Smart search request: {}", request.getQuery());
        try {
            SmartSearchResponse response = smartSearchService.smartSearch(request);
            return ResponseEntity.ok(ApiResponse.success("Search completed", response));
        } catch (Exception e) {
            log.error("Smart search error: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success("Search completed",
                    SmartSearchResponse.builder()
                            .success(false)
                            .results(Collections.emptyList())
                            .totalResults(0)
                            .build()));
        }
    }

    @GetMapping("/smart")
    @Operation(summary = "Perform AI-powered search (GET)")
    public ResponseEntity<ApiResponse<SmartSearchResponse>> smartSearchGet(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String userRole) {

        SmartSearchRequest request = SmartSearchRequest.builder()
                .query(query)
                .page(page)
                .size(size)
                .userRole(userRole != null ? userRole : "BUYER")
                .build();

        try {
            SmartSearchResponse response = smartSearchService.smartSearch(request);
            return ResponseEntity.ok(ApiResponse.success("Search completed", response));
        } catch (Exception e) {
            log.error("Smart search error: {}", e.getMessage());
            return ResponseEntity.ok(ApiResponse.success("Search completed",
                    SmartSearchResponse.builder()
                            .success(false)
                            .results(Collections.emptyList())
                            .totalResults(0)
                            .build()));
        }
    }

    @GetMapping("/suggestions")
    @Operation(summary = "Get search suggestions")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSuggestions(
            @RequestParam String q,
            @RequestParam(defaultValue = "10") int limit) {

        try {
            List<String> suggestions = smartSearchService.getSuggestions(q, limit);
            List<String> trending = smartSearchService.getTrendingSearches(5);
            List<String> recent = smartSearchService.getRecentSearches(5);

            Map<String, Object> result = new HashMap<>();
            result.put("suggestions", suggestions);
            result.put("trending", trending);
            result.put("recent", recent);

            return ResponseEntity.ok(ApiResponse.success("Suggestions retrieved", result));
        } catch (Exception e) {
            log.error("Suggestions error: {}", e.getMessage());
            Map<String, Object> result = new HashMap<>();
            result.put("suggestions", Collections.emptyList());
            result.put("trending", Collections.emptyList());
            result.put("recent", Collections.emptyList());
            return ResponseEntity.ok(ApiResponse.success("Suggestions retrieved", result));
        }
    }

    @GetMapping("/trending")
    public ResponseEntity<ApiResponse<List<String>>> getTrending(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<String> trending = smartSearchService.getTrendingSearches(limit);
            return ResponseEntity.ok(ApiResponse.success("Trending searches", trending));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("Trending searches", Collections.emptyList()));
        }
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<String>>> getRecent(
            @RequestParam(defaultValue = "10") int limit) {
        try {
            List<String> recent = smartSearchService.getRecentSearches(limit);
            return ResponseEntity.ok(ApiResponse.success("Recent searches", recent));
        } catch (Exception e) {
            return ResponseEntity.ok(ApiResponse.success("Recent searches", Collections.emptyList()));
        }
    }

    @GetMapping("/products/search/smart")
    @Operation(summary = "Search products with filters (for AI service)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> searchProductsForAI(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) Integer minReviews,
            @RequestParam(required = false) Boolean isBestseller,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        log.info("AI Service search - keyword: {}, category: {}, maxPrice: {}", keyword, category, maxPrice);

        try {
            Page<Product> products = smartSearchService.searchWithFilters(
                    keyword, category, minPrice, maxPrice, minRating, minReviews,
                    isBestseller, sortBy, sortOrder, PageRequest.of(page, size));

            log.info("Found {} products", products.getTotalElements());

            List<Map<String, Object>> content = products.getContent().stream()
                    .map(this::mapProductToMap)
                    .collect(Collectors.toList());

            Map<String, Object> result = new HashMap<>();
            result.put("content", content);
            result.put("totalElements", products.getTotalElements());
            result.put("totalPages", products.getTotalPages());
            result.put("number", products.getNumber());
            result.put("size", products.getSize());

            return ResponseEntity.ok(ApiResponse.success("Products retrieved", result));
        } catch (Exception e) {
            log.error("Search products error: {}", e.getMessage(), e);
            Map<String, Object> result = new HashMap<>();
            result.put("content", Collections.emptyList());
            result.put("totalElements", 0);
            return ResponseEntity.ok(ApiResponse.success("Products retrieved", result));
        }
    }

    private Map<String, Object> mapProductToMap(Product product) {
        Map<String, Object> map = new HashMap<>();
        map.put("asin", product.getAsin());
        map.put("productName", product.getProductName());
        map.put("price", product.getPrice());
        map.put("rating", product.getRating());
        map.put("reviewsCount", product.getReviewsCount());
        map.put("categoryName", product.getCategory() != null ?  product.getCategory().getName() : null);
        map.put("imageUrl", product.getImageUrl());
        map.put("sellerName", product.getSellerName());
        map.put("isBestseller", product.getIsBestseller());
        map.put("stockQuantity", product.getStockQuantity());
        return map;
    }
}