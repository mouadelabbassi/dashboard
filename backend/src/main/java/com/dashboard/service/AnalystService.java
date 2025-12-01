package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalystService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final SellerRevenueRepository sellerRevenueRepository;
    private final PlatformRevenueRepository platformRevenueRepository;
    private final OrderItemRepository orderItemRepository;

    // ==================== DASHBOARD ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getDashboardData() {
        Map<String, Object> dashboard = new HashMap<>();

        dashboard.put("kpis", getKPIs());
        dashboard.put("salesTrend", getSalesTrends("daily", 30));
        dashboard.put("topCategories", getSalesByCategory().stream().limit(5).collect(Collectors.toList()));
        dashboard.put("recentOrders", getRecentOrders(5));

        return dashboard;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getKPIs() {
        Map<String, Object> kpis = new HashMap<>();

        // Total Revenue
        BigDecimal totalRevenue = calculateTotalRevenue();
        BigDecimal previousRevenue = calculatePreviousPeriodRevenue(30);
        double revenueGrowth = calculateGrowthPercentage(previousRevenue, totalRevenue);

        kpis.put("totalRevenue", Map.of(
                "value", totalRevenue,
                "growth", revenueGrowth,
                "trend", revenueGrowth >= 0 ? "up" : "down"
        ));

        // Total Orders
        long totalOrders = orderRepository.count();
        long previousOrders = countPreviousPeriodOrders(30);
        double ordersGrowth = calculateGrowthPercentage((double) previousOrders, (double) totalOrders);

        kpis.put("totalOrders", Map.of(
                "value", totalOrders,
                "growth", ordersGrowth,
                "trend", ordersGrowth >= 0 ? "up" : "down"
        ));

        // Total Products
        long totalProducts = productRepository.countByApprovalStatus(Product.ApprovalStatus.APPROVED);
        kpis.put("totalProducts", Map.of(
                "value", totalProducts,
                "growth", 0,
                "trend", "stable"
        ));

        // Total Sellers
        long totalSellers = userRepository.countByRole(User.Role.SELLER);
        long previousSellers = countPreviousPeriodSellers(30);
        double sellersGrowth = calculateGrowthPercentage((double) previousSellers, (double) totalSellers);

        kpis.put("totalSellers", Map.of(
                "value", totalSellers,
                "growth", sellersGrowth,
                "trend", sellersGrowth >= 0 ? "up" : "down"
        ));

        // Average Order Value
        BigDecimal avgOrderValue = calculateAverageOrderValue();
        kpis.put("avgOrderValue", Map.of(
                "value", avgOrderValue,
                "growth", 0,
                "trend", "stable"
        ));

        // Total Buyers
        long totalBuyers = userRepository.countByRole(User.Role.BUYER);
        kpis.put("totalBuyers", Map.of(
                "value", totalBuyers,
                "growth", 0,
                "trend", "stable"
        ));

        return kpis;
    }

    // ==================== SALES ANALYTICS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesOverview(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        Map<String, Object> overview = new HashMap<>();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

        // Get orders in period
        List<Order> orders = orderRepository.findByCreatedAtBetween(start, end);
        List<Order> confirmedOrders = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        BigDecimal totalRevenue = confirmedOrders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalItems = confirmedOrders.stream()
                .mapToInt(Order::getTotalItems)
                .sum();

        overview.put("totalRevenue", totalRevenue);
        overview.put("totalOrders", confirmedOrders.size());
        overview.put("totalItems", totalItems);
        overview.put("avgOrderValue", confirmedOrders.isEmpty() ? BigDecimal.ZERO :
                totalRevenue.divide(BigDecimal.valueOf(confirmedOrders.size()), 2, RoundingMode.HALF_UP));
        overview.put("period", Map.of("start", startDate, "end", endDate));

        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSalesTrends(String period, int days) {
        List<Map<String, Object>> trends = new ArrayList<>();
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(days);

        // Get all orders in the period
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay()
        );

        // Filter confirmed orders
        List<Order> confirmedOrders = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        // Group by date
        Map<LocalDate, List<Order>> ordersByDate = confirmedOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        // Fill in all dates
        for (LocalDate date = startDate; ! date.isAfter(endDate); date = date.plusDays(1)) {
            List<Order> dayOrders = ordersByDate.getOrDefault(date, Collections.emptyList());

            BigDecimal revenue = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            Map<String, Object> point = new HashMap<>();
            point.put("date", date.toString());
            point.put("revenue", revenue);
            point.put("orders", dayOrders.size());
            point.put("items", dayOrders.stream().mapToInt(Order::getTotalItems).sum());

            trends.add(point);
        }

        return trends;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSalesByCategory() {
        List<Map<String, Object>> result = new ArrayList<>();

        List<Category> categories = categoryRepository.findAll();

        for (Category category : categories) {
            List<Product> products = productRepository.findByCategory(category);

            BigDecimal totalRevenue = BigDecimal.ZERO;
            int totalSold = 0;

            for (Product product : products) {
                int salesCount = product.getSalesCount() != null ?  product.getSalesCount() : 0;
                BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;

                totalRevenue = totalRevenue.add(price.multiply(BigDecimal.valueOf(salesCount)));
                totalSold += salesCount;
            }

            if (totalSold > 0 || ! products.isEmpty()) {
                Map<String, Object> categoryData = new HashMap<>();
                categoryData.put("categoryId", category.getId());
                categoryData.put("categoryName", category.getName());
                categoryData.put("productCount", products.size());
                categoryData.put("revenue", totalRevenue);
                categoryData.put("unitsSold", totalSold);

                result.add(categoryData);
            }
        }

        // Sort by revenue descending
        result.sort((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")));

        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTopSellingProducts(int limit) {
        List<Product> products = productRepository.findAll();

        return products.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .sorted((a, b) -> b.getSalesCount().compareTo(a.getSalesCount()))
                .limit(limit)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("asin", p.getAsin());
                    data.put("productName", p.getProductName());
                    data.put("price", p.getPrice());
                    data.put("salesCount", p.getSalesCount());
                    data.put("revenue", p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())));
                    data.put("rating", p.getRating());
                    data.put("categoryName", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
                    data.put("imageUrl", p.getImageUrl());
                    return data;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesGrowth() {
        Map<String, Object> growth = new HashMap<>();

        LocalDate today = LocalDate.now();

        // This week vs last week
        BigDecimal thisWeekRevenue = getRevenueForPeriod(today.minusDays(7), today);
        BigDecimal lastWeekRevenue = getRevenueForPeriod(today.minusDays(14), today.minusDays(7));
        double weeklyGrowth = calculateGrowthPercentage(lastWeekRevenue, thisWeekRevenue);

        // This month vs last month
        BigDecimal thisMonthRevenue = getRevenueForPeriod(today.minusDays(30), today);
        BigDecimal lastMonthRevenue = getRevenueForPeriod(today.minusDays(60), today.minusDays(30));
        double monthlyGrowth = calculateGrowthPercentage(lastMonthRevenue, thisMonthRevenue);

        growth.put("weekly", Map.of(
                "current", thisWeekRevenue,
                "previous", lastWeekRevenue,
                "growth", weeklyGrowth
        ));

        growth.put("monthly", Map.of(
                "current", thisMonthRevenue,
                "previous", lastMonthRevenue,
                "growth", monthlyGrowth
        ));

        return growth;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPeakSalesTimes() {
        List<Map<String, Object>> peakTimes = new ArrayList<>();

        // Get all confirmed orders
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        // Group by day of week
        String[] days = {"Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"};
        Map<Integer, Integer> ordersByDay = new HashMap<>();

        for (Order order : orders) {
            int dayOfWeek = order.getCreatedAt().getDayOfWeek().getValue();
            ordersByDay.merge(dayOfWeek, 1, Integer::sum);
        }

        for (int i = 1; i <= 7; i++) {
            Map<String, Object> dayData = new HashMap<>();
            dayData.put("day", days[i - 1]);
            dayData.put("dayIndex", i);
            dayData.put("orders", ordersByDay.getOrDefault(i, 0));
            peakTimes.add(dayData);
        }

        return peakTimes;
    }

    // ==================== PRODUCT ANALYTICS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getProductsOverview() {
        Map<String, Object> overview = new HashMap<>();

        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        overview.put("totalProducts", products.size());

        // Average price
        BigDecimal avgPrice = products.stream()
                .filter(p -> p.getPrice() != null)
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);
        overview.put("avgPrice", avgPrice);

        // Average rating
        double avgRating = products.stream()
                .filter(p -> p.getRating() != null)
                .mapToDouble(p -> p.getRating().doubleValue())
                .average()
                .orElse(0.0);
        overview.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

        // Total reviews
        long totalReviews = products.stream()
                .filter(p -> p.getReviewsCount() != null)
                .mapToLong(Product::getReviewsCount)
                .sum();
        overview.put("totalReviews", totalReviews);

        // Total inventory value
        BigDecimal inventoryValue = products.stream()
                .filter(p -> p.getPrice() != null && p.getStockQuantity() != null)
                .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getStockQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("inventoryValue", inventoryValue);

        // Low stock count
        long lowStockCount = products.stream()
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < 10)
                .count();
        overview.put("lowStockCount", lowStockCount);

        // Out of stock count
        long outOfStockCount = products.stream()
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() == 0)
                .count();
        overview.put("outOfStockCount", outOfStockCount);

        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getProductPerformance(int limit) {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        return products.stream()
                .filter(p -> p.getPrice() != null && p.getRating() != null)
                .limit(limit)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("asin", p.getAsin());
                    data.put("name", p.getProductName().length() > 30 ?
                            p.getProductName().substring(0, 30) + "..." : p.getProductName());
                    data.put("price", p.getPrice());
                    data.put("rating", p.getRating());
                    data.put("sales", p.getSalesCount() != null ? p.getSalesCount() : 0);
                    data.put("reviews", p.getReviewsCount() != null ? p.getReviewsCount() : 0);
                    data.put("category", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
                    return data;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getPriceDistribution() {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("$0-$10", products.stream().filter(p -> p.getPrice() != null &&
                p.getPrice().compareTo(BigDecimal.TEN) <= 0).count());
        distribution.put("$10-$25", products.stream().filter(p -> p.getPrice() != null &&
                p.getPrice().compareTo(BigDecimal.TEN) > 0 &&
                p.getPrice().compareTo(new BigDecimal("25")) <= 0).count());
        distribution.put("$25-$50", products.stream().filter(p -> p.getPrice() != null &&
                p.getPrice().compareTo(new BigDecimal("25")) > 0 &&
                p.getPrice().compareTo(new BigDecimal("50")) <= 0).count());
        distribution.put("$50-$100", products.stream().filter(p -> p.getPrice() != null &&
                p.getPrice().compareTo(new BigDecimal("50")) > 0 &&
                p.getPrice().compareTo(new BigDecimal("100")) <= 0).count());
        distribution.put("$100+", products.stream().filter(p -> p.getPrice() != null &&
                p.getPrice().compareTo(new BigDecimal("100")) > 0).count());

        return distribution;
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getRatingDistribution() {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("★★★★★ (4.5+)", products.stream().filter(p -> p.getRating() != null &&
                p.getRating().compareTo(new BigDecimal("4.5")) >= 0).count());
        distribution.put("★★★★☆ (4.0-4.5)", products.stream().filter(p -> p.getRating() != null &&
                p.getRating().compareTo(new BigDecimal("4.0")) >= 0 &&
                p.getRating().compareTo(new BigDecimal("4.5")) < 0).count());
        distribution.put("★★★☆☆ (3.0-4.0)", products.stream().filter(p -> p.getRating() != null &&
                p.getRating().compareTo(new BigDecimal("3.0")) >= 0 &&
                p.getRating().compareTo(new BigDecimal("4.0")) < 0).count());
        distribution.put("★★☆☆☆ (2.0-3.0)", products.stream().filter(p -> p.getRating() != null &&
                p.getRating().compareTo(new BigDecimal("2.0")) >= 0 &&
                p.getRating().compareTo(new BigDecimal("3.0")) < 0).count());
        distribution.put("★☆☆☆☆ (<2.0)", products.stream().filter(p -> p.getRating() != null &&
                p.getRating().compareTo(new BigDecimal("2.0")) < 0).count());

        return distribution;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getLowStockProducts(int threshold) {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        return products.stream()
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() <= threshold)
                .sorted(Comparator.comparingInt(Product::getStockQuantity))
                .limit(20)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("asin", p.getAsin());
                    data.put("productName", p.getProductName());
                    data.put("stockQuantity", p.getStockQuantity());
                    data.put("price", p.getPrice());
                    data.put("imageUrl", p.getImageUrl());
                    data.put("status", p.getStockQuantity() == 0 ? "OUT_OF_STOCK" : "LOW_STOCK");
                    return data;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getBestsellerTrends() {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        return products.stream()
                .filter(p -> p.getIsBestseller() != null && p.getIsBestseller())
                .sorted((a, b) -> {
                    int rankA = a.getRanking() != null ? a.getRanking() : Integer.MAX_VALUE;
                    int rankB = b.getRanking() != null ?  b.getRanking() : Integer.MAX_VALUE;
                    return Integer.compare(rankA, rankB);
                })
                .limit(10)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("asin", p.getAsin());
                    data.put("productName", p.getProductName());
                    data.put("ranking", p.getRanking());
                    data.put("salesCount", p.getSalesCount());
                    data.put("rating", p.getRating());
                    data.put("category", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
                    return data;
                })
                .collect(Collectors.toList());
    }

    // ==================== SELLER ANALYTICS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getSellersOverview() {
        Map<String, Object> overview = new HashMap<>();

        List<User> sellers = userRepository.findAllByRole(User.Role.SELLER);

        overview.put("totalSellers", sellers.size());
        overview.put("verifiedSellers", sellers.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsVerifiedSeller()))
                .count());
        overview.put("activeSellers", sellers.stream()
                .filter(s -> Boolean.TRUE.equals(s.getIsActive()))
                .count());

        // Total seller revenue
        BigDecimal totalSellerRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getGrossAmount() != null ? sr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("totalSellerRevenue", totalSellerRevenue);

        // Platform commission
        BigDecimal platformCommission = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getPlatformFee() != null ? sr.getPlatformFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("platformCommission", platformCommission);

        // Seller products count
        long sellerProducts = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .filter(p -> p.getSeller() != null)
                .count();
        overview.put("sellerProducts", sellerProducts);

        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSellersRanking(int limit) {
        List<Object[]> topSellers = sellerRevenueRepository.getTopSellersByRevenue(Pageable.ofSize(limit));

        List<Map<String, Object>> ranking = new ArrayList<>();
        int rank = 1;

        for (Object[] row : topSellers) {
            Map<String, Object> seller = new HashMap<>();
            seller.put("rank", rank++);
            seller.put("sellerId", row[0]);
            seller.put("sellerName", row[1] != null ? row[1].toString() : "Unknown");
            seller.put("storeName", row[2] != null ? row[2].toString() : "No Store Name");
            seller.put("totalRevenue", row[3] != null ?  ((BigDecimal) row[3]).doubleValue() : 0.0);
            seller.put("productsSold", row[4] != null ? ((Long) row[4]).intValue() : 0);
            seller.put("totalOrders", row[5] != null ? ((Long) row[5]).intValue() : 0);
            ranking.add(seller);
        }

        return ranking;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSellerGrowth() {
        List<Map<String, Object>> growth = new ArrayList<>();

        List<User> sellers = userRepository.findAllByRole(User. Role.SELLER);

        // Group by creation month (last 6 months)
        LocalDate sixMonthsAgo = LocalDate.now().minusMonths(6);

        for (int i = 0; i < 6; i++) {
            LocalDate monthStart = sixMonthsAgo.plusMonths(i);
            LocalDate monthEnd = monthStart.plusMonths(1);

            long count = sellers.stream()
                    .filter(s -> s.getCreatedAt() != null &&
                            s.getCreatedAt().toLocalDate().isAfter(monthStart.minusDays(1)) &&
                            s.getCreatedAt().toLocalDate().isBefore(monthEnd))
                    .count();

            Map<String, Object> data = new HashMap<>();
            data.put("month", monthStart.getMonth().toString().substring(0, 3));
            data.put("year", monthStart.getYear());
            data.put("newSellers", count);
            growth.add(data);
        }

        return growth;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPlatformVsSellersComparison() {
        Map<String, Object> comparison = new HashMap<>();

        // Platform (MouadVision) stats
        BigDecimal platformRevenue = platformRevenueRepository.findAll().stream()
                .filter(pr -> pr.getRevenueType() == PlatformRevenue.RevenueType.DIRECT_SALE)
                .map(PlatformRevenue::getGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long platformProducts = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .filter(p -> p.getSeller() == null)
                .count();

        int platformSales = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .filter(p -> p.getSeller() == null && p.getSalesCount() != null)
                .mapToInt(Product::getSalesCount)
                .sum();

        comparison.put("platform", Map.of(
                "name", "MouadVision",
                "revenue", platformRevenue,
                "products", platformProducts,
                "sales", platformSales
        ));

        // Sellers stats
        BigDecimal sellersRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getGrossAmount() != null ? sr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long sellersProducts = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .filter(p -> p.getSeller() != null)
                .count();

        int sellersSales = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .filter(p -> p.getSeller() != null && p.getSalesCount() != null)
                .mapToInt(Product::getSalesCount)
                .sum();

        comparison.put("sellers", Map.of(
                "name", "All Sellers",
                "revenue", sellersRevenue,
                "products", sellersProducts,
                "sales", sellersSales
        ));

        // Percentages
        BigDecimal totalRevenue = platformRevenue.add(sellersRevenue);
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            comparison.put("platformShare", platformRevenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")));
            comparison.put("sellersShare", sellersRevenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")));
        }

        return comparison;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSellerDetails(Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        Map<String, Object> details = new HashMap<>();
        details.put("id", seller.getId());
        details.put("name", seller.getFullName());
        details.put("storeName", seller.getStoreName());
        details.put("email", seller.getEmail());
        details.put("isVerified", seller.getIsVerifiedSeller());
        details.put("joinedAt", seller.getCreatedAt());

        // Products
        List<Product> products = productRepository.findBySeller(seller);
        details.put("totalProducts", products.size());
        details.put("approvedProducts", products.stream()
                .filter(p -> p.getApprovalStatus() == Product.ApprovalStatus.APPROVED)
                .count());

        // Revenue
        BigDecimal totalRevenue = sellerRevenueRepository.calculateTotalRevenueBySeller(seller);
        details.put("totalRevenue", totalRevenue != null ? totalRevenue : BigDecimal.ZERO);

        // Top products
        details.put("topProducts", products.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .sorted((a, b) -> b.getSalesCount().compareTo(a.getSalesCount()))
                .limit(5)
                .map(p -> Map.of(
                        "asin", p.getAsin(),
                        "name", p.getProductName(),
                        "sales", p.getSalesCount()
                ))
                .collect(Collectors.toList()));

        return details;
    }

    // ==================== CATEGORY ANALYTICS ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoriesOverview() {
        List<Category> categories = categoryRepository.findAll();

        return categories.stream()
                .map(c -> {
                    List<Product> products = productRepository.findByCategory(c);

                    Map<String, Object> data = new HashMap<>();
                    data.put("id", c.getId());
                    data.put("name", c.getName());
                    data.put("productCount", products.size());

                    // Average price
                    BigDecimal avgPrice = products.stream()
                            .filter(p -> p.getPrice() != null)
                            .map(Product::getPrice)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);
                    data.put("avgPrice", avgPrice);

                    // Average rating
                    double avgRating = products.stream()
                            .filter(p -> p.getRating() != null)
                            .mapToDouble(p -> p.getRating().doubleValue())
                            .average()
                            .orElse(0.0);
                    data.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

                    // Total sales
                    int totalSales = products.stream()
                            .filter(p -> p.getSalesCount() != null)
                            .mapToInt(Product::getSalesCount)
                            .sum();
                    data.put("totalSales", totalSales);

                    // Revenue
                    BigDecimal revenue = products.stream()
                            .filter(p -> p.getPrice() != null && p.getSalesCount() != null)
                            .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    data.put("revenue", revenue);

                    return data;
                })
                .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getCategoryMetrics(Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", categoryId));

        List<Product> products = productRepository.findByCategory(category);

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("id", category.getId());
        metrics.put("name", category.getName());
        metrics.put("productCount", products.size());

        // Price statistics
        if (! products.isEmpty()) {
            List<BigDecimal> prices = products.stream()
                    .filter(p -> p.getPrice() != null)
                    .map(Product::getPrice)
                    .sorted()
                    .collect(Collectors.toList());

            if (!prices.isEmpty()) {
                metrics.put("minPrice", prices.get(0));
                metrics.put("maxPrice", prices.get(prices.size() - 1));
                metrics.put("avgPrice", prices.stream()
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .divide(BigDecimal.valueOf(prices.size()), 2, RoundingMode.HALF_UP));
            }
        }

        // Best rated product
        products.stream()
                .filter(p -> p.getRating() != null)
                .max(Comparator.comparing(Product::getRating))
                .ifPresent(p -> metrics.put("bestRated", Map.of(
                        "asin", p.getAsin(),
                        "name", p.getProductName(),
                        "rating", p.getRating()
                )));

        // Best selling product
        products.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .max(Comparator.comparing(Product::getSalesCount))
                .ifPresent(p -> metrics.put("bestSelling", Map.of(
                        "asin", p.getAsin(),
                        "name", p.getProductName(),
                        "sales", p.getSalesCount()
                )));

        // Rating distribution
        Map<String, Long> ratingDist = new LinkedHashMap<>();
        ratingDist.put("5 stars", products.stream()
                .filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("4.5")) >= 0)
                .count());
        ratingDist.put("4 stars", products.stream()
                .filter(p -> p.getRating() != null &&
                        p.getRating().compareTo(new BigDecimal("3.5")) >= 0 &&
                        p.getRating().compareTo(new BigDecimal("4.5")) < 0)
                .count());
        ratingDist.put("3 stars", products.stream()
                .filter(p -> p.getRating() != null &&
                        p.getRating().compareTo(new BigDecimal("2.5")) >= 0 &&
                        p.getRating().compareTo(new BigDecimal("3.5")) < 0)
                .count());
        ratingDist.put("2 stars", products.stream()
                .filter(p -> p.getRating() != null &&
                        p.getRating().compareTo(new BigDecimal("1.5")) >= 0 &&
                        p.getRating().compareTo(new BigDecimal("2.5")) < 0)
                .count());
        ratingDist.put("1 star", products.stream()
                .filter(p -> p.getRating() != null && p.getRating().compareTo(new BigDecimal("1.5")) < 0)
                .count());
        metrics.put("ratingDistribution", ratingDist);

        return metrics;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryComparison() {
        return getCategoriesOverview();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenueContribution() {
        List<Map<String, Object>> categories = getCategoriesOverview();

        BigDecimal totalRevenue = categories.stream()
                .map(c -> (BigDecimal) c.get("revenue"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return categories.stream()
                .map(c -> {
                    BigDecimal revenue = (BigDecimal) c.get("revenue");
                    double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0 ?
                            revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                                    .multiply(new BigDecimal("100")).doubleValue() : 0;

                    Map<String, Object> data = new HashMap<>(c);
                    data.put("percentage", Math.round(percentage * 10.0) / 10.0);
                    return data;
                })
                .collect(Collectors.toList());
    }

    // ==================== REPORTS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getReportSummary(LocalDate startDate, LocalDate endDate) {
        Map<String, Object> summary = new HashMap<>();

        summary.put("period", Map.of("start", startDate, "end", endDate));
        summary.put("sales", getSalesOverview(startDate, endDate));
        summary.put("topProducts", getTopSellingProducts(10));
        summary.put("categories", getSalesByCategory());
        summary.put("growth", getSalesGrowth());

        return summary;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> exportSalesData(LocalDate startDate, LocalDate endDate) {
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay()
        );

        return orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .map(o -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("orderNumber", o.getOrderNumber());
                    data.put("date", o.getCreatedAt().toLocalDate());
                    data.put("customerName", o.getUser().getFullName());
                    data.put("customerEmail", o.getUser().getEmail());
                    data.put("totalAmount", o.getTotalAmount());
                    data.put("totalItems", o.getTotalItems());
                    data.put("status", o.getStatus().name());
                    return data;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> exportProductsData() {
        return productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED)
                .stream()
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("asin", p.getAsin());
                    data.put("productName", p.getProductName());
                    data.put("category", p.getCategory() != null ? p.getCategory().getName() : "Unknown");
                    data.put("price", p.getPrice());
                    data.put("rating", p.getRating());
                    data.put("reviewsCount", p.getReviewsCount());
                    data.put("salesCount", p.getSalesCount());
                    data.put("stockQuantity", p.getStockQuantity());
                    data.put("seller", p.getSeller() != null ?  p.getSeller().getFullName() : "MouadVision");
                    return data;
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> exportSellersData() {
        return getSellersRanking(100);
    }

    // ==================== HELPER METHODS ====================

    private BigDecimal calculateTotalRevenue() {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        return orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal calculatePreviousPeriodRevenue(int days) {
        LocalDate endDate = LocalDate.now().minusDays(days);
        LocalDate startDate = endDate.minusDays(days);
        return getRevenueForPeriod(startDate, endDate);
    }

    private BigDecimal getRevenueForPeriod(LocalDate startDate, LocalDate endDate) {
        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay()
        );

        return orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private long countPreviousPeriodOrders(int days) {
        LocalDate endDate = LocalDate.now().minusDays(days);
        LocalDate startDate = endDate.minusDays(days);

        return orderRepository.findByCreatedAtBetween(
                        startDate.atStartOfDay(),
                        endDate.plusDays(1).atStartOfDay()
                ).stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .count();
    }

    private long countPreviousPeriodSellers(int days) {
        LocalDate cutoffDate = LocalDate.now().minusDays(days);

        return userRepository.findAllByRole(User.Role.SELLER).stream()
                .filter(s -> s.getCreatedAt() != null &&
                        s.getCreatedAt().toLocalDate().isBefore(cutoffDate))
                .count();
    }

    private BigDecimal calculateAverageOrderValue() {
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        if (orders.isEmpty()) return BigDecimal.ZERO;

        BigDecimal total = orders.stream()
                .map(Order::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return total.divide(BigDecimal.valueOf(orders.size()), 2, RoundingMode.HALF_UP);
    }

    private double calculateGrowthPercentage(BigDecimal previous, BigDecimal current) {
        if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
            return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? 100.0 : 0.0;
        }
        return current.subtract(previous)
                .divide(previous, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .doubleValue();
    }

    private double calculateGrowthPercentage(Double previous, Double current) {
        if (previous == null || previous == 0) {
            return current != null && current > 0 ? 100.0 : 0.0;
        }
        return ((current - previous) / previous) * 100;
    }

    private List<Map<String, Object>> getRecentOrders(int limit) {
        return orderRepository.findRecentOrders(Pageable.ofSize(limit))
                .stream()
                .map(o -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("orderNumber", o.getOrderNumber());
                    data.put("customer", o.getUser().getFullName());
                    data.put("amount", o.getTotalAmount());
                    data.put("status", o.getStatus().name());
                    data.put("date", o.getCreatedAt());
                    return data;
                })
                .collect(Collectors.toList());
    }
}