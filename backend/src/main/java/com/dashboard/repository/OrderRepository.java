package com.dashboard.repository;

import com.dashboard.entity.Order;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    // Find by order number
    Optional<Order> findByOrderNumber(String orderNumber);

    // Find orders by user
    List<Order> findByUserOrderByCreatedAtDesc(User user);

    Page<Order> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

    // Find orders by user ID
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);


    // Find orders by status
    List<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status);

    Page<Order> findByStatusOrderByCreatedAtDesc(Order.OrderStatus status, Pageable pageable);

    // Count orders by user
    Long countByUser(User user);

    // Count orders by status
    Long countByStatus(Order.OrderStatus status);

    // Find orders within date range
    @Query("SELECT o FROM Order o WHERE o.orderDate BETWEEN :startDate AND :endDate ORDER BY o.orderDate DESC")
    List<Order> findOrdersBetweenDates(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    // Calculate total revenue
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE o.status = :status")
    BigDecimal calculateTotalRevenueByStatus(@Param("status") Order.OrderStatus status);

    // Get recent orders
    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);

    // Count today's orders
    @Query("SELECT COUNT(o) FROM Order o WHERE DATE(o.orderDate) = CURRENT_DATE")
    Long countTodayOrders();

    // Get total revenue today
    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE DATE(o.orderDate) = CURRENT_DATE AND o.status = 'CONFIRMED'")
    BigDecimal calculateTodayRevenue();

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status = 'CONFIRMED'")
    Long countConfirmedOrders();
}