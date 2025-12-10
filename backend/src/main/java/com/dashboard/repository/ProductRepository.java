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

    Optional<Product> findByAsin(String asin);

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

    @Query("SELECT SUM(p.stockQuantity) FROM Product p")
    Long sumAllStockQuantity();

    // Search query
    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR p.asin LIKE CONCAT('%', :query, '%')")
    List<Product> searchByNameOrAsin(@Param("query") String query);

    @Query("SELECT p FROM Product p WHERE p.stockQuantity = :quantity")
    Page<Product> findByStockQuantityEqualsPageable(@Param("quantity") Integer quantity, Pageable pageable);

    // Find by approval status string (for SmartSearchService)
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = :status")
    Page<Product> findByApprovalStatusString(@Param("status") String status, Pageable pageable);

    // Search by keyword in product name and ASIN
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND " +
            "(LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(p.asin) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    // Product name suggestions for autocomplete
    @Query("SELECT DISTINCT p.productName FROM Product p WHERE " +
            "LOWER(p.productName) LIKE LOWER(CONCAT(:prefix, '%')) AND p.approvalStatus = 'APPROVED'")
    List<String> findProductNameSuggestions(@Param("prefix") String prefix, Pageable pageable);

    // Find bestsellers
    @Query("SELECT p FROM Product p WHERE p.isBestseller = true AND p.approvalStatus = 'APPROVED'")
    Page<Product> findBestsellers(Pageable pageable);

    // Find by price range
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.price BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceRange(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice, Pageable pageable);

    // Find by minimum rating
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.rating >= :minRating")
    Page<Product> findByMinRating(@Param("minRating") BigDecimal minRating, Pageable pageable);

    // Low stock products
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.stockQuantity <= :threshold")
    Page<Product> findLowStockProducts(@Param("threshold") int threshold, Pageable pageable);

    // Top rated products
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' ORDER BY p.rating DESC")
    Page<Product> findTopRated(Pageable pageable);

    // Most reviewed products
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' ORDER BY p.reviewsCount DESC")
    Page<Product> findMostReviewed(Pageable pageable);

    // Search in category
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.category = :category AND " +
            "(LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Product> searchInCategory(@Param("category") Category category, @Param("keyword") String keyword, Pageable pageable);

    // Find by category and approved
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' AND p.category = :category")
    Page<Product> findByCategoryAndApproved(@Param("category") Category category, Pageable pageable);

    // Advanced search with multiple filters
    @Query("SELECT p FROM Product p WHERE p.approvalStatus = 'APPROVED' " +
            "AND (:keyword IS NULL OR LOWER(p.productName) LIKE LOWER(CONCAT('%', :keyword, '%'))) " +
            "AND (:minPrice IS NULL OR p.price >= :minPrice) " +
            "AND (:maxPrice IS NULL OR p.price <= :maxPrice) " +
            "AND (:minRating IS NULL OR p.rating >= :minRating)")
    Page<Product> advancedSearch(
            @Param("keyword") String keyword,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRating") BigDecimal minRating,
            Pageable pageable
    );
}