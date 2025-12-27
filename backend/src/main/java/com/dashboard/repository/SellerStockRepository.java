package com.dashboard.repository;

import com.dashboard.entity.SellerStock;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface SellerStockRepository extends JpaRepository<SellerStock, Long> {

    Page<SellerStock> findBySellerOrderByPurchasedAtDesc(User seller, Pageable pageable);

    Optional<SellerStock> findBySellerAndOriginalProductAsin(User seller, String originalProductAsin);

    List<SellerStock> findBySellerAndAvailableQuantityGreaterThanOrderByPurchasedAtDesc(
            User seller, Integer minQuantity);

    Optional<SellerStock> findByIdAndSeller(Long id, User seller);

    @Query("SELECT COUNT(s) FROM SellerStock s WHERE s.seller = :seller")
    Long countBySeller(@Param("seller") User seller);

    @Query("SELECT COUNT(s) FROM SellerStock s WHERE s.seller = :seller AND s.availableQuantity > 0")
    Long countAvailableBySeller(@Param("seller") User seller);

    @Query("SELECT SUM(s.availableQuantity) FROM SellerStock s WHERE s.seller = :seller")
    Long sumAvailableQuantityBySeller(@Param("seller") User seller);

    @Query("SELECT SUM(s.purchasePrice * s.quantity) FROM SellerStock s WHERE s.seller = :seller")
    BigDecimal calculateTotalInvestmentBySeller(@Param("seller") User seller);

    @Query("SELECT s FROM SellerStock s WHERE s.seller = :seller AND " +
            "(LOWER(s.originalProductName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(s.originalProductAsin) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<SellerStock> searchBySellerAndQuery(
            @Param("seller") User seller, @Param("query") String query, Pageable pageable);

    @Modifying
    @Query("DELETE FROM SellerStock s WHERE s.seller = :seller AND s.originalProductAsin = :asin")
    void deleteBySellerAndOriginalProductAsin(@Param("seller") User seller, @Param("asin") String asin);
}