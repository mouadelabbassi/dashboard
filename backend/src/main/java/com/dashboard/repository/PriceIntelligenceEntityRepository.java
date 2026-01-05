package com.dashboard.repository;

import com.dashboard.entity.PriceIntelligenceEntity;
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
public interface PriceIntelligenceEntityRepository extends JpaRepository<PriceIntelligenceEntity, Long> {

    Optional<PriceIntelligenceEntity> findTopByProductIdOrderByAnalysisDateDesc(String productId);

    Page<PriceIntelligenceEntity> findAllByOrderByAnalysisDateDesc(Pageable pageable);

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.productId IN :productIds " +
            "AND pi.analysisDate = (SELECT MAX(pi2.analysisDate) FROM PriceIntelligenceEntity pi2 " +
            "WHERE pi2.productId = pi.productId)")
    List<PriceIntelligenceEntity> findLatestIntelligenceForProducts(@Param("productIds") List<String> productIds);

    @Query(value = """
        SELECT * FROM price_intelligence pi
        WHERE pi.id IN (
            SELECT MAX(id) FROM price_intelligence 
            GROUP BY product_id
        )
        ORDER BY analysis_date DESC
        LIMIT 1000
        """, nativeQuery = true)
    List<PriceIntelligenceEntity> findAllLatestIntelligence();

    List<PriceIntelligenceEntity> findByPriceAction(String priceAction);

    List<PriceIntelligenceEntity> findByPriceActionNot(String priceAction);

    @Query("SELECT COUNT(pi) FROM PriceIntelligenceEntity pi WHERE pi.priceAction = :action")
    long countByPriceAction(@Param("action") String action);

    @Query("SELECT AVG(pi.priceChangePercentage) FROM PriceIntelligenceEntity pi")
    Double calculateAveragePriceChangePercentage();

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.priceAction = 'INCREASE'")
    List<PriceIntelligenceEntity> findIncreaseRecommendations();

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.priceAction = 'DECREASE'")
    List<PriceIntelligenceEntity> findDecreaseRecommendations();

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.shouldNotifySeller = true")
    List<PriceIntelligenceEntity> findAllWithSellerNotification();

    @Query("SELECT COUNT(pi) FROM PriceIntelligenceEntity pi WHERE pi.priceAction <> 'MAINTAIN' AND pi.priceAction <> 'MAINTENIR'")
    long countWithPriceRecommendations();

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.product.seller.id = :sellerId ORDER BY pi.analysisDate DESC")
    List<PriceIntelligenceEntity> findBySellerIdOrderByAnalysisDateDesc(@Param("sellerId") Long sellerId);

    @Query("SELECT pi FROM PriceIntelligenceEntity pi WHERE pi.shouldNotifySeller = true " +
            "AND pi.product.seller.id = :sellerId ORDER BY pi.analysisDate DESC")
    List<PriceIntelligenceEntity> findAlertsForSeller(@Param("sellerId") Long sellerId);

    @Modifying
    @Query("DELETE FROM PriceIntelligenceEntity p WHERE p.productId = :productId")
    void deleteByProductId(@Param("productId") String productId);
}