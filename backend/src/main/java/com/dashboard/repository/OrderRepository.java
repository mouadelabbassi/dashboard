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

    Optional<Order> findByOrderNumber(String orderNumber);

    List<Order> findByUserOrderByCreatedAtDesc(User user);

    List<Order> findByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    Long countByStatus(Order.OrderStatus status);

    List<Order> findByStatus(Order.OrderStatus status);

    @Query("SELECT o FROM Order o ORDER BY o.createdAt DESC")
    List<Order> findRecentOrders(Pageable pageable);

    @Query("SELECT COUNT(o) FROM Order o WHERE DATE(o.orderDate) = CURRENT_DATE")
    Long countTodayOrders();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0) FROM Order o WHERE DATE(o.orderDate) = CURRENT_DATE AND o.status = 'CONFIRMED'")
    BigDecimal calculateTodayRevenue();

}