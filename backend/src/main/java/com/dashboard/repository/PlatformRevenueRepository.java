package com.dashboard. repository;

import com.dashboard.entity. PlatformRevenue;
import org. springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query. Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;

@Repository
public interface PlatformRevenueRepository extends JpaRepository<PlatformRevenue, Long> {

    // Total platform revenue (direct sales + commissions)
    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr")
    BigDecimal calculateTotalPlatformRevenue();

    // Revenue from direct sales only (MouadVision products)
    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr. revenueType = 'DIRECT_SALE'")
    BigDecimal calculateDirectSalesRevenue();

    @Query("SELECT COALESCE(SUM(p. grossAmount), 0) FROM PlatformRevenue p")
    BigDecimal calculateTotalPlatformFees();

    // Revenue from commissions only (10% from sellers)
    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr.revenueType = 'COMMISSION'")
    BigDecimal calculateCommissionRevenue();

    // Today's platform revenue
    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr. revenueDate = :today")
    BigDecimal calculateTodayRevenue(@Param("today") LocalDate today);

    // Revenue between dates
    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr.revenueDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    // Check if revenue already exists for an order item
    boolean existsByOrderItemId(Long orderItemId);
}