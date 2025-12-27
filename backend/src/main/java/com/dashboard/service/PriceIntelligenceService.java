package com.dashboard.service;

import com.dashboard.dto.response.PriceIntelligenceResponse;
import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for price intelligence analysis.
 * Uses STATISTICAL analysis, NOT ML - due to insufficient price variation data.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PriceIntelligenceService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final SellerNotificationService notificationService;

    @Transactional(readOnly = true)
    public Page<PriceIntelligenceResponse> getAllPriceAnalysis(Pageable pageable) {
        log.debug("Fetching price intelligence for all products");

        Page<Product> products = productRepository.findAll(pageable);

        List<PriceIntelligenceResponse> analyses = products.getContent().stream()
                .map(this::analyzeProductPrice)
                .collect(Collectors.toList());

        return new PageImpl<>(analyses, pageable, products.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PriceIntelligenceResponse getProductPriceAnalysis(String productId) {
        log.debug("Fetching price analysis for product: {}", productId);

        Product product = productRepository.findByAsin(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", productId));

        return analyzeProductPrice(product);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryPriceStats(Long categoryId) {
        log.debug("Fetching price stats for category: {}", categoryId);

        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        List<Product> products = productRepository.findByCategory(category);

        if (products.isEmpty()) {
            return Map.of(
                    "categoryId", categoryId,
                    "categoryName", category.getName(),
                    "productCount", 0,
                    "message", "No products in this category"
            );
        }

        // Calculate statistics
        List<BigDecimal> prices = products.stream()
                .map(Product::getPrice)
                .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        if (prices.isEmpty()) {
            return Map.of(
                    "categoryId", categoryId,
                    "categoryName", category.getName(),
                    "productCount", products.size(),
                    "message", "No valid prices in this category"
            );
        }

        BigDecimal sum = prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal avg = sum.divide(new BigDecimal(prices.size()), 2, RoundingMode.HALF_UP);
        BigDecimal min = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
        BigDecimal max = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);

        // Calculate median
        prices.sort(BigDecimal::compareTo);
        BigDecimal median;
        int size = prices.size();
        if (size % 2 == 0) {
            median = prices.get(size / 2 - 1).add(prices.get(size / 2))
                    .divide(new BigDecimal("2"), 2, RoundingMode.HALF_UP);
        } else {
            median = prices.get(size / 2);
        }

        // Calculate standard deviation
        BigDecimal sumSquaredDiff = prices.stream()
                .map(p -> p.subtract(avg).pow(2))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal variance = sumSquaredDiff.divide(new BigDecimal(prices.size()), 4, RoundingMode.HALF_UP);
        double stdDev = Math.sqrt(variance.doubleValue());

        // Calculate percentiles
        BigDecimal p25 = prices.get((int) (prices.size() * 0.25));
        BigDecimal p75 = prices.get((int) (prices.size() * 0.75));

        Map<String, Object> stats = new HashMap<>();
        stats.put("categoryId", categoryId);
        stats.put("categoryName", category.getName());
        stats.put("productCount", products.size());
        stats.put("avgPrice", avg);
        stats.put("minPrice", min);
        stats.put("maxPrice", max);
        stats.put("medianPrice", median);
        stats.put("stdDeviation", BigDecimal.valueOf(stdDev).setScale(2, RoundingMode.HALF_UP));
        stats.put("percentile25", p25);
        stats.put("percentile75", p75);
        stats.put("sweetSpotMin", min.add(max.subtract(min).multiply(new BigDecimal("0.40"))));
        stats.put("sweetSpotMax", min.add(max.subtract(min).multiply(new BigDecimal("0.60"))));

        return stats;
    }

    /**
     * Analyze price for a single product.
     * Returns statistical analysis, NOT ML-based prediction.
     */
    private PriceIntelligenceResponse analyzeProductPrice(Product product) {
        // Get category stats
        BigDecimal categoryAvg = BigDecimal.ZERO;
        BigDecimal categoryMin = BigDecimal.ZERO;
        BigDecimal categoryMax = BigDecimal.ZERO;

        if (product.getCategory() != null) {
            List<Product> categoryProducts = productRepository.findByCategory(product.getCategory());

            List<BigDecimal> prices = categoryProducts.stream()
                    .map(Product::getPrice)
                    .filter(p -> p != null && p.compareTo(BigDecimal.ZERO) > 0)
                    .collect(Collectors.toList());

            if (!prices.isEmpty()) {
                categoryAvg = prices.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(new BigDecimal(prices.size()), 2, RoundingMode.HALF_UP);
                categoryMin = prices.stream().min(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
                categoryMax = prices.stream().max(BigDecimal::compareTo).orElse(BigDecimal.ZERO);
            }
        }

        // Handle case where we don't have good category data
        BigDecimal currentPrice = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;
        if (categoryMin.compareTo(BigDecimal.ZERO) == 0) {
            categoryMin = currentPrice.multiply(new BigDecimal("0.5"));
        }
        if (categoryMax.compareTo(BigDecimal.ZERO) == 0) {
            categoryMax = currentPrice.multiply(new BigDecimal("2.0"));
        }
        if (categoryAvg.compareTo(BigDecimal.ZERO) == 0) {
            categoryAvg = currentPrice;
        }

        String sellerName = null;
        Long sellerId = null;
        if (product.getSeller() != null) {
            sellerId = product.getSeller().getId();
            sellerName = product.getSeller().getStoreName() != null ?
                    product.getSeller().getStoreName() : product.getSeller().getFullName();
        }

        return PriceIntelligenceResponse.create(
                product.getAsin(),
                product.getProductName(),
                product.getCategory() != null ? product.getCategory().getName() : "Unknown",
                product.getImageUrl(),
                currentPrice,
                categoryAvg,
                categoryMin,
                categoryMax,
                sellerId,
                sellerName
        );
    }

    /**
     * Check all products for price opportunities and send notifications.
     */
    @Transactional
    public void checkPriceOpportunities() {
        log.info("Checking price opportunities for all seller products");

        List<Product> sellerProducts = productRepository.findAll().stream()
                .filter(p -> p.getSeller() != null)
                .collect(Collectors.toList());

        for (Product product : sellerProducts) {
            try {
                PriceIntelligenceResponse analysis = analyzeProductPrice(product);

                if (analysis.getShouldNotifySeller() && product.getSeller() != null) {
                    notificationService.sendPriceOpportunityAlert(
                            product.getSeller().getId(),
                            product.getAsin(),
                            analysis.getCurrentPrice(),
                            analysis.getRecommendedPrice(),
                            analysis.getPriceChangePercentage()
                    );
                }
            } catch (Exception e) {
                log.error("Error checking price for product {}: {}", product.getAsin(), e.getMessage());
            }
        }
    }
}