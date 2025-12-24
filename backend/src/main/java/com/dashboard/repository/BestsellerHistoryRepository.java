package com.dashboard.repository;

import com.dashboard.entity.BestsellerHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BestsellerHistoryRepository extends JpaRepository<BestsellerHistory, Long> {

    List<BestsellerHistory> findByProductAsinOrderByRecordedAtDesc(String productAsin);

    @Query("SELECT bh FROM BestsellerHistory bh WHERE bh.productAsin = :asin " +
            "ORDER BY bh.recordedAt DESC LIMIT 1")
    BestsellerHistory findLatestByProductAsin(@Param("asin") String asin);

    List<BestsellerHistory> findByRecordedAtAfter(LocalDateTime after);

    @Query("SELECT COUNT(bh) FROM BestsellerHistory bh WHERE bh.wasBestseller = true " +
            "AND bh.predictedProbability >= :threshold AND bh.recordedAt >= :startDate")
    Long countCorrectPredictions(@Param("threshold") Double threshold,
                                 @Param("startDate") LocalDateTime startDate);
}