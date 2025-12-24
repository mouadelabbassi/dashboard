package com.dashboard.repository;

import com.dashboard.entity.DailyProductMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface DailyProductMetricRepository extends JpaRepository<DailyProductMetric, Long> {

    Optional<DailyProductMetric> findByProductAsinAndMetricDate(String productAsin, LocalDate metricDate);

    List<DailyProductMetric> findByProductAsinOrderByMetricDateDesc(String productAsin);

    List<DailyProductMetric> findByMetricDate(LocalDate metricDate);

    @Query("SELECT dpm FROM DailyProductMetric dpm WHERE dpm.productAsin = :asin " +
            "AND dpm.metricDate BETWEEN :startDate AND :endDate ORDER BY dpm.metricDate DESC")
    List<DailyProductMetric> findByProductAndDateRange(@Param("asin") String asin,
                                                       @Param("startDate") LocalDate startDate,
                                                       @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(dpm.unitsSold) FROM DailyProductMetric dpm " +
            "WHERE dpm.productAsin = :asin AND dpm.metricDate >= :startDate")
    Integer sumUnitsSoldSince(@Param("asin") String asin, @Param("startDate") LocalDate startDate);
}