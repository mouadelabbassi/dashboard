package com.dashboard.repository;

import com.dashboard.entity.BestsellerPrediction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface BestsellerPredictionRepository extends JpaRepository<BestsellerPrediction, Long> {

    Optional<BestsellerPrediction> findTopByProductIdOrderByPredictionDateDesc(String productId);


    Page<BestsellerPrediction> findAllByOrderByPredictionDateDesc(Pageable pageable);

    Page<BestsellerPrediction> findByConfidenceLevelOrderByPredictedProbabilityDesc(
            BestsellerPrediction.ConfidenceLevel confidenceLevel, Pageable pageable);

    List<BestsellerPrediction> findByPredictedProbabilityGreaterThanEqualOrderByPredictedProbabilityDesc(
            BigDecimal threshold);

    long countByConfidenceLevel(BestsellerPrediction.ConfidenceLevel confidenceLevel);

    long countByPredictedProbabilityGreaterThanEqual(BigDecimal threshold);

    long countByActualOutcomeIsNotNull();


    @Query("SELECT COUNT(bp) FROM BestsellerPrediction bp WHERE " +
            "(bp.predictedProbability >= 0.5 AND bp.actualOutcome = true) OR " +
            "(bp.predictedProbability < 0.5 AND bp.actualOutcome = false)")
    long countCorrectPredictions();

    @Query("SELECT bp FROM BestsellerPrediction bp WHERE bp.productId IN :productIds " +
            "AND bp.predictionDate = (SELECT MAX(bp2.predictionDate) FROM BestsellerPrediction bp2 " +
            "WHERE bp2.productId = bp.productId)")
    List<BestsellerPrediction> findLatestByProductIds(@Param("productIds") List<String> productIds);

    @Query("SELECT AVG(bp.predictedProbability) FROM BestsellerPrediction bp")
    BigDecimal getAverageProbability();

    @Query("SELECT COUNT(bp) FROM BestsellerPrediction bp WHERE bp.predictedProbability >= 0.70")
    long countPotentialBestsellers();

    @Query("SELECT bp FROM BestsellerPrediction bp JOIN bp.product p " +
            "WHERE p.seller.id = :sellerId ORDER BY bp.predictionDate DESC")
    List<BestsellerPrediction> findBySellerIdOrderByPredictionDateDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT bp FROM BestsellerPrediction bp JOIN bp.product p " +
            "WHERE p.seller.id = :sellerId AND bp.confidenceLevel = 'HIGH' " +
            "AND bp.predictedProbability >= 0.85")
    List<BestsellerPrediction> findHighConfidenceForSeller(@Param("sellerId") Long sellerId);
}