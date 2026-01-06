package com.dashboard.repository;

import com.dashboard.entity.PriceIntelligenceEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
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



}