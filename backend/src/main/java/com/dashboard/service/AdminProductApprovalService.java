package com.dashboard.service;

import com.dashboard.dto.request.ProductApprovalRequest;
import com.dashboard.dto.response.AdminDashboardResponse;
import com.dashboard.dto.response.PendingProductResponse;
import com.dashboard.dto.response.SellerProductRequestResponse;
import com.dashboard.entity.*;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminProductApprovalService {

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final SellerProductRequestRepository productRequestRepository;
    private final CategoryRepository categoryRepository;
    private final NotificationService notificationService;
    private final SellerRevenueRepository revenueRepository;
    private final OrderRepository orderRepository;
    private final PlatformRevenueRepository platformRevenueRepository;
    private final OrderItemRepository orderItemRepository;


    private User getCurrentAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getRole() != User.Role.ADMIN) {
            throw new BadRequestException("Only admins can access this resource");
        }
        return user;
    }


    @Transactional(readOnly = true)
    public Page<PendingProductResponse> getPendingProductRequests(Pageable pageable) {
        getCurrentAdmin();
        return productRequestRepository.findByStatusOrderByCreatedAtDesc(
                        SellerProductRequest.RequestStatus.PENDING, pageable)
                .map(this::convertToPendingResponse);
    }

    @Transactional(readOnly = true)
    public PendingProductResponse getProductRequestDetails(Long requestId) {
        getCurrentAdmin();
        SellerProductRequest request = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest", "id", requestId));
        return convertToPendingResponse(request);
    }

    @Transactional
    public SellerProductRequestResponse approveProduct(Long requestId, ProductApprovalRequest approvalRequest) {
        User admin = getCurrentAdmin();

        SellerProductRequest request = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest", "id", requestId));

        if (request.getStatus() != SellerProductRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        String asin = generateUniqueAsin();

        Product product = Product.builder()
                .asin(asin)
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .category(request.getCategory())
                .seller(request.getSeller())
                .approvalStatus(Product.ApprovalStatus.APPROVED)
                .submittedAt(request.getCreatedAt())
                .approvedAt(LocalDateTime.now())
                .approvedBy(admin.getId())
                .rating(BigDecimal.ZERO)
                .reviewsCount(0)
                .salesCount(0)
                .likesCount(0)
                .dislikesCount(0)
                .build();

        product = productRepository.save(product);

        // Update the request
        request.setStatus(SellerProductRequest.RequestStatus.APPROVED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        request.setGeneratedAsin(asin);
        request.setAdminNotes(approvalRequest.getAdminNotes());
        productRequestRepository.save(request);

        notificationService.notifySellerProductApproved(request.getSeller(), product);

        log.info("Admin {} approved product request {} - Created product with ASIN: {}",
                admin.getEmail(), requestId, asin);

        return convertToRequestResponse(request);
    }

    @Transactional
    public SellerProductRequestResponse rejectProduct(Long requestId, ProductApprovalRequest approvalRequest) {
        User admin = getCurrentAdmin();

        SellerProductRequest request = productRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("ProductRequest", "id", requestId));

        if (request.getStatus() != SellerProductRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        if (approvalRequest.getRejectionReason() == null || approvalRequest.getRejectionReason().isBlank()) {
            throw new BadRequestException("Rejection reason is required");
        }

        request.setStatus(SellerProductRequest.RequestStatus.REJECTED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(approvalRequest.getRejectionReason());
        request.setAdminNotes(approvalRequest.getAdminNotes());
        productRequestRepository.save(request);

        // Create a dummy product for notification (not saved)
        Product dummyProduct = Product.builder()
                .asin("REJECTED")
                .productName(request.getProductName())
                .build();

        notificationService.notifySellerProductRejected(request.getSeller(), dummyProduct, approvalRequest.getRejectionReason());

        log.info("Admin {} rejected product request {}: {}",
                admin.getEmail(), requestId, approvalRequest.getRejectionReason());

        return convertToRequestResponse(request);
    }


    @Transactional(readOnly = true)
    public AdminDashboardResponse getAdminDashboard() {
        getCurrentAdmin();
        LocalDate today = LocalDate.now();
        LocalDate thirtyDaysAgo = today.minusDays(30);

        BigDecimal totalPlatformRevenue = platformRevenueRepository.calculateTotalPlatformRevenue();
        BigDecimal directSalesRevenue = platformRevenueRepository.calculateDirectSalesRevenue();
        BigDecimal commissionRevenue = platformRevenueRepository.calculateCommissionRevenue();
        BigDecimal totalPlatformFees = platformRevenueRepository.calculateTotalPlatformFees();


        Long totalProducts = productRepository.countApprovedProducts();
        Long pendingApprovals = productRequestRepository.countPendingRequests();

        Long totalSellers = userRepository.countByRole(User.Role.SELLER);
        Long totalBuyers = userRepository.countByRole(User.Role.BUYER);



        Long totalSales = orderItemRepository.countTotalSalesFromConfirmedOrders();
        Long platformSales = orderItemRepository.countPlatformSalesFromConfirmedOrders();
        Long sellerSales = orderItemRepository.countSellerSalesFromConfirmedOrders();

        BigDecimal todayRevenue = orderRepository.calculateTodayRevenue();
        Long todayOrders = orderRepository.countTodayOrders();

        return AdminDashboardResponse.builder()
                .totalProducts(totalProducts)
                .pendingApprovals(pendingApprovals)
                .totalSellers(totalSellers)
                .totalBuyers(totalBuyers)
                .totalPlatformRevenue(totalPlatformRevenue != null ? totalPlatformRevenue : BigDecimal.ZERO)
                .totalPlatformFees(totalPlatformFees != null ?  totalPlatformFees : BigDecimal.ZERO)
                .todayRevenue(todayRevenue != null ? todayRevenue : BigDecimal.ZERO)
                .todayOrders(todayOrders)
                .build();
    }

    // ========== ALL PRODUCT REQUESTS (for history) ==========

    @Transactional(readOnly = true)
    public Page<SellerProductRequestResponse> getAllProductRequests(Pageable pageable) {
        getCurrentAdmin();
        return productRequestRepository.findAll(pageable)
                .map(this::convertToRequestResponse);
    }

    @Transactional(readOnly = true)
    public Page<SellerProductRequestResponse> getProductRequestsByStatus(
            SellerProductRequest.RequestStatus status, Pageable pageable) {
        getCurrentAdmin();
        return productRequestRepository.findByStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::convertToRequestResponse);
    }

    // ========== HELPERS ==========

    private String generateUniqueAsin() {
        String asin;
        do {
            asin = "SLR" + UUID.randomUUID().toString().substring(0, 7).toUpperCase();
        } while (productRepository.existsByAsin(asin));
        return asin;
    }

    private PendingProductResponse convertToPendingResponse(SellerProductRequest request) {
        return PendingProductResponse.builder()
                .id(request.getId())
                .productName(request.getProductName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getStockQuantity())
                .imageUrl(request.getImageUrl())
                .categoryId(request.getCategory().getId())
                .categoryName(request.getCategory().getName())
                .sellerId(request.getSeller().getId())
                .sellerName(request.getSeller().getFullName())
                .sellerStoreName(request.getSeller().getStoreName())
                .sellerEmail(request.getSeller().getEmail())
                .submittedAt(request.getCreatedAt())
                .build();
    }

    private SellerProductRequestResponse convertToRequestResponse(SellerProductRequest request) {
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
}