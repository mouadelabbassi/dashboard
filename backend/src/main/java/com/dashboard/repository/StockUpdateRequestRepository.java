package com.dashboard.repository;

import com.dashboard.entity.StockUpdateRequest;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StockUpdateRequestRepository extends JpaRepository<StockUpdateRequest, Long> {

    Page<StockUpdateRequest> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<StockUpdateRequest> findByStatusOrderByCreatedAtDesc(
            StockUpdateRequest.RequestStatus status,
            Pageable pageable
    );

    @Query("SELECT COUNT(s) FROM StockUpdateRequest s WHERE s.status = 'PENDING'")
    Long countPendingRequests();

    @Query("SELECT COUNT(s) FROM StockUpdateRequest s WHERE s.seller = :seller AND s.status = :status")
    Long countBySellerAndStatus(@Param("seller") User seller, @Param("status") StockUpdateRequest.RequestStatus status);
}