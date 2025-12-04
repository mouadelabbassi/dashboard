package com.dashboard.service;

import com.dashboard.dto.request.SmartSearchRequest;
import com.dashboard.dto.response.SmartSearchResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.SearchHistory;
import com.dashboard.entity.User;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.SearchHistoryRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SmartSearchService {

    private final ProductRepository productRepository;
    private final SearchHistoryRepository searchHistoryRepository;
    private final UserRepository userRepository;

    @Transactional
    public SmartSearchResponse smartSearch(SmartSearchRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            User currentUser = getCurrentUser();
            SmartSearchResponse response = performLocalSearch(request);

            if (currentUser != null && response != null) {
                saveSearchHistory(currentUser, request, response);
            }

            return response;

        } catch (Exception e) {
            log.error("Smart search failed: {}", e.getMessage(), e);
            return SmartSearchResponse.builder()
                    .success(false)
                    .results(Collections.emptyList())
                    .totalResults(0)
                    .build();
        }
    }

    private SmartSearchResponse performLocalSearch(SmartSearchRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            String originalQuery = request.getQuery().trim();
            String queryUpper = originalQuery.toUpperCase();

            // PRIORITY 1: ASIN Search
            if (isAsinSearch(queryUpper)) {
                log.info("🏷️ ASIN search detected: {}", queryUpper);
                Optional<Product> product = productRepository.findByAsin(queryUpper);

                if (product.isPresent()) {
                    List<SmartSearchResponse.ProductSearchResult> results =
                            List.of(mapProductToResult(product.get()));

                    double searchTime = System.currentTimeMillis() - startTime;

                    return SmartSearchResponse.builder()
                            .success(true)
                            .query(SmartSearchResponse.ParsedQuery.builder()
                                    .originalQuery(originalQuery)
                                    .normalizedQuery(queryUpper)
                                    .intent("product_search")
                                    .confidence(1.0)
                                    .entities(SmartSearchResponse.ExtractedEntities.builder()
                                            .keywords(List.of(queryUpper))
                                            .build())
                                    .build())
                            .results(results)
                            .totalResults(1)
                            .searchTimeMs(searchTime)
                            .suggestions(List.of())
                            .filtersApplied(Map.of("asin", queryUpper))
                            .build();
                } else {
                    log.warn("ASIN not found: {}", queryUpper);
                }
            }

            // PRIORITY 2: Regular search (existing code continues here)
            String query = originalQuery.toLowerCase();

            // Extract filters
            Double maxPrice = extractMaxPrice(query);
            Double minRating = extractMinRating(query);
            String category = extractCategory(query);

            // Extract clean search term (product name to search for)
            String searchTerm = extractSearchTerm(query);

            log.info("Original query: {}", originalQuery);
            log.info("Search term: {}, maxPrice: {}, minRating: {}, category: {}",
                    searchTerm, maxPrice, minRating, category);

            // Build specification for dynamic query
            Specification<Product> spec = buildSpecification(searchTerm, category, maxPrice, minRating);

            Pageable pageable = PageRequest.of(
                    request.getPage(),
                    request.getSize(),
                    Sort.by("ranking").ascending()
            );

            Page<Product> products = productRepository.findAll(spec, pageable);

            List<SmartSearchResponse.ProductSearchResult> results = products.getContent().stream()
                    .map(this::mapProductToResult)
                    .collect(Collectors.toList());

            double searchTime = System.currentTimeMillis() - startTime;
            String intent = determineIntent(query);

            // Build keywords list (only meaningful words)
            List<String> keywords = new ArrayList<>();
            if (! searchTerm.isEmpty()) {
                keywords.addAll(Arrays.asList(searchTerm.split("\\s+")));
            }
            if (category != null) {
                keywords.add(category);
            }

            return SmartSearchResponse.builder()
                    .success(true)
                    .query(SmartSearchResponse.ParsedQuery.builder()
                            .originalQuery(originalQuery)
                            .normalizedQuery(query)
                            .intent(intent)
                            .confidence(0.7)
                            .entities(SmartSearchResponse.ExtractedEntities.builder()
                                    .keywords(keywords)
                                    .maxPrice(maxPrice)
                                    .minRating(minRating)
                                    .category(category)
                                    .build())
                            .build())
                    .results(results)
                    .totalResults((int) products.getTotalElements())
                    .searchTimeMs(searchTime)
                    .suggestions(generateSuggestions(originalQuery))
                    .filtersApplied(buildFiltersMap(searchTerm, maxPrice, minRating, category))
                    .build();

        } catch (Exception e) {
            log.error("Local search failed: {}", e.getMessage(), e);
            return SmartSearchResponse.builder()
                    .success(false)
                    .results(Collections.emptyList())
                    .totalResults(0)
                    .build();
        }
    }

    private boolean isAsinSearch(String query) {
        return query.matches("^B0[A-Z0-9]{8}$");
    }

    private Specification<Product> buildSpecification(String searchTerm, String category,
                                                      Double maxPrice, Double minRating) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Only approved products
            predicates.add(cb.equal(root.get("approvalStatus"), Product.ApprovalStatus.APPROVED));

            // Search term in product name
            if (searchTerm != null && !searchTerm.trim().isEmpty()) {
                String searchPattern = "%" + searchTerm.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("productName")), searchPattern),
                        cb.like(cb.lower(root.get("asin")), searchPattern)
                ));
            }

            // Category filter
            if (category != null && !category.isEmpty()) {
                predicates.add(cb.like(
                        cb.lower(root.get("category").get("name")),
                        "%" + category.toLowerCase() + "%"
                ));
            }

            // Max price filter
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), BigDecimal.valueOf(maxPrice)));
            }

            // Min rating filter
            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), BigDecimal.valueOf(minRating)));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private String extractSearchTerm(String query) {
        String cleaned = query;

        // Remove price-related phrases
        cleaned = cleaned.replaceAll("sous\\s*\\$? \\d+", "");
        cleaned = cleaned.replaceAll("moins\\s*de\\s*\\$?\\d+", "");
        cleaned = cleaned.replaceAll("under\\s*\\$?\\d+", "");
        cleaned = cleaned.replaceAll("\\$\\d+", "");
        cleaned = cleaned.replaceAll("<\\s*\\d+", "");
        cleaned = cleaned.replaceAll("\\d+\\s*euros? ", "");
        cleaned = cleaned.replaceAll("\\d+\\s*\\$", "");

        // Remove rating phrases
        cleaned = cleaned.replaceAll("\\d+\\s*[eé]toiles?", "");
        cleaned = cleaned.replaceAll("\\d+\\s*stars?", "");
        cleaned = cleaned.replaceAll("bien\\s*not[eé]", "");
        cleaned = cleaned.replaceAll("mieux\\s*not[eé]", "");

        // Remove common filter words (but keep product-related words)
        String[] filterWords = {
                "meilleur", "meilleurs", "meilleure", "meilleures",
                "best", "top", "pas cher", "cheap", "budget",
                "nouveau", "nouveaux", "new", "prix", "price",
                "produit", "produits", "product", "products",
                "avec", "pour", "les", "des", "une", "the", "with", "for"
        };

        for (String word : filterWords) {
            cleaned = cleaned.replaceAll("\\b" + word + "\\b", " ");
        }

        // Remove category words (they're used as filter)
        String[] categoryWords = {
                "electronique", "électronique", "electronics",
                "livre", "livres", "books", "book",
                "vetement", "vêtement", "clothing",
                "maison", "home", "kitchen",
                "jouet", "jouets", "toys",
                "sport", "sports", "beaute", "beauté", "beauty"
        };

        for (String word : categoryWords) {
            cleaned = cleaned.replaceAll("\\b" + word + "s? \\b", " ");
        }

        // Clean up whitespace
        cleaned = cleaned.trim().replaceAll("\\s+", " ");

        return cleaned;
    }

    private Double extractMaxPrice(String query) {
        // Pattern: sous $50, moins de 50, under 100, $50
        Pattern[] patterns = {
                Pattern.compile("sous\\s*\\$?(\\d+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("moins\\s*de\\s*\\$?(\\d+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("under\\s*\\$?(\\d+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("below\\s*\\$?(\\d+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("<\\s*\\$?(\\d+)", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\$(\\d+)", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern p : patterns) {
            Matcher m = p.matcher(query);
            if (m.find()) {
                try {
                    return Double.parseDouble(m.group(1));
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
        }

        // Keywords for cheap products
        if (query.contains("pas cher") || query.contains("cheap") || query.contains("budget")) {
            return 50.0;
        }

        return null;
    }

    private Double extractMinRating(String query) {
        // Pattern: 4 étoiles, 4 stars, 4+
        Pattern[] patterns = {
                Pattern.compile("(\\d)\\s*[eé]toiles?", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(\\d)\\s*stars?", Pattern.CASE_INSENSITIVE),
                Pattern.compile("(\\d)\\+", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern p : patterns) {
            Matcher m = p.matcher(query);
            if (m.find()) {
                try {
                    double rating = Double.parseDouble(m.group(1));
                    if (rating >= 1 && rating <= 5) {
                        return rating;
                    }
                } catch (NumberFormatException e) {
                    // ignore
                }
            }
        }

        // Keywords for well-rated products
        if (query.contains("bien not") || query.contains("mieux not") ||
                query.contains("top rated") || query.contains("highly rated")) {
            return 4.0;
        }

        return null;
    }

    private String extractCategory(String query) {
        Map<String, String> categoryMap = new LinkedHashMap<>();
        categoryMap.put("electronique", "Electronics");
        categoryMap.put("électronique", "Electronics");
        categoryMap.put("electronics", "Electronics");
        categoryMap.put("tech", "Electronics");
        categoryMap.put("livre", "Books");
        categoryMap.put("livres", "Books");
        categoryMap.put("books", "Books");
        categoryMap.put("vetement", "Clothing");
        categoryMap.put("vêtement", "Clothing");
        categoryMap.put("clothing", "Clothing");
        categoryMap.put("maison", "Home");
        categoryMap.put("home", "Home");
        categoryMap.put("jouet", "Toys");
        categoryMap.put("jouets", "Toys");
        categoryMap.put("toys", "Toys");
        categoryMap.put("sport", "Sports");
        categoryMap.put("sports", "Sports");
        categoryMap.put("beaute", "Beauty");
        categoryMap.put("beauté", "Beauty");
        categoryMap.put("beauty", "Beauty");

        for (Map.Entry<String, String> entry : categoryMap.entrySet()) {
            if (query.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return null;
    }

    private String determineIntent(String query) {
        if (query.contains("meilleur") && (query.contains("prix") || query.contains("rapport"))) {
            return "best_value";
        }
        if (query.contains("meilleur") || query.contains("best") || query.contains("top")) {
            return "top_rated";
        }
        if (query.contains("pas cher") || query.contains("cheap") || query.contains("sous") || query.contains("under")) {
            return "price_filter";
        }
        if (query.contains("nouveau") || query.contains("new")) {
            return "new_arrivals";
        }
        if (query.contains("populaire") || query.contains("bestseller")) {
            return "bestsellers";
        }
        return "product_search";
    }

    private List<String> generateSuggestions(String query) {
        List<String> suggestions = new ArrayList<>();
        // Generate simple, non-accumulating suggestions
        String baseQuery = query.split("\\s+")[0]; // Just first word
        if (baseQuery.length() > 2) {
            suggestions.add(baseQuery + " pas cher");
            suggestions.add(baseQuery + " meilleur prix");
            suggestions.add(baseQuery + " bien noté");
        }
        return suggestions;
    }

    private Map<String, Object> buildFiltersMap(String searchTerm, Double maxPrice,
                                                Double minRating, String category) {
        Map<String, Object> filters = new HashMap<>();
        if (searchTerm != null && !searchTerm.isEmpty()) {
            filters.put("searchTerm", searchTerm);
        }
        if (maxPrice != null) {
            filters.put("maxPrice", maxPrice);
        }
        if (minRating != null) {
            filters.put("minRating", minRating);
        }
        if (category != null) {
            filters.put("category", category);
        }
        return filters;
    }

    @Transactional(readOnly = true)
    public Page<Product> searchWithFilters(String keyword, String category, Double minPrice,
                                           Double maxPrice, Double minRating, Integer minReviews,
                                           Boolean isBestseller, String sortBy, String sortOrder,
                                           Pageable pageable) {

        log.info("searchWithFilters - keyword: {}, category: {}, maxPrice: {}", keyword, category, maxPrice);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("approvalStatus"), Product.ApprovalStatus.APPROVED));

            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchTerm = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("productName")), searchTerm),
                        cb.like(cb.lower(root.get("asin")), searchTerm)
                ));
            }

            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("category").get("name")),
                        "%" + category.toLowerCase() + "%"));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), BigDecimal.valueOf(minPrice)));
            }
            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), BigDecimal.valueOf(maxPrice)));
            }

            if (minRating != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), BigDecimal.valueOf(minRating)));
            }

            if (minReviews != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("reviewsCount"), minReviews));
            }

            if (isBestseller != null && isBestseller) {
                predicates.add(cb.equal(root.get("isBestseller"), true));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Sort sort = Sort.by("ranking").ascending();
        if (sortBy != null && ! sortBy.isEmpty()) {
            sort = "desc".equalsIgnoreCase(sortOrder)
                    ? Sort.by(sortBy).descending()
                    : Sort.by(sortBy).ascending();
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        return productRepository.findAll(spec, sortedPageable);
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestions(String prefix, int limit) {
        try {
            return productRepository.findProductNameSuggestions(prefix, PageRequest.of(0, limit));
        } catch (Exception e) {
            log.warn("Error fetching suggestions: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<String> getTrendingSearches(int limit) {
        try {
            LocalDateTime since = LocalDateTime.now().minusDays(7);
            return searchHistoryRepository.findTrendingQueries(since, PageRequest.of(0, limit));
        } catch (Exception e) {
            log.warn("Error fetching trending searches: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    @Transactional(readOnly = true)
    public List<String> getRecentSearches(int limit) {
        try {
            User currentUser = getCurrentUser();
            if (currentUser == null) {
                return Collections.emptyList();
            }
            return searchHistoryRepository.findRecentQueriesByUser(currentUser, PageRequest.of(0, limit));
        } catch (Exception e) {
            log.warn("Error fetching recent searches: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private void saveSearchHistory(User user, SmartSearchRequest request, SmartSearchResponse response) {
        try {
            SearchHistory history = SearchHistory.builder()
                    .user(user)
                    .query(request.getQuery())
                    .normalizedQuery(response.getQuery() != null ?
                            response.getQuery().getNormalizedQuery() : request.getQuery().toLowerCase())
                    .intent(response.getQuery() != null ? response.getQuery().getIntent() : "unknown")
                    .resultsCount(response.getTotalResults())
                    .searchTimeMs(response.getSearchTimeMs())
                    .userRole(request.getUserRole())
                    .build();
            searchHistoryRepository.save(history);
        } catch (Exception e) {
            log.error("Failed to save search history: {}", e.getMessage());
        }
    }

    private SmartSearchResponse.ProductSearchResult mapProductToResult(Product product) {
        return SmartSearchResponse.ProductSearchResult.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .price(product.getPrice() != null ? product.getPrice().doubleValue() : 0.0)
                .rating(product.getRating() != null ? product.getRating().doubleValue() : null)
                .reviewsCount(product.getReviewsCount())
                .categoryName(product.getCategory() != null ?  product.getCategory().getName() : null)
                .imageUrl(product.getImageUrl())
                .sellerName(product.getSellerName())
                .isBestseller(product.getIsBestseller() != null && product.getIsBestseller())
                .stockQuantity(product.getStockQuantity())
                .relevanceScore(1.0)
                .build();
    }

    private User getCurrentUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated() &&
                    !"anonymousUser".equals(authentication.getPrincipal())) {
                String email = authentication.getName();
                return userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            log.debug("Could not get current user: {}", e.getMessage());
        }
        return null;
    }
}