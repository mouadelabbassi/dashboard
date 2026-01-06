package com.dashboard.service;

import com.dashboard.dto.request.SellerProductSubmissionRequest;
import com.dashboard.dto.request.SellerProfileUpdateRequest;
import com.dashboard.dto.response.*;
import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SellerProductRequestRepository productRequestRepository;
    private final SellerRevenueRepository revenueRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    private final ProductReviewRepository reviewRepository;
    private final SellerStockRepository sellerStockRepository;

    private User getCurrentSeller() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getRole() != User.Role.SELLER) {
            throw new BadRequestException("Only sellers can access this resource");
        }
        return user;
    }


    @Transactional
    public SellerProductRequestResponse submitProductForApproval(SellerProductSubmissionRequest request) {
        User seller = getCurrentSeller();

        if (! Boolean.TRUE.equals(seller.getIsVerifiedSeller())) {
            throw new BadRequestException("You must be verified by admin before adding products.  Please wait for verification or contact support.");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));

        SellerProductRequest productRequest = SellerProductRequest.builder()
                .seller(seller)
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .additionalImages(request.getAdditionalImages())
                .category(category)
                .status(SellerProductRequest.RequestStatus.PENDING)
                .build();

        productRequest = productRequestRepository.save(productRequest);
        log.info("Seller {} submitted product for approval:  {}", seller.getEmail(), request.getProductName());

        return convertToProductRequestResponse(productRequest);
    }

    @Transactional(readOnly = true)
    public Page<SellerProductRequestResponse> getMyProductRequests(Pageable pageable) {
        User seller = getCurrentSeller();
        return productRequestRepository.findBySellerOrderByCreatedAtDesc(seller, pageable)
                .map(this::convertToProductRequestResponse);
    }

    @Transactional(readOnly = true)
    public SellerProductRequestResponse getProductRequestById(Long requestId) {
        User seller = getCurrentSeller();
        SellerProductRequest request = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest", "id", requestId));

        if (! request.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only view your own product requests");
        }

        return convertToProductRequestResponse(request);
    }


    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyProducts(Pageable pageable) {
        User seller = getCurrentSeller();
        return productRepository.findBySellerOrderByCreatedAtDesc(seller, pageable)
                .map(this::convertToProductResponse);
    }

    @Transactional(readOnly = true)
    public Page<ProductResponse> getMyProductsByStatus(Product.ApprovalStatus status, Pageable pageable) {
        User seller = getCurrentSeller();
        return productRepository.findBySellerAndApprovalStatusOrderByCreatedAtDesc(seller, status, pageable)
                .map(this::convertToProductResponse);
    }

    @Transactional(readOnly = true)
    public ProductResponse getMyProductByAsin(String asin) {
        User seller = getCurrentSeller();
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() == null || ! product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only view your own products");
        }

        return convertToProductResponse(product);
    }

    @Transactional
    public ProductResponse updateMyProduct(String asin, SellerProductSubmissionRequest request) {
        User seller = getCurrentSeller();
        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only update your own products");
        }

        if (request.getProductName() != null) product.setProductName(request.getProductName());
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getPrice() != null) product.setPrice(request.getPrice());
        if (request.getStockQuantity() != null) product.setStockQuantity(request.getStockQuantity());
        if (request.getImageUrl() != null) product.setImageUrl(request.getImageUrl());

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category", "id", request.getCategoryId()));
            product.setCategory(category);
        }

        product = productRepository.save(product);
        log.info("Seller {} updated product: {}", seller.getEmail(), asin);

        return convertToProductResponse(product);
    }


    @Transactional(readOnly = true)
    public SellerDashboardResponse getDashboard() {
        User seller = getCurrentSeller();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);
        LocalDate sevenDaysAgo = today.minusDays(7);

        Long totalProducts = productRepository.countBySeller(seller);
        Long approvedProducts = productRepository.countBySellerAndApprovalStatus(seller, Product.ApprovalStatus.APPROVED);
        Long pendingProducts = productRepository.countBySellerAndApprovalStatus(seller, Product.ApprovalStatus.PENDING);
        Long totalSalesCount = productRepository.countTotalSalesBySeller(seller);

        BigDecimal totalRevenue = revenueRepository.calculateTotalRevenueBySeller(seller);
        BigDecimal monthlyRevenue = revenueRepository.calculateRevenueBetweenDates(seller, thirtyDaysAgo, today);
        BigDecimal weeklyRevenue = revenueRepository.calculateRevenueBetweenDates(seller, sevenDaysAgo, today);
        BigDecimal todayRevenue = revenueRepository.calculateDailyRevenue(seller.getId(), today);
        Long totalUnitsSold = revenueRepository.countTotalUnitsSold(seller);

        List<Object[]> dailyRevenue = revenueRepository.getDailyRevenueBreakdown(seller, thirtyDaysAgo, today);
        List<SellerDashboardResponse.DailyRevenuePoint> revenueTrend = dailyRevenue.stream()
                .map(row -> new SellerDashboardResponse.DailyRevenuePoint((LocalDate) row[0], (BigDecimal) row[1]))
                .collect(Collectors.toList());

        List<Object[]> topProductsData = revenueRepository.getProductRevenueBreakdown(seller, PageRequest.of(0, 5));
        List<SellerDashboardResponse.TopProductRevenue> topProducts = topProductsData.stream()
                .map(row -> new SellerDashboardResponse.TopProductRevenue(
                        (String) row[0],
                        (String) row[1],
                        ((Number) row[2]).longValue(),
                        (BigDecimal) row[3]
                ))
                .collect(Collectors.toList());

        Long pendingRequests = productRequestRepository.countBySellerAndStatus(seller, SellerProductRequest.RequestStatus.PENDING);

        return SellerDashboardResponse.builder()
                .sellerId(seller.getId())
                .storeName(seller.getStoreName())
                .isVerifiedSeller(seller.getIsVerifiedSeller())
                .totalProducts(totalProducts)
                .approvedProducts(approvedProducts)
                .pendingProducts(pendingProducts)
                .pendingRequests(pendingRequests)
                .totalSalesCount(totalSalesCount)
                .totalUnitsSold(totalUnitsSold)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .monthlyRevenue(monthlyRevenue != null ? monthlyRevenue : BigDecimal.ZERO)
                .weeklyRevenue(weeklyRevenue != null ?  weeklyRevenue : BigDecimal.ZERO)
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .revenueTrend(revenueTrend)
                .topProducts(topProducts)
                .build();
    }

    @Transactional
    public void deleteMyProduct(String asin) {
        User seller = getCurrentSeller();

        Product product = productRepository.findByAsin(asin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", asin));

        if (product.getSeller() == null || ! product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only remove your own products");
        }

        sellerStockRepository.deleteBySellerAndOriginalProductAsin(seller, asin);

        product.setApprovalStatus(Product.ApprovalStatus.REJECTED);
        product.setStockQuantity(0);
        product.setSeller(null);
        productRepository.save(product);

        log.info("Seller {} removed product {} from their store and stock", seller.getEmail(), asin);
    }


    @Transactional(readOnly = true)
    public Page<SellerOrderResponse> getMySoldOrders(Pageable pageable) {
        User seller = getCurrentSeller();
        Page<OrderItem> orderItems = orderItemRepository.findBySellerOrderByOrderCreatedAtDesc(seller, pageable);
        return orderItems.map(this::convertToSellerOrderResponse);
    }


    @Transactional(readOnly = true)
    public Page<ReviewResponse> getMyProductReviews(Pageable pageable) {
        User seller = getCurrentSeller();
        List<Product> myProducts = productRepository.findBySellerOrderByCreatedAtDesc(seller, Pageable.unpaged()).getContent();
        List<String> productAsins = myProducts.stream().map(Product::getAsin).collect(Collectors.toList());

        if (productAsins.isEmpty()) {
            return Page.empty(pageable);
        }

        return reviewRepository.findByProductAsinInOrderByCreatedAtDesc(productAsins, pageable)
                .map(this::convertToReviewResponse);
    }

    @Transactional(readOnly = true)
    public SellerReviewSummary getReviewSummary() {
        User seller = getCurrentSeller();
        List<Product> myProducts = productRepository.findBySellerOrderByCreatedAtDesc(seller, Pageable.unpaged()).getContent();
        List<String> productAsins = myProducts.stream().map(Product::getAsin).collect(Collectors.toList());

        if (productAsins.isEmpty()) {
            return SellerReviewSummary.builder()
                    .totalReviews(0L)
                    .averageRating(BigDecimal.ZERO)
                    .ratingDistribution(new HashMap<>())
                    .build();
        }

        Long totalReviews = reviewRepository.countByProductAsinIn(productAsins);
        Double avgRating = reviewRepository.calculateAverageRatingForProducts(productAsins);
        if (avgRating == null) avgRating = 0.0;

        Map<Integer, Long> distribution = new HashMap<>();
        for (int i = 1; i <= 5; i++) {
            distribution.put(i, 0L);
        }
        List<Object[]> ratingDist = reviewRepository.getRatingDistributionForProducts(productAsins);
        for (Object[] row : ratingDist) {
            distribution.put((Integer) row[0], (Long) row[1]);
        }

        return SellerReviewSummary.builder()
                .totalReviews(totalReviews)
                .averageRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .ratingDistribution(distribution)
                .build();
    }


    @Transactional(readOnly = true)
    public SellerProfileResponse getMyProfile() {
        User seller = getCurrentSeller();

        Long totalProducts = productRepository.countBySellerAndApprovalStatus(seller, Product.ApprovalStatus.APPROVED);
        BigDecimal totalRevenue = revenueRepository.calculateTotalRevenueBySeller(seller);
        Long totalSales = revenueRepository.countTotalUnitsSold(seller);

        List<Product> myProducts = productRepository.findBySellerOrderByCreatedAtDesc(seller, Pageable.unpaged()).getContent();
        List<String> productAsins = myProducts.stream().map(Product::getAsin).collect(Collectors.toList());
        Double avgRating = productAsins.isEmpty() ? 0.0 : reviewRepository.calculateAverageRatingForProducts(productAsins);
        if (avgRating == null) avgRating = 0.0;

        return SellerProfileResponse.builder()
                .id(seller.getId())
                .email(seller.getEmail())
                .fullName(seller.getFullName())
                .phone(seller.getPhone())
                .bio(seller.getBio())
                .profileImage(seller.getProfileImage())
                .storeName(seller.getStoreName())
                .storeDescription(seller.getStoreDescription())
                .businessAddress(seller.getBusinessAddress())
                .isVerifiedSeller(seller.getIsVerifiedSeller())
                .totalProducts(totalProducts)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .totalSales(totalSales)
                .averageRating(avgRating != null ? BigDecimal.valueOf(avgRating).setScale(1, RoundingMode.HALF_UP) : BigDecimal.ZERO)
                .memberSince(seller.getCreatedAt())
                .build();
    }

    @Transactional
    public SellerProfileResponse updateMyProfile(SellerProfileUpdateRequest request) {
        User seller = getCurrentSeller();

        if (request.getFullName() != null) seller.setFullName(request.getFullName());
        if (request.getPhone() != null) seller.setPhone(request.getPhone());
        if (request.getBio() != null) seller.setBio(request.getBio());
        if (request.getProfileImage() != null) seller.setProfileImage(request.getProfileImage());
        if (request.getStoreName() != null) seller.setStoreName(request.getStoreName());
        if (request.getStoreDescription() != null) seller.setStoreDescription(request.getStoreDescription());
        if (request.getBusinessAddress() != null) seller.setBusinessAddress(request.getBusinessAddress());

        userRepository.save(seller);
        log.info("Seller {} updated their profile", seller.getEmail());

        return getMyProfile();
    }


    private SellerProductRequestResponse convertToProductRequestResponse(SellerProductRequest request) {
        return SellerProductRequestResponse.builder()
                .id(request.getId())
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .categoryId(request.getCategory().getId())
                .categoryName(request.getCategory().getName())
                .status(request.getStatus().name())
                .statusDescription(request.getStatus().getDescription())
                .adminNotes(request.getAdminNotes())
                .rejectionReason(request.getRejectionReason())
                .generatedAsin(request.getGeneratedAsin())
                .createdAt(request.getCreatedAt())
                .reviewedAt(request.getReviewedAt())
                .build();
    }

    private ProductResponse convertToProductResponse(Product product) {
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
                .isBestseller(product.getIsBestseller())
                .salesCount(product.getSalesCount())
                .stockQuantity(product.getStockQuantity())
                .approvalStatus(product.getApprovalStatus().name())
                .sellerName(product.getSellerName())
                .sellerId(product.getSeller() != null ? product.getSeller().getId() : null)
                .createdAt(product.getCreatedAt())
                .build();
    }

    private SellerOrderResponse convertToSellerOrderResponse(OrderItem item) {
        return SellerOrderResponse.builder()
                .orderItemId(item.getId())
                .orderId(item.getOrder().getId())
                .orderNumber(item.getOrder().getOrderNumber())
                .productAsin(item.getProduct().getAsin())
                .productName(item.getProductName())
                .productImage(item.getProductImage())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .subtotal(item.getSubtotal())
                .buyerName(item.getOrder().getUser().getFullName())
                .orderStatus(item.getOrder().getStatus().name())
                .orderDate(item.getOrder().getOrderDate())
                .build();
    }

    private ReviewResponse convertToReviewResponse(ProductReview review) {
        return ReviewResponse.builder()
                .id(review.getId())
                .productAsin(review.getProduct().getAsin())
                .productName(review.getProduct().getProductName())
                .userId(review.getUser().getId())
                .userName(review.getUser().getFullName())
                .rating(review.getRating())
                .comment(review.getComment())
                .isLiked(review.getIsLiked())
                .helpfulCount(review.getHelpfulCount())
                .createdAt(review.getCreatedAt())
                .build();
    }
    
    
}