package com.dashboard.repository;

import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByAsin(String asin);

    Long countBySellerIsNull();
    Page<Product> findBySellerIsNull(Pageable pageable);
    Page<Product> findBySellerIsNullAndStockQuantityLessThan(Integer threshold, Pageable pageable);
    Page<Product> findBySellerIsNullAndStockQuantityEquals(Integer quantity, Pageable pageable);
    Page<Product> findBySellerIsNullAndStockQuantityGreaterThanEqual(Integer threshold, Pageable pageable);

    Page<Product> findBySellerIsNotNull(Pageable pageable);
    Page<Product> findBySellerIsNotNullAndStockQuantityLessThan(Integer threshold, Pageable pageable);
    Page<Product> findBySellerIsNotNullAndStockQuantityEquals(Integer quantity, Pageable pageable);
    Page<Product> findBySellerIsNotNullAndStockQuantityGreaterThanEqual(Integer threshold, Pageable pageable);

    List<Product> findBySellerIsNotNullAndStockQuantityLessThan(Integer threshold);

    List<Product> findByCategory(Category category);
    List<Product> findByApprovalStatus(Product.ApprovalStatus status);
    List<Product> findBySeller(User seller);
    List<Product> findTop10ByApprovalStatusOrderBySalesCountDesc(Product.ApprovalStatus status);
    List<Product> findTop10ByApprovalStatusOrderByRankingAsc(Product.ApprovalStatus status);

    Page<Product> findByStockQuantityEquals(Integer quantity, Pageable pageable);
    List<Product> findByStockQuantityLessThanOrderByStockQuantityAsc(Integer threshold);
    List<Product> findByStockQuantityEquals(Integer quantity);
    Page<Product> findByStockQuantityLessThan(Integer threshold, Pageable pageable);
    Page<Product> findByStockQuantityGreaterThanEqual(Integer threshold, Pageable pageable);

    long countByApprovalStatus(Product.ApprovalStatus status);
    List<Product> findByApprovalStatusOrderBySalesCountDesc(Product.ApprovalStatus status, Pageable pageable);
    long countBySellerId(Long sellerId);
    List<Product> findBySellerId(Long sellerId);

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

    boolean existsByAsin(String asin);

    @Query("SELECT SUM(p.stockQuantity) FROM Product p")
    Long sumAllStockQuantity();

    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR p.asin LIKE CONCAT('%', :query, '%')")
    List<Product> searchByNameOrAsin(@Param("query") String query);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity = :quantity")
    Page<Product> findByStockQuantityEqualsPageable(@Param("quantity") Integer quantity, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.approvalStatus != 'REJECTED' OR p.approvalStatus IS NULL")
    List<Product> findAllExcludingRejected();

    @Query("SELECT COUNT(p) FROM Product p WHERE p.approvalStatus != 'REJECTED' OR p.approvalStatus IS NULL")
    Long countAllExcludingRejected();

}