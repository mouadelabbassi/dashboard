package com.dashboard.repository;

import com.dashboard.entity.ProductReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

    Optional<ProductReview> findByUserIdAndProductAsin(Long userId, String productAsin);

    Page<ProductReview> findByProductAsinOrderByCreatedAtDesc(String productAsin, Pageable pageable);

    Page<ProductReview> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    Long countByProductAsin(String productAsin);

    @Modifying
    @Query("DELETE FROM ProductReview r WHERE r. product.asin = :asin")
    void deleteByProductAsin(@Param("asin") String asin);

    @Query("SELECT AVG(r.rating) FROM ProductReview r WHERE r.product.asin = :asin")
    Double calculateAverageRating(@Param("asin") String asin);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin = :asin AND r.isLiked = true")
    Long countLikesByProductAsin(@Param("asin") String asin);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin = :asin AND r.isLiked = false")
    Long countDislikesByProductAsin(@Param("asin") String asin);

    @Query("SELECT r.rating, COUNT(r) FROM ProductReview r WHERE r.product.asin = :asin GROUP BY r.rating")
    List<Object[]> getRatingDistribution(@Param("asin") String asin);

    @Query("SELECT r FROM ProductReview r WHERE r.product.asin IN :asins ORDER BY r.createdAt DESC")
    Page<ProductReview> findByProductAsinInOrderByCreatedAtDesc(@Param("asins") List<String> asins, Pageable pageable);

    @Query("SELECT COUNT(r) FROM ProductReview r WHERE r.product.asin IN :asins")
    Long countByProductAsinIn(@Param("asins") List<String> asins);

    @Query("SELECT COALESCE(AVG(r.rating), 0.0) FROM ProductReview r WHERE r.product.asin IN :asins")
    Double calculateAverageRatingForProducts(@Param("asins") List<String> asins);

    @Query("SELECT r.rating, COUNT(r) FROM ProductReview r WHERE r.product.asin IN :asins GROUP BY r.rating")
    List<Object[]> getRatingDistributionForProducts(@Param("asins") List<String> asins);
}