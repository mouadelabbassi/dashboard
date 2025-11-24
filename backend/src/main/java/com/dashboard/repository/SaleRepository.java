package com.dashboard.repository;

import com.dashboard.entity.Sale;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SaleRepository extends JpaRepository<Sale, Long> {

    Page<Sale> findByUserId(Long userId, Pageable pageable);

    Page<Sale> findByProductAsin(String asin, Pageable pageable);

    Page<Sale> findByStatus(Sale.SaleStatus status, Pageable pageable);

    @Query("SELECT s FROM Sale s WHERE s.saleDate BETWEEN :startDate AND :endDate")
    List<Sale> findSalesBetweenDates(@Param("startDate") LocalDateTime startDate,
                                     @Param("endDate") LocalDateTime endDate);

    @Query("SELECT SUM(s.totalAmount) FROM Sale s WHERE s.status = 'COMPLETED'")
    BigDecimal calculateTotalRevenue();

    @Query("SELECT SUM(s.totalAmount) FROM Sale s WHERE s.status = 'COMPLETED' " +
            "AND s.saleDate BETWEEN :startDate AND :endDate")
    BigDecimal calculateRevenueForPeriod(@Param("startDate") LocalDateTime startDate,
                                         @Param("endDate") LocalDateTime endDate);

    @Query("SELECT MONTH(s.saleDate) as month, SUM(s.totalAmount) as total " +
            "FROM Sale s WHERE s.status = 'COMPLETED' AND YEAR(s.saleDate) = :year " +
            "GROUP BY MONTH(s.saleDate) ORDER BY MONTH(s.saleDate)")
    List<Object[]> getMonthlySales(@Param("year") int year);

    // ADD THIS METHOD FOR SALE COUNTS (not revenue)
    @Query("SELECT MONTH(s.saleDate) as month, COUNT(s) as count " +
            "FROM Sale s WHERE s.status = 'COMPLETED' AND YEAR(s.saleDate) = :year " +
            "GROUP BY MONTH(s.saleDate) ORDER BY MONTH(s.saleDate)")
    List<Object[]> getMonthlySalesCount(@Param("year") int year);

    @Query("SELECT p.category.name, SUM(s.totalAmount) " +
            "FROM Sale s JOIN s.product p WHERE s.status = 'COMPLETED' " +
            "GROUP BY p.category.name ORDER BY SUM(s.totalAmount) DESC")
    List<Object[]> getSalesByCategory();

    @Query("SELECT COUNT(s) FROM Sale s WHERE s.status = 'COMPLETED'")
    Long countCompletedSales();
}