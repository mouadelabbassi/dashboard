package com.dashboard.repository;

import com.dashboard.entity.ProductRankingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ProductRankingHistoryRepository extends JpaRepository<ProductRankingHistory, Long> {

    List<ProductRankingHistory> findByProductAsinOrderByRecordedAtDesc(String productAsin);

    List<ProductRankingHistory> findByRecordedAtAfter(LocalDateTime after);

    @Query("SELECT prh FROM ProductRankingHistory prh WHERE prh.productAsin = :asin " +
            "AND prh.recordedAt >= :startDate ORDER BY prh.recordedAt DESC")
    List<ProductRankingHistory> findRecentHistory(@Param("asin") String asin,
                                                  @Param("startDate") LocalDateTime startDate);

    @Query("SELECT prh FROM ProductRankingHistory prh WHERE prh.productAsin = :asin " +
            "ORDER BY prh.recordedAt DESC LIMIT 1")
    ProductRankingHistory findLatestByProductAsin(@Param("asin") String asin);
}