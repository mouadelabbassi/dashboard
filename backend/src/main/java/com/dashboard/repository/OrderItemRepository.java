package com.dashboard.repository;

import com.dashboard.entity.OrderItem;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrderId(Long orderId);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.seller = :seller ORDER BY oi.order.createdAt DESC")
    Page<OrderItem> findBySellerOrderByOrderCreatedAtDesc(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.seller.id = :sellerId ORDER BY oi.order.createdAt DESC")
    Page<OrderItem> findBySellerIdOrderByOrderCreatedAtDesc(@Param("sellerId") Long sellerId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(oi.subtotal), 0) FROM OrderItem oi WHERE oi.seller = :seller AND oi.order.status = 'CONFIRMED'")
    BigDecimal calculateTotalRevenueBySeller(@Param("seller") User seller);

    @Query("SELECT COUNT(oi) FROM OrderItem oi WHERE oi.seller = :seller AND oi.order.status = 'CONFIRMED'")
    Long countConfirmedOrdersBySeller(@Param("seller") User seller);

    @Query("SELECT oi FROM OrderItem oi WHERE oi.seller = :seller AND oi.sellerRevenueCalculated = false AND oi.order.status = 'CONFIRMED'")
    List<OrderItem> findUnprocessedRevenueItems(@Param("seller") User seller);
}