package com.dashboard.repository;

import com.dashboard.entity.PredictionRefreshLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface PredictionRefreshLogRepository extends JpaRepository<PredictionRefreshLog, Long> {

    @Query("SELECT prl FROM PredictionRefreshLog prl WHERE prl.refreshType = :type " +
            "AND prl.status = 'COMPLETED' ORDER BY prl.completedAt DESC LIMIT 1")
    Optional<PredictionRefreshLog> findLatestSuccessfulRefresh(@Param("type") String type);

    @Query("SELECT COUNT(prl) > 0 FROM PredictionRefreshLog prl " +
            "WHERE prl.refreshType = :type AND prl.status = 'RUNNING'")
    boolean isRefreshRunning(@Param("type") String type);
}
