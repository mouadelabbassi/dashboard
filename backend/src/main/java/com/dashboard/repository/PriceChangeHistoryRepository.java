package com.dashboard.repository;

import com.dashboard.entity.PriceChangeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PriceChangeHistoryRepository extends JpaRepository<PriceChangeHistory, Long> {

    List<PriceChangeHistory> findByProductAsinOrderByChangedAtDesc(String productAsin);

    @Query("SELECT pch FROM PriceChangeHistory pch WHERE pch.productAsin = :asin " +
            "ORDER BY pch.changedAt DESC LIMIT 1")
    PriceChangeHistory findLatestByProductAsin(@Param("asin") String asin);

    @Query("SELECT pch FROM PriceChangeHistory pch WHERE pch.measuredAt IS NULL " +
            "AND pch.changedAt <= :cutoffDate")
    List<PriceChangeHistory> findUnmeasuredOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);
}