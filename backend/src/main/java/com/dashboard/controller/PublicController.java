package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.ProductResponse;
import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final ProductRepository productRepository;

    @GetMapping("/products")
    public ResponseEntity<ApiResponse<Page<ProductResponse>>> getPublicProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size
    ) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "rating"));

        Page<Product> products = productRepository.findAll((root, query, cb) ->
                        cb.equal(root.get("approvalStatus"), Product.ApprovalStatus.APPROVED),
                pageable
        );

        Page<ProductResponse> response = products.map(this::convertToResponse);

        return ResponseEntity.ok(ApiResponse.success("Products retrieved successfully", response));
    }

    private ProductResponse convertToResponse(Product product) {
        return ProductResponse.builder()
                .asin(product.getAsin())
                .productName(product.getProductName())
                .description(product.getDescription())
                .price(product.getPrice())
                .rating(product.getRating())
                .reviewsCount(product.getReviewsCount())
                .ranking(product.getRanking())
                .imageUrl(product.getImageUrl())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .stockQuantity(product.getStockQuantity())
                .salesCount(product.getSalesCount())
                .sellerName(product.getSellerName())
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .isBestseller(product.getIsBestseller())
                .build();
    }
}