package com.dashboard.repository;

import com.dashboard.entity.RankingTrendPrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankingTrendPredictionRepository extends JpaRepository<RankingTrendPrediction, Long> {

    Optional<RankingTrendPrediction> findTopByProductIdOrderByPredictionDateDesc(String productId);

    Page<RankingTrendPrediction> findAllByOrderByPredictionDateDesc(Pageable pageable);

    List<RankingTrendPrediction> findByPredictedTrendOrderByConfidenceScoreDesc(
            RankingTrendPrediction.PredictedTrend trend);

    @Query("SELECT rtp FROM RankingTrendPrediction rtp WHERE rtp.productId IN :productIds " +
            "AND rtp.predictionDate = (SELECT MAX(rtp2.predictionDate) FROM RankingTrendPrediction rtp2 " +
            "WHERE rtp2.productId = rtp.productId)")
    List<RankingTrendPrediction> findLatestPredictionsForProducts(@Param("productIds") List<String> productIds);

    @Query(value = """
        SELECT * FROM ranking_trend_predictions rtp
        WHERE rtp.id IN (
            SELECT MAX(id) FROM ranking_trend_predictions 
            GROUP BY product_id
        )
        ORDER BY prediction_date DESC
        LIMIT 1000
        """, nativeQuery = true)
    List<RankingTrendPrediction> findAllLatestPredictions();

}