package com.dashboard.repository;

import com.dashboard.entity.PredictionAccuracyLog;
import com.dashboard.entity.PredictionAccuracyLog.PredictionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface PredictionAccuracyLogRepository extends JpaRepository<PredictionAccuracyLog, Long> {

    List<PredictionAccuracyLog> findByPredictionTypeOrderByMeasurementDateDesc(PredictionType type);

    List<PredictionAccuracyLog> findByProductAsinOrderByMeasurementDateDesc(String productAsin);

    @Query("SELECT AVG(pal.absoluteError) FROM PredictionAccuracyLog pal " +
            "WHERE pal.predictionType = :type AND pal.measurementDate >= :startDate")
    BigDecimal calculateAverageError(@Param("type") PredictionType type,
                                     @Param("startDate") LocalDateTime startDate);

    @Query("SELECT pal FROM PredictionAccuracyLog pal WHERE pal.predictionType = :type " +
            "AND pal.measurementDate >= :startDate ORDER BY pal.measurementDate DESC")
    List<PredictionAccuracyLog> findRecentByType(@Param("type") PredictionType type,
                                                 @Param("startDate") LocalDateTime startDate);
}