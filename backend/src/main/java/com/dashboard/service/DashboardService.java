package com.dashboard.service;

import com.dashboard.dto.response.DashboardResponse;
import com.dashboard.dto.response.DashboardStatsResponse;
import com.dashboard.dto.response.ProductResponse;
import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SaleRepository saleRepository;

    /**
     * Get ALL products (both store and seller products)
     * This ensures consistency across all dashboard components
     */
    private List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    /**
     * Get only approved products for public-facing stats
     */
    private List<Product> getApprovedProducts() {
        return productRepository.findAll().stream()
                .filter(p -> p.getApprovalStatus() == Product.ApprovalStatus.APPROVED)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        log.debug("Fetching dashboard stats");

        // Use ALL products for consistency
        List<Product> allProducts = getAllProducts();
        long totalProducts = allProducts.size();
        Long totalCategories = categoryRepository.count();

        // Calculate averages from all products
        BigDecimal avgPrice = allProducts.stream()
                .filter(p -> p.getPrice() != null)
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(Math.max(totalProducts, 1)), 2, RoundingMode.HALF_UP);

        BigDecimal avgRating = allProducts.stream()
                .filter(p -> p.getRating() != null)
                .map(Product::getRating)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(Math.max(allProducts.stream().filter(p -> p.getRating() != null).count(), 1)), 1, RoundingMode.HALF_UP);

        Long totalReviews = allProducts.stream()
                .filter(p -> p.getReviewsCount() != null)
                .mapToLong(Product::getReviewsCount)
                .sum();

        BigDecimal totalRevenue = saleRepository.calculateTotalRevenue();
        Long totalSales = saleRepository.countCompletedSales();

        // Calculate inventory value
        BigDecimal totalInventoryValue = allProducts.stream()
                .filter(p -> p.getPrice() != null)
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts)
                .totalCategories(totalCategories != null ? totalCategories : 0L)
                .avgPrice(avgPrice)
                .avgRating(avgRating)
                .totalReviews(totalReviews)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalSales(totalSales != null ? totalSales : 0L)
                .totalInventoryValue(totalInventoryValue.setScale(2, RoundingMode.HALF_UP))
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardSummary() {
        log.debug("Fetching dashboard summary");

        List<Product> allProducts = getAllProducts();
        long totalProducts = allProducts.size();
        Long totalCategories = categoryRepository.count();

        BigDecimal avgPrice = allProducts.stream()
                .filter(p -> p.getPrice() != null)
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(Math.max(totalProducts, 1)), 2, RoundingMode.HALF_UP);

        BigDecimal avgRating = allProducts.stream()
                .filter(p -> p.getRating() != null)
                .map(Product::getRating)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(Math.max(allProducts.stream().filter(p -> p.getRating() != null).count(), 1)), 1, RoundingMode.HALF_UP);

        Long totalReviews = allProducts.stream()
                .filter(p -> p.getReviewsCount() != null)
                .mapToLong(Product::getReviewsCount)
                .sum();

        BigDecimal totalRevenue = saleRepository.calculateTotalRevenue();
        Long totalSales = saleRepository.countCompletedSales();

        // Get top product by calculated score
        List<Product> rankedProducts = getProductsRankedByScore(allProducts);
        Product topProduct = rankedProducts.isEmpty() ? null : rankedProducts.get(0);
        ProductResponse topProductResponse = topProduct != null ?  convertToProductResponse(topProduct) : null;

        return DashboardResponse.builder()
                .totalProducts(totalProducts)
                .totalCategories(totalCategories != null ? totalCategories : 0L)
                .avgPrice(avgPrice)
                .avgRating(avgRating)
                .totalReviews(totalReviews)
                .topProduct(topProductResponse)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalSales(totalSales != null ? totalSales : 0L)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getCategoryDistribution() {
        log.debug("Fetching category distribution");

        // Count products directly from products table for accuracy
        List<Product> allProducts = getAllProducts();
        Map<String, Long> distribution = new LinkedHashMap<>();

        // Group products by category
        Map<String, Long> categoryCount = allProducts.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(
                        p -> p.getCategory().getName(),
                        Collectors.counting()
                ));

        // Sort by count descending
        categoryCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .forEach(e -> distribution.put(e.getKey(), e.getValue()));

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getPriceDistribution() {
        log.debug("Fetching price distribution");

        // Use same product list as other methods
        List<Product> products = getAllProducts();
        Map<String, Long> distribution = new LinkedHashMap<>();

        long under10 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("10")) < 0).count();
        long range10to25 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("10")) >= 0 && p.getPrice().compareTo(new BigDecimal("25")) < 0).count();
        long range25to50 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("25")) >= 0 && p.getPrice().compareTo(new BigDecimal("50")) < 0).count();
        long range50to100 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("50")) >= 0 && p.getPrice().compareTo(new BigDecimal("100")) < 0).count();
        long range100to200 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("100")) >= 0 && p.getPrice().compareTo(new BigDecimal("200")) < 0).count();
        long over200 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("200")) >= 0).count();

        distribution.put("$0-$10", under10);
        distribution.put("$10-$25", range10to25);
        distribution.put("$25-$50", range25to50);
        distribution.put("$50-$100", range50to100);
        distribution.put("$100-$200", range100to200);
        distribution.put("$200+", over200);

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getRatingDistribution() {
        log.debug("Fetching rating distribution");

        // Use same product list
        List<Product> products = getAllProducts();
        Map<String, Long> distribution = new LinkedHashMap<>();

        long fiveStars = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.5")) >= 0).count();
        long fourToFive = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.0")) >= 0 && p.getRating().compareTo(new BigDecimal("4.5")) < 0).count();
        long threeToFour = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("3.0")) >= 0 && p.getRating().compareTo(new BigDecimal("4.0")) < 0).count();
        long twoToThree = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("2.0")) >= 0 && p.getRating().compareTo(new BigDecimal("3.0")) < 0).count();
        long belowTwo = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("2.0")) < 0).count();

        // Count products with no rating
        long noRating = products.stream().filter(p -> p.getRating() == null).count();

        distribution.put("★★★★★ (4.5+)", fiveStars);
        distribution.put("★★★★☆ (4.0-4.5)", fourToFive);
        distribution.put("★★★☆☆ (3.0-4.0)", threeToFour);
        distribution.put("★★☆☆☆ (2.0-3.0)", twoToThree);
        distribution.put("★☆☆☆☆ (<2.0)", belowTwo + noRating); // Include no rating in lowest category

        return distribution;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenue() {
        log.debug("Fetching category revenue");

        List<Product> allProducts = getAllProducts();
        List<Map<String, Object>> result = new ArrayList<>();

        // Group products by category
        Map<Category, List<Product>> productsByCategory = allProducts.stream()
                .filter(p -> p.getCategory() != null)
                .collect(Collectors.groupingBy(Product::getCategory));

        for (Map.Entry<Category, List<Product>> entry : productsByCategory.entrySet()) {
            Category category = entry.getKey();
            List<Product> products = entry.getValue();

            // Calculate estimated revenue based on sales_count or reviews as fallback
            BigDecimal totalRevenue = products.stream()
                    .filter(p -> p.getPrice() != null)
                    .map(p -> {
                        int salesCount = p.getSalesCount() != null ?  p.getSalesCount() : 0;
                        int reviewsCount = p.getReviewsCount() != null ? p.getReviewsCount() : 0;

                        // Use actual sales if available, otherwise estimate from reviews
                        int estimatedSales = salesCount > 0 ? salesCount : Math.max(reviewsCount / 10, 1);
                        return p.getPrice().multiply(new BigDecimal(estimatedSales));
                    })
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal avgPrice = products.stream()
                    .filter(p -> p.getPrice() != null)
                    .map(Product::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(new BigDecimal(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);

            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("name", category.getName());
            categoryData.put("productCount", products.size());
            categoryData.put("estimatedRevenue", totalRevenue.setScale(2, RoundingMode.HALF_UP));
            categoryData.put("avgPrice", avgPrice);

            result.add(categoryData);
        }

        // Sort by estimated revenue descending
        result.sort((a, b) -> ((BigDecimal) b.get("estimatedRevenue")).compareTo((BigDecimal) a.get("estimatedRevenue")));

        return result;
    }

    /**
     * Calculate a dynamic ranking score for products
     * Formula: (sales_count * 10) + (reviews_count * 0.5) + (rating * 20) - penalty for no data
     */
    private double calculateProductScore(Product p) {
        double salesScore = (p.getSalesCount() != null ?  p.getSalesCount() : 0) * 10.0;
        double reviewsScore = (p.getReviewsCount() != null ? p.getReviewsCount() : 0) * 0.5;
        double ratingScore = (p.getRating() != null ? p.getRating().doubleValue() : 0) * 20.0;

        // Bonus for having an original ranking (from CSV data)
        double rankingBonus = 0;
        if (p.getRanking() != null && p.getRanking() > 0) {
            rankingBonus = Math.max(0, 100 - p.getRanking()); // Higher bonus for lower ranking number
        }

        return salesScore + reviewsScore + ratingScore + rankingBonus;
    }

    /**
     * Get products sorted by calculated score (best first)
     */
    private List<Product> getProductsRankedByScore(List<Product> products) {
        return products.stream()
                .sorted((a, b) -> Double.compare(calculateProductScore(b), calculateProductScore(a)))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getTopBestsellers(int limit) {
        log.debug("Fetching top {} bestsellers", limit);

        List<Product> allProducts = getAllProducts();

        // Rank by calculated score instead of just ranking field
        return getProductsRankedByScore(allProducts).stream()
                .limit(limit)
                .map(this::convertToProductResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getTopProducts(int limit) {
        log.debug("Fetching top {} products", limit);

        List<Product> allProducts = getAllProducts();

        // Rank by calculated score
        List<Product> rankedProducts = getProductsRankedByScore(allProducts);

        // Assign dynamic ranking based on score position
        List<ProductResponse> result = new ArrayList<>();
        for (int i = 0; i < Math.min(limit, rankedProducts.size()); i++) {
            Product p = rankedProducts.get(i);
            ProductResponse response = convertToProductResponse(p);
            response.setRanking(i + 1); // Dynamic ranking based on score
            result.add(response);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReviewsRankingCorrelation() {
        log.debug("Fetching reviews-ranking correlation data");

        List<Product> allProducts = getAllProducts();

        // Get top 100 products by score for the scatter plot
        List<Product> rankedProducts = getProductsRankedByScore(allProducts).stream()
                .limit(100)
                .collect(Collectors.toList());

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 0; i < rankedProducts.size(); i++) {
            Product p = rankedProducts.get(i);
            Map<String, Object> point = new HashMap<>();
            point.put("asin", p.getAsin());
            point.put("name", p.getProductName().length() > 30 ? p.getProductName().substring(0, 30) + "..." : p.getProductName());
            point.put("reviews", p.getReviewsCount() != null ? p.getReviewsCount() : 0);
            point.put("ranking", i + 1); // Dynamic ranking
            point.put("rating", p.getRating() != null ? p.getRating() : BigDecimal.ZERO);
            point.put("price", p.getPrice() != null ? p.getPrice() : BigDecimal.ZERO);
            point.put("category", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
            point.put("salesCount", p.getSalesCount() != null ? p.getSalesCount() : 0);
            result.add(point);
        }

        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesTrends() {
        log.debug("Fetching sales trends");

        Map<String, Object> trends = new HashMap<>();

        List<Product> allProducts = getAllProducts();
        long totalProducts = allProducts.size();

        BigDecimal avgRating = allProducts.stream()
                .filter(p -> p.getRating() != null)
                .map(Product::getRating)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(Math.max(allProducts.stream().filter(p -> p.getRating() != null).count(), 1)), 2, RoundingMode.HALF_UP);

        Long totalReviews = allProducts.stream()
                .filter(p -> p.getReviewsCount() != null)
                .mapToLong(Product::getReviewsCount)
                .sum();

        long highRatedProducts = allProducts.stream()
                .filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.0")) >= 0)
                .count();

        // Count products with sales
        long productsWithSales = allProducts.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .count();

        trends.put("totalProducts", totalProducts);
        trends.put("avgRating", avgRating);
        trends.put("totalReviews", totalReviews);
        trends.put("highRatedProducts", highRatedProducts);
        trends.put("highRatedPercentage", totalProducts > 0 ? (highRatedProducts * 100.0 / totalProducts) : 0);
        trends.put("productsWithSales", productsWithSales);

        return trends;
    }

    private ProductResponse convertToProductResponse(Product product) {
        return ProductResponse.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .description(product.getDescription())
                .price(product.getPrice())
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .ranking(product.getRanking())
                .noOfSellers(product.getNoOfSellers())
                .productLink(product.getProductLink())
                .imageUrl(product.getImageUrl())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ?  product.getCategory().getName() : null)
                .isBestseller(product.getIsBestseller())
                .salesCount(product.getSalesCount())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}