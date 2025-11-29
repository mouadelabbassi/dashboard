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

    // ✅ REQUIRED: Find unprocessed revenue items for a seller
    @Query("SELECT oi FROM OrderItem oi WHERE oi. seller = :seller AND (oi.sellerRevenueCalculated = false OR oi.sellerRevenueCalculated IS NULL) AND oi.order. status = 'CONFIRMED'")
    List<OrderItem> findUnprocessedRevenueItems(@Param("seller") User seller);

    // ✅ Count items by seller
    Long countBySeller(User seller);

    // ✅ Find items by order ID
    List<OrderItem> findByOrderId(Long orderId);
}