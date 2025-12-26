package com.dashboard.service;

import com.dashboard.dto.request.ProductRequest;
import com.dashboard.dto.response.ProductResponse;
import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.exception.DuplicateResourceException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        log.debug("Fetching all products with pagination");

        return productRepository.findAll(pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getProductByAsin(String asin) {
        log.debug("Fetching product with ASIN: {}", asin);

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        return convertToResponse(product);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        log.debug("Searching products with query: {}", query);

        return productRepository.searchProducts(query, pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> filterProducts(String categoryName, BigDecimal minPrice,
                                                BigDecimal maxPrice, BigDecimal minRating,
                                                Pageable pageable) {
        log.debug("Filtering products with category: {}, price: {}-{}, rating: {}",
                categoryName, minPrice, maxPrice, minRating);

        Specification<Product> spec = Specification.where(null);

        if (categoryName != null && !categoryName.isEmpty()) {
            spec = spec.and((root, query, cb) ->
                    cb.equal(root.get("category").get("name"), categoryName));
        }

        if (minPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("price"), minPrice));
        }

        if (maxPrice != null) {
            spec = spec.and((root, query, cb) ->
                    cb.lessThanOrEqualTo(root.get("price"), maxPrice));
        }

        if (minRating != null) {
            spec = spec.and((root, query, cb) ->
                    cb.greaterThanOrEqualTo(root.get("rating"), minRating));
        }

        return productRepository.findAll(spec, pageable)
                .map(this::convertToResponse);
    }
    @Transactional(readOnly = true)
    public List<ProductResponse> getTopProducts(Integer n) {
        log.debug("Fetching top {} products", n);

        return productRepository.findTopNProducts(n).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getProductsByCategory(Long categoryId, Pageable pageable) {
        log.debug("Fetching products for category: {}", categoryId);

        return productRepository.findByCategoryId(categoryId, pageable)
                .map(this::convertToResponse);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product with ASIN: {}", request.getAsin());

        if (productRepository.findByAsin(request.getAsin()).isPresent()) {
            throw new DuplicateResourceException("Product already exists with ASIN: " + request.getAsin());
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        Product product = Product.builder()
                .asin(request.getAsin())
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .rating(request.getRating())
                .reviewsCount(request.getReviewsCount())
                .ranking(request.getRanking())
                .noOfSellers(request.getNoOfSellers())
                .productLink(request.getProductLink())
                .imageUrl(request.getImageUrl())
                .category(category)
                .stockQuantity(request.getStockQuantity() != null ? request.getStockQuantity() : 0)
                .build();

        product = productRepository.save(product);
        category.incrementProductCount();
        categoryRepository.save(category);

        log.info("Product created successfully: {}", product.getAsin());

        return convertToResponse(product);
    }

//    @Transactional
//    public ProductResponse updateProductDTO (String asin, ProductUpdateRequestDTO updateRequest) {
//        log.info("Updating product: {}", asin);
//
//        Product product = productRepository.findByAsin(asin)
//                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + asin));
//
//        // ✅ FIXED: Track price changes BEFORE updating
//        if (updateRequest.getPrice() != null &&
//                updateRequest.getPrice().compareTo(product.getPrice()) != 0) {
//
//            mlTrackingService.trackPriceChange(
//                    asin,
//                    product.getPrice(),
//                    updateRequest.getPrice(),
//                    "MANUAL_UPDATE"
//            );
//        }
//
//        // Update fields
//        if (updateRequest.getPrice() != null) {
//            product.setPrice(updateRequest.getPrice());
//        }
//        if (updateRequest.getProductName() != null) {
//            product.setProductName(updateRequest.getProductName());
//        }
//        if (updateRequest.getStockQuantity() != null) {
//            product.setStockQuantity(updateRequest.getStockQuantity());
//        }
//        if (updateRequest.getCategoryId() != null) {
//            Category category = categoryRepository.findById(updateRequest.getCategoryId())
//                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
//            product.setCategory(category);
//        }
//        if (updateRequest.getDescription() != null) {
//            product.setDescription(updateRequest.getDescription());
//        }
//        if (updateRequest.getImageUrl() != null) {
//            product.setImageUrl(updateRequest.getImageUrl());
//        }
//
//        Product updatedProduct = productRepository.save(product);
//        log.info("✅ Product updated successfully: {}", asin);
//
//        return convertToResponse(product);
//    }

    @Transactional
    public ProductResponse updateProduct(String asin, ProductRequest request) {
        log.info("Updating product with ASIN: {}", asin);

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (request.getProductName() != null) {
            product.setProductName(request.getProductName());
        }

        if (request.getDescription() != null) {
            product.setDescription(request.getDescription());
        }
        if (request.getPrice() != null) {
            product.setPrice(request.getPrice());
        }
        if (request.getRating() != null) {
            product.setRating(request.getRating());
        }
        if (request.getReviewsCount() != null) {
            product.setReviewsCount(request.getReviewsCount());
        }
        if (request.getRanking() != null) {
            product.setRanking(request.getRanking());
        }
        if (request.getNoOfSellers() != null) {
            product.setNoOfSellers(request.getNoOfSellers());
        }
        if (request.getProductLink() != null) {
            product.setProductLink(request.getProductLink());
        }
        if (request.getImageUrl() != null) {
            product.setImageUrl(request.getImageUrl());
        }
        if (request.getStockQuantity() != null) {
            product.setStockQuantity(request.getStockQuantity());
        }

        if (request.getCategoryId() != null && !request.getCategoryId().equals(product.getCategory().getId())) {
            Category oldCategory = product.getCategory();
            Category newCategory = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

            oldCategory.decrementProductCount();
            categoryRepository.save(oldCategory);

            product.setCategory(newCategory);
            newCategory.incrementProductCount();
            categoryRepository.save(newCategory);
        }

        product = productRepository.save(product);
        log.info("Product updated successfully: {}", product.getAsin());

        return convertToResponse(product);
    }

    @Transactional
    public void deleteProduct(String asin) {
        log.info("Deleting product with ASIN: {}", asin);

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        Category category = product.getCategory();
        category.decrementProductCount();
        categoryRepository.save(category);

        productRepository.delete(product);
        log.info("Product deleted successfully: {}", asin);
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
                .productLink(product.getProductLink())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)

                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .sellerName(product.getSellerName())  // Uses the helper method from Product entity
                .sellerStoreName(product.getSeller() != null ? product.getSeller().getStoreName() : null)
                .isMouadVisionProduct(product.isMouadVisionProduct())


                .stockQuantity(product.getStockQuantity())
                .salesCount(product.getSalesCount())
                .approvalStatus(product.getApprovalStatus() != null ? product.getApprovalStatus().name() : null)

                .isBestseller(product.getIsBestseller())
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }

}