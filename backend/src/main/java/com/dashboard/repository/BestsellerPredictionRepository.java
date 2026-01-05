package com.dashboard.repository;

import com.dashboard.entity.BestsellerPrediction;
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
public interface BestsellerPredictionRepository extends JpaRepository<BestsellerPrediction, Long> {

    Page<BestsellerPrediction> findAllByOrderByPredictionDateDesc(Pageable pageable);

    Optional<BestsellerPrediction> findFirstByProductIdOrderByPredictionDateDesc(String productId);

    List<BestsellerPrediction> findByProductIdOrderByPredictionDateDesc(String productId);

    @Query("SELECT bp FROM BestsellerPrediction bp WHERE bp.product.seller.id = :sellerId ORDER BY bp.predictionDate DESC")
    List<BestsellerPrediction> findBySellerIdOrderByPredictionDateDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT bp FROM BestsellerPrediction bp JOIN bp.product p " +
            "WHERE p.seller.id = :sellerId AND bp.confidenceLevel = 'HIGH' " +
            "AND bp.predictedProbability >= 0.85")
    List<BestsellerPrediction> findHighConfidenceForSeller(@Param("sellerId") Long sellerId);

    @Query("SELECT bp FROM BestsellerPrediction bp WHERE bp.productId IN :productIds " +
            "AND bp.predictionDate = (SELECT MAX(bp2.predictionDate) FROM BestsellerPrediction bp2 " +
            "WHERE bp2.productId = bp.productId)")
    List<BestsellerPrediction> findLatestPredictionsForProducts(@Param("productIds") List<String> productIds);

    @Query(value = """
        SELECT * FROM bestseller_predictions bp
        WHERE bp.id IN (
            SELECT MAX(id) FROM bestseller_predictions 
            GROUP BY product_id
        )
        ORDER BY prediction_date DESC
        LIMIT 1000
        """, nativeQuery = true)
    List<BestsellerPrediction> findAllLatestPredictions();

    long countByConfidenceLevel(BestsellerPrediction.ConfidenceLevel confidenceLevel);

    @Query("SELECT AVG(bp.predictedProbability) FROM BestsellerPrediction bp")
    Double calculateAverageProbability();

    @Query("SELECT COUNT(bp) FROM BestsellerPrediction bp WHERE bp.predictedProbability >= 0.7")
    long countPotentialBestsellers();

    @Query("SELECT bp FROM BestsellerPrediction bp WHERE bp.confidenceLevel = :level")
    List<BestsellerPrediction> findByConfidenceLevel(@Param("level") BestsellerPrediction.ConfidenceLevel level);

    @Modifying
    @Query("DELETE FROM BestsellerPrediction b WHERE b.productId = :productId")
    void deleteByProductId(@Param("productId") String productId);
}