package com.dashboard.repository;

import com.dashboard.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PredictionRepository extends JpaRepository<Prediction, Long> {

    List<Prediction> findByProductIdOrderByGeneratedAtDesc(String productId);

    Optional<Prediction> findFirstByProductIdOrderByGeneratedAtDesc(String productId);

    List<Prediction> findBySellerIdOrderByGeneratedAtDesc(Long sellerId);

    List<Prediction> findByIsPotentialBestsellerTrueOrderByBestsellerProbabilityDesc();

    List<Prediction> findByGeneratedAtAfterOrderByGeneratedAtDesc(LocalDateTime date);

    List<Prediction> findByCategoryOrderByGeneratedAtDesc(String category);

    List<Prediction> findByPriceActionNotOrderByPriceChangePercentageDesc(String priceAction);

    @Query("SELECT p FROM Prediction p WHERE p.notificationSent = false AND " +
            "(p.isPotentialBestseller = true OR ABS(p.priceChangePercentage) > 15)")
    List<Prediction> findPredictionsRequiringNotification();

    @Query("SELECT p FROM Prediction p WHERE p.generatedAt = " +
            "(SELECT MAX(p2.generatedAt) FROM Prediction p2 WHERE p2.productId = p.productId)")
    List<Prediction> findLatestPredictionsForAllProducts();

    @Query("SELECT p FROM Prediction p WHERE p.rankingChange >= : minChange ORDER BY p.rankingChange DESC")
    List<Prediction> findPredictionsWithRankingImprovement(@Param("minChange") Integer minChange);

    @Query("SELECT COUNT(p) FROM Prediction p WHERE p.rankingTrend = : trend")
    Long countByRankingTrend(@Param("trend") String trend);

    List<Prediction> findBySellerIdAndNotificationSentFalse(Long sellerId);

    @Query("SELECT p.category, COUNT(p), AVG(p.bestsellerProbability), AVG(p.priceChangePercentage) " +
            "FROM Prediction p WHERE p.generatedAt = " +
            "(SELECT MAX(p2.generatedAt) FROM Prediction p2 WHERE p2.productId = p.productId) " +
            "GROUP BY p.category")
    List<Object[]> getPredictionStatsByCategory();
}