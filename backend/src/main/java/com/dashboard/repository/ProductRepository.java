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

    Optional<Product> findByAsin(String asin);

    Page<Product> findByCategoryId(Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Product p WHERE LOWER(p.productName) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(p.description) LIKE LOWER(CONCAT('%', :query, '%')) " +
            "OR LOWER(p.asin) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Product> searchProducts(@Param("query") String query, Pageable pageable);

    // FIXED: Added LEFT JOIN FETCH to load category data
    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.category WHERE p.ranking <= :n ORDER BY p.ranking ASC")
    List<Product> findTopNProducts(@Param("n") Integer n);

    @Query("SELECT p FROM Product p WHERE p.isBestseller = true ORDER BY p.ranking ASC")
    List<Product> findBestsellers();

    @Query("SELECT p FROM Product p WHERE p.price BETWEEN :minPrice AND :maxPrice")
    Page<Product> findByPriceRange(@Param("minPrice") BigDecimal minPrice,
                                   @Param("maxPrice") BigDecimal maxPrice,
                                   Pageable pageable);

    @Query("SELECT p FROM Product p WHERE p.rating >= :minRating")
    Page<Product> findByMinimumRating(@Param("minRating") BigDecimal minRating, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Product p")
    Long countAllProducts();

    @Query("SELECT AVG(p.price) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateAveragePrice();

    @Query("SELECT AVG(p.rating) FROM Product p WHERE p.rating IS NOT NULL")
    BigDecimal calculateAverageRating();

    @Query("SELECT SUM(p.reviewsCount) FROM Product p WHERE p.reviewsCount IS NOT NULL")
    Long sumTotalReviews();

    @Query(value = "SELECT * FROM products WHERE ranking = 1 ORDER BY asin LIMIT 1", nativeQuery = true)
    Optional<Product> findTopProduct();

    @Query("SELECT SUM(p.price) FROM Product p WHERE p.price IS NOT NULL")
    BigDecimal calculateTotalInventoryValue();

}