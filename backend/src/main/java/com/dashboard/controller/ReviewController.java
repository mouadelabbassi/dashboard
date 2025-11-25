package com.dashboard.controller;

import com.dashboard.dto.request.ReviewRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.ProductDetailResponse;
import com.dashboard.dto.response.ReviewResponse;
import com.dashboard.service.ReviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Tag(name = "Reviews", description = "Product reviews and ratings endpoints")
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping("/product/{asin}")
    @Operation(summary = "Get product detail with reviews", description = "Returns product details including reviews and user interaction status")
    public ResponseEntity<ApiResponse<ProductDetailResponse>> getProductDetail(@PathVariable String asin) {
        ProductDetailResponse detail = reviewService.getProductDetail(asin);
        return ResponseEntity.ok(ApiResponse.success("Product detail retrieved successfully", detail));
    }

    @GetMapping("/product/{asin}/all")
    @Operation(summary = "Get all reviews for a product", description = "Returns paginated reviews for a product")
    public ResponseEntity<ApiResponse<Page<ReviewResponse>>> getProductReviews(
            @PathVariable String asin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<ReviewResponse> reviews = reviewService.getProductReviews(asin, PageRequest.of(page, size));
        return ResponseEntity.ok(ApiResponse.success("Reviews retrieved successfully", reviews));
    }

    @PostMapping("/product/{asin}")
    @Operation(summary = "Create or update review", description = "Creates a new review or updates existing one")
    public ResponseEntity<ApiResponse<ReviewResponse>> createOrUpdateReview(
            @PathVariable String asin,
            @Valid @RequestBody ReviewRequest request) {
        ReviewResponse review = reviewService.createOrUpdateReview(asin, request);
        return ResponseEntity.ok(ApiResponse.success("Review saved successfully", review));
    }

    @PostMapping("/product/{asin}/like")
    @Operation(summary = "Like a product", description = "Marks the product as liked by the current user")
    public ResponseEntity<ApiResponse<String>> likeProduct(@PathVariable String asin) {
        reviewService.updateLikeStatus(asin, true);
        return ResponseEntity.ok(ApiResponse.success("Product liked successfully", "liked"));
    }

    @PostMapping("/product/{asin}/dislike")
    @Operation(summary = "Dislike a product", description = "Marks the product as disliked by the current user")
    public ResponseEntity<ApiResponse<String>> dislikeProduct(@PathVariable String asin) {
        reviewService.updateLikeStatus(asin, false);
        return ResponseEntity.ok(ApiResponse.success("Product disliked successfully", "disliked"));
    }

    @DeleteMapping("/product/{asin}")
    @Operation(summary = "Delete review", description = "Deletes the current user's review for a product")
    public ResponseEntity<ApiResponse<Void>> deleteReview(@PathVariable String asin) {
        reviewService.deleteReview(asin);
        return ResponseEntity.ok(ApiResponse.success("Review deleted successfully", null));
    }

    @GetMapping("/my-reviews")
    @Operation(summary = "Get user's reviews", description = "Returns all reviews by the current user")
    public ResponseEntity<ApiResponse<List<ReviewResponse>>> getUserReviews() {
        List<ReviewResponse> reviews = reviewService.getUserReviews();
        return ResponseEntity.ok(ApiResponse.success("User reviews retrieved successfully", reviews));
    }
}