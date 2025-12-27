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

    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr")
    BigDecimal calculateTotalPlatformRevenue();

    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr. revenueType = 'DIRECT_SALE'")
    BigDecimal calculateDirectSalesRevenue();

    @Query("SELECT COALESCE(SUM(p. grossAmount), 0) FROM PlatformRevenue p")
    BigDecimal calculateTotalPlatformFees();

    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr.revenueType = 'COMMISSION'")
    BigDecimal calculateCommissionRevenue();

    @Query("SELECT COALESCE(SUM(pr.grossAmount), 0) FROM PlatformRevenue pr WHERE pr.revenueDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueBetweenDates(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

}