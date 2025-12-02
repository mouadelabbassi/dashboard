package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartSearchResponse {
    private boolean success;
    private ParsedQuery query;
    private List<ProductSearchResult> results;
    private int totalResults;
    private double searchTimeMs;
    private List<String> suggestions;
    private Map<String, Object> filtersApplied;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ParsedQuery {
        private String originalQuery;
        private String normalizedQuery;
        private String intent;
        private double confidence;
        private ExtractedEntities entities;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExtractedEntities {
        private List<String> keywords;
        private String category;
        private Double minPrice;
        private Double maxPrice;
        private Double minRating;
        private Integer minReviews;
        private String sellerName;
        private String sortBy;
        private String sortOrder;
        private Boolean isBestseller;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductSearchResult {
        private String asin;
        private String productName;
        private double price;
        private Double rating;
        private Integer reviewsCount;
        private String categoryName;
        private String imageUrl;
        private String sellerName;
        private boolean isBestseller;
        private Integer stockQuantity;
        private double relevanceScore;
    }
}