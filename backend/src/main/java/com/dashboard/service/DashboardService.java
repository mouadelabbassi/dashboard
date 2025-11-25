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

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        log.debug("Fetching dashboard stats");

        Long totalProducts = productRepository.countAllProducts();
        Long totalCategories = categoryRepository.count();
        BigDecimal avgPrice = productRepository.calculateAveragePrice();
        BigDecimal avgRating = productRepository.calculateAverageRating();
        Long totalReviews = productRepository.sumTotalReviews();
        BigDecimal totalRevenue = saleRepository.calculateTotalRevenue();
        Long totalSales = saleRepository.countCompletedSales();
        BigDecimal totalInventoryValue = productRepository.calculateTotalInventoryValue();

        if (avgPrice != null) {
            avgPrice = avgPrice.setScale(2, RoundingMode.HALF_UP);
        }
        if (avgRating != null) {
            avgRating = avgRating.setScale(1, RoundingMode.HALF_UP);
        }
        if (totalInventoryValue != null) {
            totalInventoryValue = totalInventoryValue.setScale(2, RoundingMode.HALF_UP);
        }

        return DashboardStatsResponse.builder()
                .totalProducts(totalProducts != null ? totalProducts : 0L)
                .totalCategories(totalCategories != null ? totalCategories : 0L)
                .avgPrice(avgPrice != null ? avgPrice : BigDecimal.ZERO)
                .avgRating(avgRating != null ? avgRating : BigDecimal.ZERO)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalSales(totalSales != null ? totalSales : 0L)
                .totalInventoryValue(totalInventoryValue != null ? totalInventoryValue : BigDecimal.ZERO)
                .build();
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardSummary() {
        log.debug("Fetching dashboard summary");

        Long totalProducts = productRepository.countAllProducts();
        Long totalCategories = categoryRepository.count();
        BigDecimal avgPrice = productRepository.calculateAveragePrice();
        BigDecimal avgRating = productRepository.calculateAverageRating();
        Long totalReviews = productRepository.sumTotalReviews();
        BigDecimal totalRevenue = saleRepository.calculateTotalRevenue();
        Long totalSales = saleRepository.countCompletedSales();

        if (avgPrice != null) {
            avgPrice = avgPrice.setScale(2, RoundingMode.HALF_UP);
        }
        if (avgRating != null) {
            avgRating = avgRating.setScale(1, RoundingMode.HALF_UP);
        }

        Product topProduct = productRepository.findTopProduct().orElse(null);
        ProductResponse topProductResponse = topProduct != null ? convertToProductResponse(topProduct) : null;

        return DashboardResponse.builder()
                .totalProducts(totalProducts != null ? totalProducts : 0L)
                .totalCategories(totalCategories != null ? totalCategories : 0L)
                .avgPrice(avgPrice != null ? avgPrice : BigDecimal.ZERO)
                .avgRating(avgRating != null ? avgRating : BigDecimal.ZERO)
                .totalReviews(totalReviews != null ? totalReviews : 0L)
                .topProduct(topProductResponse)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalSales(totalSales != null ? totalSales : 0L)
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getCategoryDistribution() {
        log.debug("Fetching category distribution");

        Map<String, Long> distribution = new LinkedHashMap<>();
        categoryRepository.findAll().stream()
                .sorted((a, b) -> Integer.compare(b.getProductCount(), a.getProductCount()))
                .forEach(category -> distribution.put(category.getName(), (long) category.getProductCount()));

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getPriceDistribution() {
        log.debug("Fetching price distribution");

        List<Product> products = productRepository.findAll();
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

        List<Product> products = productRepository.findAll();
        Map<String, Long> distribution = new LinkedHashMap<>();

        long fiveStars = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.5")) >= 0).count();
        long fourToFive = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.0")) >= 0 && p.getRating().compareTo(new BigDecimal("4.5")) < 0).count();
        long threeToFour = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("3.0")) >= 0 && p.getRating().compareTo(new BigDecimal("4.0")) < 0).count();
        long twoToThree = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("2.0")) >= 0 && p.getRating().compareTo(new BigDecimal("3.0")) < 0).count();
        long belowTwo = products.stream().filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("2.0")) < 0).count();

        distribution.put("★★★★★ (4.5+)", fiveStars);
        distribution.put("★★★★☆ (4.0-4.5)", fourToFive);
        distribution.put("★★★☆☆ (3.0-4.0)", threeToFour);
        distribution.put("★★☆☆☆ (2.0-3.0)", twoToThree);
        distribution.put("★☆☆☆☆ (<2.0)", belowTwo);

        return distribution;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenue() {
        log.debug("Fetching category revenue");

        List<Category> categories = categoryRepository.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Category category : categories) {
            List<Product> products = productRepository.findByCategoryId(category.getId());

            BigDecimal totalRevenue = products.stream()
                    .filter(p -> p.getPrice() != null && p.getReviewsCount() != null)
                    .map(p -> p.getPrice().multiply(new BigDecimal(Math.min(p.getReviewsCount() / 100, 1000))))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal avgPrice = products.stream()
                    .filter(p -> p.getPrice() != null)
                    .map(Product::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(new BigDecimal(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);

            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("name", category.getName());
            categoryData.put("productCount", category.getProductCount());
            categoryData.put("estimatedRevenue", totalRevenue.setScale(2, RoundingMode.HALF_UP));
            categoryData.put("avgPrice", avgPrice);

            result.add(categoryData);
        }

        result.sort((a, b) -> ((BigDecimal) b.get("estimatedRevenue")).compareTo((BigDecimal) a.get("estimatedRevenue")));

        return result;
    }

    @Transactional(readOnly = true)
    public List<ProductResponse> getTopBestsellers(int limit) {
        log.debug("Fetching top {} bestsellers", limit);

        return productRepository.findAll(PageRequest.of(0, limit, Sort.by(Sort.Direction.ASC, "ranking")))
                .getContent()
                .stream()
                .map(this::convertToProductResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getReviewsRankingCorrelation() {
        log.debug("Fetching reviews-ranking correlation data");

        List<Product> products = productRepository.findAll(PageRequest.of(0, 100, Sort.by(Sort.Direction.ASC, "ranking"))).getContent();

        return products.stream()
                .filter(p -> p.getReviewsCount() != null && p.getRanking() != null)
                .map(p -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("asin", p.getAsin());
                    point.put("name", p.getProductName().length() > 30 ? p.getProductName().substring(0, 30) + "..." : p.getProductName());
                    point.put("reviews", p.getReviewsCount());
                    point.put("ranking", p.getRanking());
                    point.put("rating", p.getRating());
                    point.put("price", p.getPrice());
                    point.put("category", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
                    return point;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesTrends() {
        log.debug("Fetching sales trends");

        Map<String, Object> trends = new HashMap<>();

        Long totalProducts = productRepository.countAllProducts();
        BigDecimal avgRating = productRepository.calculateAverageRating();
        Long totalReviews = productRepository.sumTotalReviews();

        long highRatedProducts = productRepository.findAll().stream()
                .filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.0")) >= 0)
                .count();

        long bestsellers = productRepository.findAll().stream()
                .filter(p -> p.getRanking() != null && p.getRanking() <= 100)
                .count();

        trends.put("totalProducts", totalProducts);
        trends.put("avgRating", avgRating != null ? avgRating.setScale(2, RoundingMode.HALF_UP) : 0);
        trends.put("totalReviews", totalReviews);
        trends.put("highRatedProducts", highRatedProducts);
        trends.put("highRatedPercentage", totalProducts > 0 ? (highRatedProducts * 100.0 / totalProducts) : 0);
        trends.put("bestsellersCount", bestsellers);

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
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .isBestseller(product.getIsBestseller())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}