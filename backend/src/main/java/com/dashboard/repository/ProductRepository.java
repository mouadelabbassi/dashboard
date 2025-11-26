package com.dashboard.repository;

import com.dashboard.entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data. jpa.repository. JpaRepository;
import org.springframework. data.jpa. repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository. Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query. Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, String>, JpaSpecificationExecutor<Product> {

    Optional<Product> findByAsin(String asin);

    boolean existsByAsin(String asin);

    @Query("SELECT COUNT(p) FROM Product p")
    Long countAllProducts();

    @Query("SELECT AVG(p.price) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateAveragePrice();

    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.rating IS NOT NULL")
    BigDecimal calculateAverageRating();

    @Query("SELECT COALESCE(SUM(p.reviewsCount), 0) FROM Product p")
    Long sumTotalReviews();

    @Query("SELECT COALESCE(SUM(p.price), 0) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateTotalInventoryValue();

    @Query("SELECT p FROM Product p WHERE p. ranking IS NOT NULL ORDER BY p.ranking ASC LIMIT 1")
    Optional<Product> findTopProduct();

    @Query("SELECT p FROM Product p WHERE p.ranking IS NOT NULL ORDER BY p.ranking ASC")
    List<Product> findTopNProducts(Pageable pageable);

    default List<Product> findTopNProducts(Integer n) {
        return findTopNProducts(org.springframework.data. domain.PageRequest.of(0, n)). stream(). toList();
    }

    List<Product> findByCategoryId(Long categoryId);

    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.category.name = :categoryName")
    Page<Product> findByCategoryName(@Param("categoryName") String categoryName, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p. asin) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE " +
            "(:categoryName IS NULL OR p.category.name = :categoryName) AND " +
            "(:minPrice IS NULL OR p.price >= :minPrice) AND " +
            "(:maxPrice IS NULL OR p.price <= :maxPrice) AND " +
            "(:minRating IS NULL OR p.rating >= :minRating)")
    Page<Product> filterProducts(
            @Param("categoryName") String categoryName,
            @Param("minPrice") BigDecimal minPrice,
            @Param("maxPrice") BigDecimal maxPrice,
            @Param("minRating") BigDecimal minRating,
            Pageable pageable
    );

    @Query("SELECT p FROM Product p WHERE p.ranking IS NOT NULL AND p.ranking <= 10 ORDER BY p.ranking ASC")
    List<Product> findBestsellers();

    @Query("SELECT p FROM Product p WHERE p.rating >= :minRating AND p. rating < :maxRating")
    List<Product> findByRatingBetween(@Param("minRating") BigDecimal minRating, @Param("maxRating") BigDecimal maxRating);

    @Query("SELECT p FROM Product p WHERE p.price >= :minPrice AND p.price < :maxPrice")
    List<Product> findByPriceBetween(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice);

    // NEW: Get products ordered by sales count for ranking calculation
    @Query("SELECT p FROM Product p ORDER BY p.salesCount DESC NULLS LAST, p.ranking ASC NULLS LAST")
    List<Product> findAllByOrderBySalesCountDesc();

    // NEW: Get top selling products
    @Query("SELECT p FROM Product p WHERE p.salesCount > 0 ORDER BY p.salesCount DESC")
    List<Product> findTopSellingProducts(Pageable pageable);

    // NEW: Increment sales count
    @Modifying
    @Query("UPDATE Product p SET p.salesCount = COALESCE(p.salesCount, 0) + :quantity WHERE p.asin = :asin")
    void incrementSalesCount(@Param("asin") String asin, @Param("quantity") Integer quantity);
}