package com.dashboard.repository;

import com.dashboard.entity.SellerRevenue;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SellerRevenueRepository extends JpaRepository<SellerRevenue, Long> {

    Page<SellerRevenue> findBySellerOrderByRevenueDateDesc(User seller, Pageable pageable);

    List<SellerRevenue> findBySellerAndRevenueDateBetween(
            User seller,
            LocalDate startDate,
            LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(sr.netAmount), 0) FROM SellerRevenue sr WHERE sr.seller = :seller")
    BigDecimal calculateTotalRevenueBySeller(@Param("seller") User seller);

    @Query("SELECT COALESCE(SUM(sr.netAmount), 0) FROM SellerRevenue sr WHERE sr.seller = :seller AND sr.revenueDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueBetweenDates(
            @Param("seller") User seller,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT COALESCE(SUM(sr.netAmount), 0) FROM SellerRevenue sr WHERE sr.seller.id = :sellerId AND sr.revenueDate = :date")
    BigDecimal calculateDailyRevenue(@Param("sellerId") Long sellerId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(sr.quantitySold), 0) FROM SellerRevenue sr WHERE sr.seller = :seller")
    Long countTotalUnitsSold(@Param("seller") User seller);

    @Query("SELECT sr.revenueDate, SUM(sr.netAmount) FROM SellerRevenue sr WHERE sr.seller = :seller AND sr.revenueDate BETWEEN :startDate AND :endDate GROUP BY sr.revenueDate ORDER BY sr.revenueDate")
    List<Object[]> getDailyRevenueBreakdown(
            @Param("seller") User seller,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query("SELECT sr.product.asin, sr.product.productName, SUM(sr.quantitySold), SUM(sr.netAmount) FROM SellerRevenue sr WHERE sr.seller = :seller GROUP BY sr.product.asin, sr.product.productName ORDER BY SUM(sr.netAmount) DESC")
    List<Object[]> getProductRevenueBreakdown(@Param("seller") User seller, Pageable pageable);

    @Query("SELECT COALESCE(SUM(sr.grossAmount), 0) FROM SellerRevenue sr")
    BigDecimal calculateTotalPlatformRevenue();

    @Query("SELECT COALESCE(SUM(sr.platformFee), 0) FROM SellerRevenue sr")
    BigDecimal calculateTotalPlatformFees();

    boolean existsByOrderItemId(Long orderItemId);
}