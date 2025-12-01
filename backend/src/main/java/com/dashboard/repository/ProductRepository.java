package com.dashboard.repository;

import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByAsin(String asin);

    List<Product> findByCategory(Category category);

    List<Product> findByApprovalStatus(Product.ApprovalStatus status);

    List<Product> findBySeller(User seller);

    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND " +
            "(LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' ORDER BY p.ranking ASC NULLS LAST")
    List<Product> findTopNProducts(Pageable pageable);

    default List<Product> findTopNProducts(int n) {
        return findTopNProducts(Pageable.ofSize(n));
    }

    Page<Product> findByCategoryIdAndApprovalStatus(Long categoryId, Product.ApprovalStatus status, Pageable pageable);

    default Page<Product> findByCategoryId(Long categoryId, Pageable pageable) {
        return findByCategoryIdAndApprovalStatus(categoryId, Product.ApprovalStatus.APPROVED, pageable);
    }

    @Query("SELECT COUNT(p) FROM Product p WHERE p.approvalStatus = 'APPROVED'")
    Long countApprovedProducts();

    @Query("SELECT AVG(p.price) FROM Product p WHERE p.approvalStatus = 'APPROVED'")
    BigDecimal calculateAveragePrice();

    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.approvalStatus = 'APPROVED'")
    BigDecimal calculateAverageRating();

    // Seller-specific queries
    Page<Product> findBySellerOrderByCreatedAtDesc(User seller, Pageable pageable);

    Page<Product> findBySellerAndApprovalStatusOrderByCreatedAtDesc(
            User seller,
            Product.ApprovalStatus status,
            Pageable pageable
    );

    Long countBySeller(User seller);

    Long countBySellerAndApprovalStatus(User seller, Product.ApprovalStatus status);

    @Query("SELECT COALESCE(SUM(p.salesCount), 0) FROM Product p WHERE p.seller = :seller")
    Long countTotalSalesBySeller(@Param("seller") User seller);

    // Products pending approval (for admin)
    Page<Product> findByApprovalStatusOrderBySubmittedAtAsc(
            Product.ApprovalStatus status,
            Pageable pageable
    );

    Long countByApprovalStatus(Product.ApprovalStatus status);

    // Products for buyers (only approved ones)
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' ORDER BY p.createdAt DESC")
    Page<Product> findAllApprovedProducts(Pageable pageable);

    // MouadVision products (seller is null)
    @Query("SELECT p FROM Product p WHERE p.seller IS NULL AND p.approvalStatus = 'APPROVED'")
    Page<Product> findMouadVisionProducts(Pageable pageable);

    // Third-party seller products
    @Query("SELECT p FROM Product p WHERE p.seller IS NOT NULL AND p.approvalStatus = 'APPROVED'")
    Page<Product> findThirdPartySellerProducts(Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.seller.id = :sellerId AND p.approvalStatus = 'APPROVED'")
    Page<Product> findApprovedProductsBySellerId(@Param("sellerId") Long sellerId, Pageable pageable);

    // Check if ASIN exists
    boolean existsByAsin(String asin);
}