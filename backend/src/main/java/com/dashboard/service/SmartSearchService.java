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
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

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
    private final RestTemplate restTemplate;

    @Value("${ai.service.url:http://localhost:8000}")
    private String aiServiceUrl;

    @Value("${ai.service.enabled:true}")
    private boolean aiServiceEnabled;

    @Transactional
    public SmartSearchResponse smartSearch(SmartSearchRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            User currentUser = getCurrentUser();

            SmartSearchResponse response;

            if (aiServiceEnabled) {
                response = callAiService(request);

                if (response == null || ! response.isSuccess()) {
                    log.warn("AI service failed, falling back to local search");
                    response = performLocalSearch(request);
                }
            } else {
                response = performLocalSearch(request);
            }

            if (currentUser != null && response != null) {
                saveSearchHistory(currentUser, request, response);
            }

            return response;

        } catch (Exception e) {
            log.error("Smart search failed: {}", e.getMessage(), e);
            return performLocalSearch(request);
        }
    }

    private SmartSearchResponse callAiService(SmartSearchRequest request) {
        try {
            String url = aiServiceUrl + "/api/ai/search";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<SmartSearchRequest> entity = new HttpEntity<>(request, headers);

            ResponseEntity<SmartSearchResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    entity,
                    SmartSearchResponse.class
            );

            if (response.getStatusCode() == HttpStatus.OK) {
                return response.getBody();
            } else {
                log.error("AI service returned status: {}", response.getStatusCode());
                return null;
            }

        } catch (Exception e) {
            log.error("AI service communication error: {}", e.getMessage());
            return null;
        }
    }

    private SmartSearchResponse performLocalSearch(SmartSearchRequest request) {
        long startTime = System.currentTimeMillis();

        try {
            String query = request.getQuery().toLowerCase().trim();

            // Parse basic filters from query
            Double maxPrice = extractMaxPrice(query);
            Double minRating = extractMinRating(query);
            String category = extractCategory(query);
            String cleanKeyword = cleanQuery(query);

            Pageable pageable = PageRequest.of(request.getPage(), request.getSize(), Sort.by("ranking").ascending());

            Page<Product> products;
            if (cleanKeyword.isEmpty()) {
                products = productRepository.findByApprovalStatus("APPROVED", pageable);
            } else {
                products = productRepository.searchByKeyword(cleanKeyword, pageable);
            }

            // Apply additional filters
            List<SmartSearchResponse.ProductSearchResult> results = products.getContent().stream()
                    .filter(p -> maxPrice == null || (p.getPrice() != null && p.getPrice().doubleValue() <= maxPrice))
                    .filter(p -> minRating == null || (p.getRating() != null && p.getRating().doubleValue() >= minRating))
                    .filter(p -> category == null || (p.getCategory() != null && p.getCategory().getName().equalsIgnoreCase(category)))
                    .map(this::mapProductToResult)
                    .collect(Collectors.toList());

            double searchTime = System.currentTimeMillis() - startTime;

            String intent = determineIntent(query);

            return SmartSearchResponse.builder()
                    .success(true)
                    .query(SmartSearchResponse.ParsedQuery.builder()
                            .originalQuery(request.getQuery())
                            .normalizedQuery(query)
                            .intent(intent)
                            .confidence(0.7)
                            .entities(SmartSearchResponse.ExtractedEntities.builder()
                                    .keywords(Arrays.asList(cleanKeyword.split("\\s+")))
                                    .maxPrice(maxPrice)
                                    .minRating(minRating)
                                    .category(category)
                                    .build())
                            .build())
                    .results(results)
                    .totalResults(results.size())
                    .searchTimeMs(searchTime)
                    .suggestions(generateBasicSuggestions(query))
                    .filtersApplied(buildFiltersMap(cleanKeyword, maxPrice, minRating, category))
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

    private Double extractMaxPrice(String query) {
        try {
            // Pattern: "sous 50", "moins de 50", "under 100", "< 50"
            String[] patterns = {
                    "sous\\s*(\\d+)",
                    "moins\\s*de\\s*(\\d+)",
                    "under\\s*(\\d+)",
                    "below\\s*(\\d+)",
                    "max\\s*(\\d+)",
                    "<\\s*(\\d+)"
            };

            for (String patternStr : patterns) {
                Pattern p = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
                Matcher m = p.matcher(query);
                if (m.find()) {
                    return Double.parseDouble(m.group(1));
                }
            }

            // Check for keywords
            if (query.contains("pas cher") || query.contains("cheap") || query.contains("budget")) {
                return 50.0;
            }
        } catch (Exception e) {
            log.debug("Error extracting max price: {}", e.getMessage());
        }

        return null;
    }

    private Double extractMinRating(String query) {
        try {
            // Pattern: "4 etoiles", "4 stars", "4+"
            String[] patterns = {
                    "(\\d)\\s*etoiles? ",
                    "(\\d)\\s*stars?",
                    "(\\d)\\+",
                    "note\\s*(\\d)"
            };

            for (String patternStr : patterns) {
                Pattern p = Pattern.compile(patternStr, Pattern.CASE_INSENSITIVE);
                Matcher m = p.matcher(query);
                if (m.find()) {
                    return Double.parseDouble(m.group(1));
                }
            }

            // Check for keywords
            if (query.contains("bien note") || query.contains("mieux note") ||
                    query.contains("top rated") || query.contains("highly rated")) {
                return 4.0;
            }
        } catch (Exception e) {
            log.debug("Error extracting min rating: {}", e.getMessage());
        }

        return null;
    }

    private String extractCategory(String query) {
        Map<String, String> categoryKeywords = new HashMap<>();
        categoryKeywords.put("electronique", "Electronics");
        categoryKeywords.put("electronics", "Electronics");
        categoryKeywords.put("tech", "Electronics");
        categoryKeywords.put("livre", "Books");
        categoryKeywords.put("livres", "Books");
        categoryKeywords.put("books", "Books");
        categoryKeywords.put("vetement", "Clothing");
        categoryKeywords.put("clothing", "Clothing");
        categoryKeywords.put("mode", "Clothing");
        categoryKeywords.put("maison", "Home & Kitchen");
        categoryKeywords.put("home", "Home & Kitchen");
        categoryKeywords.put("jouet", "Toys & Games");
        categoryKeywords.put("toys", "Toys & Games");
        categoryKeywords.put("sport", "Sports & Outdoors");
        categoryKeywords.put("sports", "Sports & Outdoors");
        categoryKeywords.put("beaute", "Beauty");
        categoryKeywords.put("beauty", "Beauty");

        for (Map.Entry<String, String> entry : categoryKeywords.entrySet()) {
            if (query.contains(entry.getKey())) {
                return entry.getValue();
            }
        }

        return null;
    }

    private String cleanQuery(String query) {
        // Remove price patterns
        query = query.replaceAll("sous\\s*\\d+", "");
        query = query.replaceAll("moins\\s*de\\s*\\d+", "");
        query = query.replaceAll("under\\s*\\d+", "");
        query = query.replaceAll("<\\s*\\d+", "");
        query = query.replaceAll("\\d+\\s*euros?", "");
        query = query.replaceAll("\\d+\\s*dollars?", "");

        // Remove rating patterns
        query = query.replaceAll("\\d\\s*etoiles?", "");
        query = query.replaceAll("\\d\\s*stars?", "");
        query = query.replaceAll("bien note", "");
        query = query.replaceAll("mieux note", "");

        // Remove common filter words
        String[] filterWords = {"pas cher", "cheap", "budget", "premium", "luxe", "meilleur", "best", "top", "nouveau", "new"};
        for (String word : filterWords) {
            query = query.replace(word, "");
        }

        return query.trim().replaceAll("\\s+", " ");
    }

    private String determineIntent(String query) {
        if (query.contains("meilleur") || query.contains("best") || query.contains("top")) {
            if (query.contains("prix") || query.contains("price") || query.contains("rapport")) {
                return "best_value";
            }
            return "top_rated";
        }
        if (query.contains("pas cher") || query.contains("cheap") || query.contains("sous") || query.contains("under")) {
            return "price_filter";
        }
        if (query.contains("nouveau") || query.contains("new") || query.contains("recent")) {
            return "new_arrivals";
        }
        if (query.contains("populaire") || query.contains("bestseller") || query.contains("tendance")) {
            return "bestsellers";
        }
        return "product_search";
    }

    private Map<String, Object> buildFiltersMap(String keyword, Double maxPrice, Double minRating, String category) {
        Map<String, Object> filters = new HashMap<>();
        if (keyword != null && !keyword.isEmpty()) {
            filters.put("keyword", keyword);
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
    public Page<Product> searchWithFilters(
            String keyword,
            String category,
            Double minPrice,
            Double maxPrice,
            Double minRating,
            Integer minReviews,
            Boolean isBestseller,
            String sortBy,
            String sortOrder,
            Pageable pageable) {

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.equal(root.get("approvalStatus"), "APPROVED"));

            if (keyword != null && !keyword.trim().isEmpty()) {
                String searchTerm = "%" + keyword.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("productName")), searchTerm),
                        cb.like(cb.lower(root.get("asin")), searchTerm)
                ));
            }

            if (category != null && !category.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("category").get("name"), category));
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
        if (sortBy != null && !sortBy.isEmpty()) {
            sort = "desc".equalsIgnoreCase(sortOrder)
                    ? Sort.by(sortBy).descending()
                    : Sort.by(sortBy).ascending();
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        return productRepository.findAll(spec, sortedPageable);
    }

    @Transactional(readOnly = true)
    public List<String> getSuggestions(String prefix, int limit) {
        List<String> suggestions = new ArrayList<>();

        try {
            List<String> historySuggestions = searchHistoryRepository
                    .findSuggestionsByPrefix(prefix, PageRequest.of(0, limit));
            suggestions.addAll(historySuggestions);
        } catch (Exception e) {
            log.warn("Error fetching history suggestions: {}", e.getMessage());
        }

        if (suggestions.size() < limit) {
            try {
                List<String> productSuggestions = productRepository
                        .findProductNameSuggestions(prefix, PageRequest.of(0, limit - suggestions.size()));
                suggestions.addAll(productSuggestions);
            } catch (Exception e) {
                log.warn("Error fetching product suggestions: {}", e.getMessage());
            }
        }

        return suggestions.stream().distinct().limit(limit).collect(Collectors.toList());
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
                    .normalizedQuery(response.getQuery() != null ? response.getQuery().getNormalizedQuery() : request.getQuery().toLowerCase())
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

    private List<String> generateBasicSuggestions(String query) {
        List<String> suggestions = new ArrayList<>();
        if (query.length() > 2) {
            suggestions.add(query + " pas cher");
            suggestions.add(query + " meilleur prix");
            suggestions.add(query + " bien note");
            suggestions.add("meilleur " + query);
        }
        return suggestions;
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
            if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
                String email = authentication.getName();
                return userRepository.findByEmail(email).orElse(null);
            }
        } catch (Exception e) {
            log.debug("Could not get current user: {}", e.getMessage());
        }
        return null;
    }
}