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
                "trend", revenueGrowth >= 0 ? "up" :  "down"
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

    // ==================== ADVANCED REPORT DATA ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getAdvancedReportData() {
        Map<String, Object> reportData = new HashMap<>();

        // Platform Revenue Overview
        reportData.put("platformRevenue", getPlatformRevenueOverview());

        // Top 3 Best Sellers
        reportData.put("top3Sellers", getTop3BestSellers());

        // Top 3 Categories by Revenue
        reportData.put("top3Categories", getTop3CategoriesByRevenue());

        // Top 10 Most Sold Products
        reportData.put("mostSoldProducts", getMostSoldProducts(10));

        // Monthly Revenue Trend (last 12 months)
        reportData.put("monthlyRevenueTrend", getMonthlyRevenueTrend());

        // Category Revenue Distribution
        reportData.put("categoryRevenueDistribution", getCategoryRevenueDistribution());

        // Sales Performance Metrics
        reportData.put("salesPerformance", getSalesPerformanceMetrics());

        // Order Status Distribution
        reportData.put("orderStatusDistribution", getOrderStatusDistribution());

        // Weekly Sales Trend
        reportData.put("weeklySalesTrend", getWeeklySalesTrend());

        // KPIs
        reportData.put("kpis", getKPIs());

        return reportData;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getPlatformRevenueOverview() {
        Map<String, Object> overview = new HashMap<>();

        // Total Platform Revenue
        BigDecimal totalRevenue = calculateTotalRevenue();
        overview.put("totalRevenue", totalRevenue);

        // Platform Direct Sales Revenue
        BigDecimal platformDirectRevenue = platformRevenueRepository.findAll().stream()
                .filter(pr -> pr.getRevenueType() == PlatformRevenue.RevenueType.DIRECT_SALE)
                .map(pr -> pr.getGrossAmount() != null ? pr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("directSalesRevenue", platformDirectRevenue);

        // Commission Revenue from Sellers
        BigDecimal commissionRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getPlatformFee() != null ? sr.getPlatformFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("commissionRevenue", commissionRevenue);

        // Seller Generated Revenue
        BigDecimal sellerRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getGrossAmount() != null ? sr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("sellerRevenue", sellerRevenue);

        // Total Orders
        long totalOrders = orderRepository.count();
        overview.put("totalOrders", totalOrders);

        // Completed Orders
        long completedOrders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED)
                .count();
        overview.put("completedOrders", completedOrders);

        // Average Order Value
        overview.put("avgOrderValue", calculateAverageOrderValue());

        // Growth Metrics
        BigDecimal previousMonthRevenue = calculatePreviousPeriodRevenue(30);
        double revenueGrowth = calculateGrowthPercentage(previousMonthRevenue, totalRevenue);
        overview.put("revenueGrowth", revenueGrowth);

        // This Month Revenue
        BigDecimal thisMonthRevenue = getRevenueForPeriod(LocalDate.now().withDayOfMonth(1), LocalDate.now());
        overview.put("thisMonthRevenue", thisMonthRevenue);

        // Last Month Revenue
        LocalDate lastMonthStart = LocalDate.now().minusMonths(1).withDayOfMonth(1);
        LocalDate lastMonthEnd = LocalDate.now().withDayOfMonth(1).minusDays(1);
        BigDecimal lastMonthRevenue = getRevenueForPeriod(lastMonthStart, lastMonthEnd);
        overview.put("lastMonthRevenue", lastMonthRevenue);

        return overview;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTop3BestSellers() {
        List<Object[]> topSellers = sellerRevenueRepository.getTopSellersByRevenue(Pageable.ofSize(3));

        List<Map<String, Object>> result = new ArrayList<>();
        int rank = 1;

        for (Object[] row : topSellers) {
            Map<String, Object> seller = new HashMap<>();
            seller.put("rank", rank++);
            seller.put("sellerId", row[0]);
            seller.put("sellerName", row[1] != null ? row[1].toString() : "Unknown");
            seller.put("storeName", row[2] != null ? row[2].toString() : "No Store Name");
            seller.put("totalRevenue", row[3] != null ? ((BigDecimal) row[3]).doubleValue() : 0.0);
            seller.put("productsSold", row[4] != null ? ((Long) row[4]).intValue() : 0);
            seller.put("totalOrders", row[5] != null ? ((Long) row[5]).intValue() : 0);

            // Calculate average order value for this seller
            double avgOrderValue = seller.get("totalOrders") != null && (int) seller.get("totalOrders") > 0
                    ? (double) seller.get("totalRevenue") / (int) seller.get("totalOrders")
                    : 0.0;
            seller.put("avgOrderValue", avgOrderValue);

            // Get seller's product count
            Long sellerId = row[0] != null ? ((Number) row[0]).longValue() : null;
            if (sellerId != null) {
                User sellerUser = userRepository.findById(sellerId).orElse(null);
                if (sellerUser != null) {
                    long productCount = productRepository.findBySeller(sellerUser).stream()
                            .filter(p -> p.getApprovalStatus() == Product.ApprovalStatus.APPROVED)
                            .count();
                    seller.put("productCount", productCount);
                }
            }

            result.add(seller);
        }

        // If we don't have enough sellers from revenue, supplement with sellers who have products
        if (result.size() < 3) {
            List<User> allSellers = userRepository.findAllByRole(User.Role.SELLER);
            for (User s : allSellers) {
                if (result.size() >= 3) break;
                boolean alreadyIncluded = result.stream()
                        .anyMatch(r -> r.get("sellerId") != null && r.get("sellerId").equals(s.getId()));
                if (!alreadyIncluded) {
                    List<Product> sellerProducts = productRepository.findBySeller(s);
                    int totalSales = sellerProducts.stream()
                            .filter(p -> p.getSalesCount() != null)
                            .mapToInt(Product::getSalesCount)
                            .sum();
                    BigDecimal revenue = sellerProducts.stream()
                            .filter(p -> p.getPrice() != null && p.getSalesCount() != null)
                            .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> seller = new HashMap<>();
                    seller.put("rank", result.size() + 1);
                    seller.put("sellerId", s.getId());
                    seller.put("sellerName", s.getFullName());
                    seller.put("storeName", s.getStoreName() != null ? s.getStoreName() : "No Store Name");
                    seller.put("totalRevenue", revenue.doubleValue());
                    seller.put("productsSold", totalSales);
                    seller.put("totalOrders", 0);
                    seller.put("productCount", sellerProducts.size());
                    seller.put("avgOrderValue", 0.0);

                    result.add(seller);
                }
            }
        }

        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getTop3CategoriesByRevenue() {
        List<Category> categories = categoryRepository.findAll();

        List<Map<String, Object>> categoryRevenues = new ArrayList<>();

        for (Category category : categories) {
            List<Product> products = productRepository.findByCategory(category);

            BigDecimal totalRevenue = BigDecimal.ZERO;
            int totalSold = 0;
            int productCount = products.size();

            for (Product product : products) {
                int salesCount = product.getSalesCount() != null ? product.getSalesCount() : 0;
                BigDecimal price = product.getPrice() != null ? product.getPrice() : BigDecimal.ZERO;

                totalRevenue = totalRevenue.add(price.multiply(BigDecimal.valueOf(salesCount)));
                totalSold += salesCount;
            }

            // Calculate average price
            BigDecimal avgPrice = productCount > 0
                    ? products.stream()
                    .filter(p -> p.getPrice() != null)
                    .map(Product::getPrice)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .divide(BigDecimal.valueOf(productCount), 2, RoundingMode.HALF_UP)
                    :  BigDecimal.ZERO;

            // Calculate average rating
            double avgRating = products.stream()
                    .filter(p -> p.getRating() != null)
                    .mapToDouble(p -> p.getRating().doubleValue())
                    .average()
                    .orElse(0.0);

            Map<String, Object> categoryData = new HashMap<>();
            categoryData.put("categoryId", category.getId());
            categoryData.put("categoryName", category.getName());
            categoryData.put("productCount", productCount);
            categoryData.put("revenue", totalRevenue);
            categoryData.put("unitsSold", totalSold);
            categoryData.put("avgPrice", avgPrice);
            categoryData.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

            categoryRevenues.add(categoryData);
        }

        // Sort by revenue descending and return top 3
        return categoryRevenues.stream()
                .sorted((a, b) -> ((BigDecimal) b.get("revenue")).compareTo((BigDecimal) a.get("revenue")))
                .limit(3)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMostSoldProducts(int limit) {
        List<Product> products = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        return products.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .sorted((a, b) -> b.getSalesCount().compareTo(a.getSalesCount()))
                .limit(limit)
                .map(p -> {
                    Map<String, Object> data = new HashMap<>();
                    data.put("rank", 0); // Will be set later
                    data.put("asin", p.getAsin());
                    data.put("productName", p.getProductName());
                    data.put("price", p.getPrice());
                    data.put("salesCount", p.getSalesCount());
                    data.put("revenue", p.getPrice() != null ? p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())) : BigDecimal.ZERO);
                    data.put("rating", p.getRating());
                    data.put("categoryName", p.getCategory() != null ? p.getCategory().getName() : "Uncategorized");
                    data.put("imageUrl", p.getImageUrl());
                    data.put("stockQuantity", p.getStockQuantity());
                    data.put("seller", p.getSeller() != null ? p.getSeller().getStoreName() : "MouadVision");
                    return data;
                })
                .peek(data -> {
                    // Set rank
                    int index = products.stream()
                            .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                            .sorted((a, b) -> b.getSalesCount().compareTo(a.getSalesCount()))
                            .collect(Collectors.toList())
                            .indexOf(productRepository.findByAsin((String) data.get("asin")).orElse(null));
                    data.put("rank", index + 1);
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getMonthlyRevenueTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();

        for (int i = 11; i >= 0; i--) {
            LocalDate monthStart = LocalDate.now().minusMonths(i).withDayOfMonth(1);
            LocalDate monthEnd = monthStart.plusMonths(1).minusDays(1);

            BigDecimal revenue = getRevenueForPeriod(monthStart, monthEnd);

            List<Order> monthOrders = orderRepository.findByCreatedAtBetween(
                    monthStart.atStartOfDay(),
                    monthEnd.plusDays(1).atStartOfDay()
            );

            long orderCount = monthOrders.stream()
                    .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                            o.getStatus() == Order.OrderStatus.DELIVERED)
                    .count();

            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", monthStart.getMonth().toString().substring(0, 3));
            monthData.put("year", monthStart.getYear());
            monthData.put("monthYear", monthStart.getMonth().toString().substring(0, 3) + " " + monthStart.getYear());
            monthData.put("revenue", revenue);
            monthData.put("orders", orderCount);

            trend.add(monthData);
        }

        return trend;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getCategoryRevenueDistribution() {
        List<Map<String, Object>> categories = getCategoriesOverview();

        BigDecimal totalRevenue = categories.stream()
                .map(c -> (BigDecimal) c.get("revenue"))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return categories.stream()
                .map(c -> {
                    BigDecimal revenue = (BigDecimal) c.get("revenue");
                    double percentage = totalRevenue.compareTo(BigDecimal.ZERO) > 0
                            ? revenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                            .multiply(new BigDecimal("100")).doubleValue()
                            :  0;

                    Map<String, Object> data = new HashMap<>();
                    data.put("categoryName", c.get("name"));
                    data.put("revenue", revenue);
                    data.put("percentage", Math.round(percentage * 10.0) / 10.0);
                    data.put("productCount", c.get("productCount"));
                    data.put("color", generateColorForCategory((String) c.get("name")));

                    return data;
                })
                .sorted((a, b) -> Double.compare((double) b.get("percentage"), (double) a.get("percentage")))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesPerformanceMetrics() {
        Map<String, Object> metrics = new HashMap<>();

        // Today's stats
        LocalDate today = LocalDate.now();
        BigDecimal todayRevenue = getRevenueForPeriod(today, today);
        metrics.put("todayRevenue", todayRevenue);

        // This week stats
        LocalDate weekStart = today.minusDays(today.getDayOfWeek().getValue() - 1);
        BigDecimal weekRevenue = getRevenueForPeriod(weekStart, today);
        metrics.put("weekRevenue", weekRevenue);

        // This month stats
        LocalDate monthStart = today.withDayOfMonth(1);
        BigDecimal monthRevenue = getRevenueForPeriod(monthStart, today);
        metrics.put("monthRevenue", monthRevenue);

        // Year to date
        LocalDate yearStart = today.withDayOfYear(1);
        BigDecimal yearRevenue = getRevenueForPeriod(yearStart, today);
        metrics.put("yearRevenue", yearRevenue);

        // Best selling day this month
        Map<LocalDate, BigDecimal> dailyRevenue = new HashMap<>();
        for (LocalDate date = monthStart; ! date.isAfter(today); date = date.plusDays(1)) {
            dailyRevenue.put(date, getRevenueForPeriod(date, date));
        }
        Map.Entry<LocalDate, BigDecimal> bestDay = dailyRevenue.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);
        if (bestDay != null) {
            metrics.put("bestSellingDay", bestDay.getKey().toString());
            metrics.put("bestSellingDayRevenue", bestDay.getValue());
        }

        // Conversion rate (orders / total users * 100)
        long totalBuyers = userRepository.countByRole(User.Role.BUYER);
        long totalOrders = orderRepository.count();
        double conversionRate = totalBuyers > 0 ?  (double) totalOrders / totalBuyers * 100 :  0;
        metrics.put("conversionRate", Math.round(conversionRate * 10.0) / 10.0);

        return metrics;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getOrderStatusDistribution() {
        Map<String, Object> distribution = new LinkedHashMap<>();

        List<Order> allOrders = orderRepository.findAll();

        distribution.put("PENDING", allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.PENDING).count());
        distribution.put("CONFIRMED", allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED).count());
        distribution.put("SHIPPED", allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.SHIPPED).count());
        distribution.put("DELIVERED", allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.DELIVERED).count());
        distribution.put("CANCELLED", allOrders.stream().filter(o -> o.getStatus() == Order.OrderStatus.CANCELLED).count());

        return distribution;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getWeeklySalesTrend() {
        List<Map<String, Object>> trend = new ArrayList<>();
        LocalDate today = LocalDate.now();

        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            BigDecimal revenue = getRevenueForPeriod(date, date);

            List<Order> dayOrders = orderRepository.findByCreatedAtBetween(
                    date.atStartOfDay(),
                    date.plusDays(1).atStartOfDay()
            );

            long orderCount = dayOrders.stream()
                    .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                            o.getStatus() == Order.OrderStatus.DELIVERED)
                    .count();

            Map<String, Object> dayData = new HashMap<>();
            dayData.put("date", date.toString());
            dayData.put("dayName", date.getDayOfWeek().toString().substring(0, 3));
            dayData.put("revenue", revenue);
            dayData.put("orders", orderCount);

            trend.add(dayData);
        }

        return trend;
    }

    private String generateColorForCategory(String categoryName) {
        // Generate consistent colors based on category name
        String[] colors = {
                "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
                "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1"
        };
        int hash = Math.abs(categoryName.hashCode());
        return colors[hash % colors.length];
    }

    // ==================== SALES ANALYTICS ====================

    @Transactional(readOnly = true)
    public Map<String, Object> getSalesOverview(LocalDate startDate, LocalDate endDate) {
        if (startDate == null) startDate = LocalDate.now().minusDays(30);
        if (endDate == null) endDate = LocalDate.now();

        Map<String, Object> overview = new HashMap<>();

        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.plusDays(1).atStartOfDay();

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

        List<Order> orders = orderRepository.findByCreatedAtBetween(
                startDate.atStartOfDay(),
                endDate.plusDays(1).atStartOfDay()
        );

        List<Order> confirmedOrders = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

        Map<LocalDate, List<Order>> ordersByDate = confirmedOrders.stream()
                .collect(Collectors.groupingBy(o -> o.getCreatedAt().toLocalDate()));

        for (LocalDate date = startDate; ! date.isAfter(endDate); date = date.plusDays(1)) {
            List<Order> dayOrders = ordersByDate.getOrDefault(date, Collections.emptyList());

            BigDecimal revenue = dayOrders.stream()
                    .map(Order::getTotalAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal:: add);

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

        for (Category category :  categories) {
            List<Product> products = productRepository.findByCategory(category);

            BigDecimal totalRevenue = BigDecimal.ZERO;
            int totalSold = 0;

            for (Product product : products) {
                int salesCount = product.getSalesCount() != null ? product.getSalesCount() : 0;
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

        BigDecimal thisWeekRevenue = getRevenueForPeriod(today.minusDays(7), today);
        BigDecimal lastWeekRevenue = getRevenueForPeriod(today.minusDays(14), today.minusDays(7));
        double weeklyGrowth = calculateGrowthPercentage(lastWeekRevenue, thisWeekRevenue);

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

        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.CONFIRMED ||
                        o.getStatus() == Order.OrderStatus.DELIVERED)
                .collect(Collectors.toList());

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

        BigDecimal avgPrice = products.stream()
                .filter(p -> p.getPrice() != null)
                .map(Product::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(BigDecimal.valueOf(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);
        overview.put("avgPrice", avgPrice);

        double avgRating = products.stream()
                .filter(p -> p.getRating() != null)
                .mapToDouble(p -> p.getRating().doubleValue())
                .average()
                .orElse(0.0);
        overview.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

        long totalReviews = products.stream()
                .filter(p -> p.getReviewsCount() != null)
                .mapToLong(Product::getReviewsCount)
                .sum();
        overview.put("totalReviews", totalReviews);

        BigDecimal inventoryValue = products.stream()
                .filter(p -> p.getPrice() != null && p.getStockQuantity() != null)
                .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getStockQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("inventoryValue", inventoryValue);

        long lowStockCount = products.stream()
                .filter(p -> p.getStockQuantity() != null && p.getStockQuantity() < 10)
                .count();
        overview.put("lowStockCount", lowStockCount);

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
        List<Product> bestsellers = productRepository.findTop10ByApprovalStatusOrderBySalesCountDesc(
                Product.ApprovalStatus.APPROVED
        );

        if (bestsellers.isEmpty()) {
            bestsellers = productRepository.findTop10ByApprovalStatusOrderByRankingAsc(
                    Product.ApprovalStatus.APPROVED
            );
        }

        return bestsellers.stream().map(product -> {
            Map<String, Object> map = new HashMap<>();
            map.put("asin", product.getAsin());
            map.put("productName", product.getProductName());
            map.put("category", product.getCategory() != null ? product.getCategory().getName() : "Uncategorized");
            map.put("salesCount", product.getSalesCount() != null ? product.getSalesCount() : 0);
            map.put("rating", product.getRating() != null ? product.getRating() : 0);
            map.put("price", product.getPrice());
            map.put("imageUrl", product.getImageUrl());
            return map;
        }).collect(Collectors.toList());
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

        BigDecimal totalSellerRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getGrossAmount() != null ? sr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("totalSellerRevenue", totalSellerRevenue);

        BigDecimal platformCommission = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getPlatformFee() != null ? sr.getPlatformFee() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        overview.put("platformCommission", platformCommission);

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
            seller.put("totalRevenue", row[3] != null ? ((BigDecimal) row[3]).doubleValue() : 0.0);
            seller.put("productsSold", row[4] != null ? ((Long) row[4]).intValue() : 0);
            seller.put("totalOrders", row[5] != null ? ((Long) row[5]).intValue() : 0);
            ranking.add(seller);
        }

        return ranking;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getSellerGrowth() {
        List<Map<String, Object>> growth = new ArrayList<>();

        List<User> sellers = userRepository.findAllByRole(User.Role.SELLER);

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

        // ========== GET ALL APPROVED PRODUCTS ==========
        List<Product> allApprovedProducts = productRepository.findByApprovalStatus(Product.ApprovalStatus.APPROVED);

        // ========== PLATFORM (MouadVision) PRODUCTS ==========
        // Platform products = products where seller is NULL (no seller assigned = MouadVision's own products)
        List<Product> platformProducts = allApprovedProducts.stream()
                .filter(p -> p.getSeller() == null)
                .collect(Collectors.toList());

        // ========== SELLER PRODUCTS ==========
        // Seller products = products where seller is NOT NULL (assigned to a seller)
        List<Product> sellerProducts = allApprovedProducts.stream()
                .filter(p -> p.getSeller() != null)
                .collect(Collectors.toList());

        // ========== PLATFORM STATS ==========
        BigDecimal platformRevenue = platformRevenueRepository.calculateTotalPlatformRevenue();
        if (platformRevenue == null) {
            platformRevenue = BigDecimal.ZERO;
        }

        long platformProductsCount = platformProducts.size();

        int platformSales = platformProducts.stream()
                .filter(p -> p.getSalesCount() != null)
                .mapToInt(Product::getSalesCount)
                .sum();

        comparison.put("platform", Map.of(
                "name", "MouadVision",
                "revenue", platformRevenue,
                "products", platformProductsCount,
                "sales", platformSales
        ));

        // ========== SELLERS STATS ==========
        BigDecimal sellersRevenue = sellerRevenueRepository.findAll().stream()
                .map(sr -> sr.getGrossAmount() != null ? sr.getGrossAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long sellerProductsCount = sellerProducts.size();

        int sellerSales = sellerProducts.stream()
                .filter(p -> p.getSalesCount() != null)
                .mapToInt(Product::getSalesCount)
                .sum();

        comparison.put("sellers", Map.of(
                "name", "All Sellers",
                "revenue", sellersRevenue,
                "products", sellerProductsCount,
                "sales", sellerSales
        ));

        // ========== CALCULATE SHARES ==========
        BigDecimal totalRevenue = platformRevenue.add(sellersRevenue);
        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            comparison.put("platformShare", platformRevenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")));
            comparison.put("sellersShare", sellersRevenue.divide(totalRevenue, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100")));
        } else {
            comparison.put("platformShare", BigDecimal.ZERO);
            comparison.put("sellersShare", BigDecimal.ZERO);
        }

        // Debug log to see actual counts
        log.info("Platform vs Sellers - Total:  {}, Platform (seller=null): {}, Sellers (seller!=null): {}",
                allApprovedProducts.size(), platformProductsCount, sellerProductsCount);

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

        List<Product> products = productRepository.findBySeller(seller);
        details.put("totalProducts", products.size());
        details.put("approvedProducts", products.stream()
                .filter(p -> p.getApprovalStatus() == Product.ApprovalStatus.APPROVED)
                .count());

        BigDecimal totalRevenue = sellerRevenueRepository.calculateTotalRevenueBySeller(seller);
        details.put("totalRevenue", totalRevenue != null ? totalRevenue :  BigDecimal.ZERO);

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

                    BigDecimal avgPrice = products.stream()
                            .filter(p -> p.getPrice() != null)
                            .map(Product::getPrice)
                            .reduce(BigDecimal.ZERO, BigDecimal::add)
                            .divide(BigDecimal.valueOf(Math.max(products.size(), 1)), 2, RoundingMode.HALF_UP);
                    data.put("avgPrice", avgPrice);

                    double avgRating = products.stream()
                            .filter(p -> p.getRating() != null)
                            .mapToDouble(p -> p.getRating().doubleValue())
                            .average()
                            .orElse(0.0);
                    data.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

                    int totalSales = products.stream()
                            .filter(p -> p.getSalesCount() != null)
                            .mapToInt(Product::getSalesCount)
                            .sum();
                    data.put("totalSales", totalSales);

                    BigDecimal revenue = products.stream()
                            .filter(p -> p.getPrice() != null && p.getSalesCount() != null)
                            .map(p -> p.getPrice().multiply(BigDecimal.valueOf(p.getSalesCount())))
                            .reduce(BigDecimal.ZERO, BigDecimal:: add);
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
            double avgRating = products.stream()
                    .filter(p -> p.getRating() != null)
                    .mapToDouble(p -> p.getRating().doubleValue())
                    .average()
                    .orElse(0.0);
            metrics.put("avgRating", Math.round(avgRating * 10.0) / 10.0);

        }

        products.stream()
                .filter(p -> p.getRating() != null)
                .max(Comparator.comparing(Product::getRating))
                .ifPresent(p -> metrics.put("bestRated", Map.of(
                        "asin", p.getAsin(),
                        "name", p.getProductName(),
                        "rating", p.getRating()
                )));

        products.stream()
                .filter(p -> p.getSalesCount() != null && p.getSalesCount() > 0)
                .max(Comparator.comparing(Product::getSalesCount))
                .ifPresent(p -> metrics.put("bestSelling", Map.of(
                        "asin", p.getAsin(),
                        "name", p.getProductName(),
                        "sales", p.getSalesCount()
                )));

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
                    data.put("seller", p.getSeller() != null ? p.getSeller().getFullName() : "MouadVision");
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