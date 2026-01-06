package com.dashboard.service;

import com.dashboard.dto.request.ReviewRequest;
import com.dashboard.dto.response.ProductDetailResponse;
import com.dashboard.dto.response.ReviewResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.ProductReview;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.ProductReviewRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import com.dashboard.service.NotificationService;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository reviewRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional(readOnly = true)
    public ProductDetailResponse getProductDetail(String asin) {
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        User currentUser = null;
        ReviewResponse userReview = null;
        boolean userHasReviewed = false;

        try {
            currentUser = getCurrentUser();
            Optional<ProductReview> review = reviewRepository.findByUserIdAndProductAsin(currentUser.getId(), asin);
            if (review.isPresent()) {
                userHasReviewed = true;
                userReview = convertToResponse(review.get());
            }
        } catch (Exception e) {
        }

        Double avgRating = reviewRepository.calculateAverageRating(asin);
        Long totalReviews = reviewRepository.countByProductAsin(asin);
        Long likesCount = reviewRepository.countLikesByProductAsin(asin);
        Long dislikesCount = reviewRepository.countDislikesByProductAsin(asin);

        Map<Integer, Long> ratingDistribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        List<Object[]> distribution = reviewRepository.getRatingDistribution(asin);
        for (Object[] row : distribution) {
            ratingDistribution.put((Integer) row[0], (Long) row[1]);
        }

        Page<ProductReview> recentReviewsPage = reviewRepository
                .findByProductAsinOrderByCreatedAtDesc(asin, PageRequest.of(0, 5));
        List<ReviewResponse> recentReviews = recentReviewsPage.getContent().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());

        return ProductDetailResponse.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .description(product.getDescription())
                .price(product.getPrice())
                .averageRating(avgRating != null ?
                        BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP) : product.getRating())
                .totalReviews(totalReviews != null ? totalReviews.intValue() : product.getReviewsCount())
                .ranking(product.getRanking())
                .imageUrl(product.getImageUrl())
                .productLink(product.getProductLink())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categoryId(product.getCategory() != null ?  product.getCategory().getId() : null)
                .isBestseller(product.getIsBestseller())
                .userHasReviewed(userHasReviewed)
                .userReview(userReview)
                .likesCount(likesCount)
                .dislikesCount(dislikesCount)
                .ratingDistribution(ratingDistribution)
                .recentReviews(recentReviews)
                .sellerName(product.getSellerName())
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .isMouadVisionProduct(product.getSeller() == null)
                .build();
    }

    @Transactional
    public ReviewResponse createOrUpdateReview(String asin, ReviewRequest request) {
        User user = getCurrentUser();
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        Optional<ProductReview> existingReview = reviewRepository.findByUserIdAndProductAsin(user.getId(), asin);

        ProductReview review;
        boolean isNewReview = false;

        if (existingReview.isPresent()) {
            review = existingReview.get();
            review.setRating(request.getRating());
            review.setComment(request.getComment());
            review.setIsLiked(request.getIsLiked());
            log.info("Updating review for product {} by user {}", asin, user.getEmail());
        } else {
            review = ProductReview.builder()
                    .product(product)
                    .user(user)
                    .rating(request.getRating())
                    .comment(request.getComment())
                    .isLiked(request.getIsLiked())
                    .build();
            isNewReview = true;
            log.info("Creating new review for product {} by user {}", asin, user.getEmail());
        }

        review = reviewRepository.save(review);
        updateProductStats(product);

        if (isNewReview && product.getSeller() != null) {
            notificationService.notifySellerNewReview(product.getSeller(), product, review);
        }

        return convertToResponse(review);
    }



    @Transactional
    public void updateLikeStatus(String productAsin, boolean isLiked) {
        User user = getCurrentUser();

        Optional<ProductReview> existingReview = reviewRepository.findByUserIdAndProductAsin(user.getId(), productAsin);

        if (existingReview.isPresent()) {
            ProductReview review = existingReview.get();
            review.setIsLiked(isLiked);
            reviewRepository.save(review);
        } else {
            Product product = productRepository.findByAsin(productAsin)
                    .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", productAsin));

            ProductReview review = ProductReview.builder()
                    .product(product)
                    .user(user)
                    .rating(3)
                    .isLiked(isLiked)
                    .build();
            reviewRepository.save(review);
        }

        Product product = productRepository.findByAsin(productAsin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", productAsin));
        updateProductStats(product);
    }

    @Transactional
    public void deleteReview(String productAsin) {
        User user = getCurrentUser();

        ProductReview review = reviewRepository.findByUserIdAndProductAsin(user.getId(), productAsin)
                .orElseThrow(() -> new ResourceNotFoundException("Review", "productAsin", productAsin));

        Product product = review.getProduct();
        reviewRepository.delete(review);
        updateProductStats(product);

        log.info("Deleted review for product {} by user {}", productAsin, user.getEmail());
    }

    @Transactional(readOnly = true)
    public List<ReviewResponse> getUserReviews() {
        User user = getCurrentUser();
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(user.getId(), Pageable.unpaged())
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ReviewResponse> getProductReviews(String productAsin, Pageable pageable) {
        return reviewRepository.findByProductAsinOrderByCreatedAtDesc(productAsin, pageable)
                .map(this::convertToResponse);
    }

    private void updateProductStats(Product product) {
        Double newAvgRating = reviewRepository.calculateAverageRating(product.getAsin());
        Long newReviewCount = reviewRepository.countByProductAsin(product.getAsin());
        Long likesCount = reviewRepository.countLikesByProductAsin(product.getAsin());
        Long dislikesCount = reviewRepository.countDislikesByProductAsin(product.getAsin());

        if (newAvgRating != null) {
            product.setRating(BigDecimal.valueOf(newAvgRating).setScale(1, RoundingMode.HALF_UP));
        }
        if (newReviewCount != null) {
            product.setReviewsCount(newReviewCount.intValue());
        }

        product.setLikesCount(likesCount != null ? likesCount.intValue() : 0);
        product.setDislikesCount(dislikesCount != null ? dislikesCount.intValue() : 0);

        productRepository.save(product);
    }

    private ReviewResponse convertToResponse(ProductReview review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productAsin(review.getProduct().getAsin())
                .productName(review.getProduct().getProductName())
                .productImage(review.getProduct().getImageUrl())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .isLiked(review.getIsLiked())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}