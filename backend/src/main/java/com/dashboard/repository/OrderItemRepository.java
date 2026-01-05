package com. dashboard.repository;

import com.dashboard. entity.OrderItem;
import com.dashboard.entity. User;
import org. springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data. jpa.repository. JpaRepository;
import org.springframework. data.jpa. repository.Query;
import org.springframework. data.repository.query.Param;
import org.springframework. stereotype.Repository;

import java.util. List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    Page<OrderItem> findBySellerOrderByOrderCreatedAtDesc(User seller, Pageable pageable);

    @Query("SELECT oi FROM OrderItem oi WHERE oi. seller = :seller AND (oi.sellerRevenueCalculated = false OR oi.sellerRevenueCalculated IS NULL) AND oi.order. status = 'CONFIRMED'")
    List<OrderItem> findUnprocessedRevenueItems(@Param("seller") User seller);


    @Query("SELECT sum(oi.quantity) FROM OrderItem oi "+
            "JOIN oi.order o "+
            "WHERE o.status = 'CONFIRMED'")
    Long countTotalSalesFromConfirmedOrders();

    @Query("SELECT sum(oi.quantity) FROM OrderItem oi " +
            "JOIN oi.order o " +
            "WHERE o.status = 'CONFIRMED' " +
            "AND oi.seller IS NULL")
    Long countPlatformSalesFromConfirmedOrders();

    @Query("SELECT sum(oi.quantity) FROM OrderItem oi " +
            "JOIN oi.order o " +
            "WHERE o.status = 'CONFIRMED' " +
            "AND oi.seller IS NOT NULL")
    Long countSellerSalesFromConfirmedOrders();

    boolean existsByProductAsin(String productAsin);
}