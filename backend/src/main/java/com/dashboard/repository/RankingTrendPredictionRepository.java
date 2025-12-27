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

    List<RankingTrendPrediction> findByProductIdIn(List<String> productIds);

    @Query("SELECT rtp FROM RankingTrendPrediction rtp JOIN rtp.product p " +
            "WHERE p.seller.id = :sellerId ORDER BY rtp.predictionDate DESC")
    List<RankingTrendPrediction> findBySellerIdOrderByPredictionDateDesc(@Param("sellerId") Long sellerId);

    long countByPredictedTrend(RankingTrendPrediction.PredictedTrend trend);
}