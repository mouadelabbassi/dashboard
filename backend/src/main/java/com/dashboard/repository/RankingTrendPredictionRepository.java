package com.dashboard.repository;

import com.dashboard.entity.RankingTrendPrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RankingTrendPredictionRepository extends JpaRepository<RankingTrendPrediction, Long> {

    Page<RankingTrendPrediction> findAllByOrderByPredictionDateDesc(Pageable pageable);

    Optional<RankingTrendPrediction> findFirstByProductIdOrderByPredictionDateDesc(String productId);

    List<RankingTrendPrediction> findByProductIdOrderByPredictionDateDesc(String productId);

    @Query("SELECT rtp FROM RankingTrendPrediction rtp WHERE rtp.product.seller.id = :sellerId ORDER BY rtp.predictionDate DESC")
    List<RankingTrendPrediction> findBySellerIdOrderByPredictionDateDesc(@Param("sellerId") Long sellerId);

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

    List<RankingTrendPrediction> findByPredictedTrend(RankingTrendPrediction.PredictedTrend trend);

    @Query("SELECT COUNT(rtp) FROM RankingTrendPrediction rtp WHERE rtp.predictedTrend = :trend")
    long countByPredictedTrend(@Param("trend") RankingTrendPrediction.PredictedTrend trend);

    @Query("SELECT AVG(rtp.confidenceScore) FROM RankingTrendPrediction rtp")
    Double calculateAverageConfidence();

    @Query("SELECT rtp FROM RankingTrendPrediction rtp WHERE rtp.predictedTrend = com.dashboard.entity.RankingTrendPrediction$PredictedTrend.IMPROVING AND rtp.confidenceScore >= 0.7")
    List<RankingTrendPrediction> findHighConfidenceImproving();

    @Query("SELECT rtp FROM RankingTrendPrediction rtp WHERE rtp.predictedTrend = com.dashboard.entity.RankingTrendPrediction$PredictedTrend.DECLINING")
    List<RankingTrendPrediction> findDecliningProducts();

    @Modifying
    @Query("DELETE FROM RankingTrendPrediction r WHERE r.productId = :productId")
    void deleteByProductId(@Param("productId") String productId);
}