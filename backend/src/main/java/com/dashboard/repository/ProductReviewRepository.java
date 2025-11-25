package com.dashboard.repository;

import com.dashboard.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    // Find review by user and product
    Optional<ProductReview> findByUserIdAndProductAsin(Long userId, String productAsin);

    // Check if user has reviewed product
    boolean existsByUserIdAndProductAsin(Long userId, String productAsin);

    // Get all reviews for a product
    Page<ProductReview> findByProductAsinOrderByCreatedAtDesc(String productAsin, Pageable pageable);

    // Get all reviews by a user
    List<ProductReview> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Calculate average rating for a product
    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.asin = :productAsin")
    Double calculateAverageRating(@Param("productAsin") String productAsin);

    // Count reviews for a product
    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin = :productAsin")
    Long countByProductAsin(@Param("productAsin") String productAsin);

    // Count likes for a product
    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin = :productAsin AND r.isLiked = true")
    Long countLikesByProductAsin(@Param("productAsin") String productAsin);

    // Count dislikes for a product
    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin = :productAsin AND r.isLiked = false")
    Long countDislikesByProductAsin(@Param("productAsin") String productAsin);

    // Get rating distribution for a product
    @Query("SELECT r.rating, COUNT(r) FROM ProductReview r WHERE r.product.asin = :productAsin GROUP BY r.rating ORDER BY r.rating DESC")
    List<Object[]> getRatingDistribution(@Param("productAsin") String productAsin);
}