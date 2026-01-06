package com.dashboard.repository;

import com.dashboard.entity.RankingTrendPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RankingTrendPredictionRepository extends JpaRepository<RankingTrendPrediction, Long> {

}