package com.dashboard.service;

import com.dashboard.dto.response.DashboardResponse;
import com.dashboard.dto.response.DashboardStatsResponse;
import com.dashboard.dto.response.ProductResponse;
import com.dashboard.entity.Product;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.SaleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
        BigDecimal totalInventoryValue = productRepository.calculateTotalInventoryValue(); // ADD THIS LINE

        // Round averages to 2 decimal places
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

        // Round averages to 2 decimal places
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

        Map<String, Long> distribution = new HashMap<>();
        categoryRepository.findAll().forEach(category ->
                distribution.put(category.getName(), (long) category.getProductCount())
        );

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getPriceDistribution() {
        log.debug("Fetching price distribution");

        List<Product> products = productRepository.findAll();
        Map<String, Long> distribution = new HashMap<>();

        long under25 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("25")) < 0).count();
        long range25to50 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("25")) >= 0 && p.getPrice().compareTo(new BigDecimal("50")) < 0).count();
        long range50to100 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("50")) >= 0 && p.getPrice().compareTo(new BigDecimal("100")) < 0).count();
        long over100 = products.stream().filter(p -> p.getPrice() != null && p.getPrice().compareTo(new BigDecimal("100")) >= 0).count();

        distribution.put("Under $25", under25);
        distribution.put("$25 - $50", range25to50);
        distribution.put("$50 - $100", range50to100);
        distribution.put("Over $100", over100);

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getRatingDistribution() {
        log.debug("Fetching rating distribution");

        List<Product> products = productRepository.findAll();
        Map<String, Long> distribution = new HashMap<>();

        for (int i = 1; i <= 5; i++) {
            final int rating = i;
            long count = products.stream()
                    .filter(p -> p.getRating() != null && p.getRating().intValue() == rating)
                    .count();
            distribution.put(rating + " Stars", count);
        }

        return distribution;
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