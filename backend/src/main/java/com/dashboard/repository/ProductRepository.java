package com.dashboard.repository;

import com.dashboard.entity.Product;
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

    // Find by ASIN
    Optional<Product> findByAsin(String asin);

    // Check if product exists by ASIN
    boolean existsByAsin(String asin);

    // Count all products
    @Query("SELECT COUNT(p) FROM Product p")
    Long countAllProducts();

    // Calculate average price
    @Query("SELECT AVG(p.price) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateAveragePrice();

    // Calculate average rating
    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.rating IS NOT NULL")
    BigDecimal calculateAverageRating();

    // Sum total reviews
    @Query("SELECT COALESCE(SUM(p.reviewsCount), 0) FROM Product p")
    Long sumTotalReviews();

    // Calculate total inventory value
    @Query("SELECT COALESCE(SUM(p.price), 0) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateTotalInventoryValue();

    // Find top product by ranking
    @Query("SELECT p FROM Product p WHERE p.ranking IS NOT NULL ORDER BY p.ranking ASC LIMIT 1")
    Optional<Product> findTopProduct();

    // Find top N products by ranking
    @Query("SELECT p FROM Product p WHERE p.ranking IS NOT NULL ORDER BY p.ranking ASC")
    List<Product> findTopNProducts(Pageable pageable);

    // Overloaded method for convenience - get top N products
    default List<Product> findTopNProducts(Integer n) {
        return findTopNProducts(org.springframework.data.domain.PageRequest.of(0, n)).stream().toList();
    }

    // Find products by category ID (List version)
    List<Product> findByCategoryId(Long categoryId);

    // Find products by category ID (Pageable version)
    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    // Find products by category name
    @Query("SELECT p FROM Product p WHERE p.category.name = :categoryName")
    Page<Product> findByCategoryName(@Param("categoryName") String categoryName, Pageable pageable);

    // Search products by name, description, or ASIN
    @Query("SELECT p FROM Product p WHERE " +
            "LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(p.asin) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    // Filter products with multiple criteria
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

    // Find bestsellers (ranking <= 10)
    @Query("SELECT p FROM Product p WHERE p.ranking IS NOT NULL AND p.ranking <= 10 ORDER BY p.ranking ASC")
    List<Product> findBestsellers();

    // Find products by rating range
    @Query("SELECT p FROM Product p WHERE p.rating >= :minRating AND p.rating < :maxRating")
    List<Product> findByRatingBetween(@Param("minRating") BigDecimal minRating, @Param("maxRating") BigDecimal maxRating);

    // Find products by price range
    @Query("SELECT p FROM Product p WHERE p.price >= :minPrice AND p.price < :maxPrice")
    List<Product> findByPriceBetween(@Param("minPrice") BigDecimal minPrice, @Param("maxPrice") BigDecimal maxPrice);
}