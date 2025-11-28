package com.dashboard.repository;

import com.dashboard.entity.SellerProductRequest;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SellerProductRequestRepository extends JpaRepository<SellerProductRequest, Long> {

    Page<SellerProductRequest> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<SellerProductRequest> findByStatusOrderByCreatedAtDesc(
            SellerProductRequest.RequestStatus status,
            Pageable pageable
    );

    List<SellerProductRequest> findBySellerAndStatusOrderByCreatedAtDesc(
            User seller,
            SellerProductRequest.RequestStatus status
    );

    Long countByStatus(SellerProductRequest.RequestStatus status);

    Long countBySeller(User seller);

    Long countBySellerAndStatus(User seller, SellerProductRequest.RequestStatus status);

    @Query("SELECT spr FROM SellerProductRequest spr WHERE spr.status = 'PENDING' ORDER BY spr.createdAt ASC")
    List<SellerProductRequest> findPendingRequests(Pageable pageable);

    @Query("SELECT COUNT(spr) FROM SellerProductRequest spr WHERE spr.status = 'PENDING'")
    Long countPendingRequests();

    @Query("SELECT spr FROM SellerProductRequest spr WHERE spr.seller.id = :sellerId AND spr.status = :status")
    Page<SellerProductRequest> findBySellerIdAndStatus(
            @Param("sellerId") Long sellerId,
            @Param("status") SellerProductRequest.RequestStatus status,
            Pageable pageable
    );
}