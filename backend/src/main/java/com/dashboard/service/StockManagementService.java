package com.dashboard.service;

import com.dashboard.entity.Product;
import com.dashboard.entity.StockUpdateRequest;
import com.dashboard.entity.User;
import com.dashboard.exception.BadRequestException;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.StockUpdateRequestRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockManagementService {

    private final StockUpdateRequestRepository stockRequestRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
    }

    @Transactional
    public StockUpdateRequest requestStockUpdate(String productAsin, Integer quantity, String reason) {
        User seller = getCurrentUser();

        if (seller.getRole() != User.Role.SELLER) {
            throw new BadRequestException("Only sellers can request stock updates");
        }

        Product product = productRepository.findByAsin(productAsin)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", productAsin));

        if (product.getSeller() == null || !product.getSeller().getId().equals(seller.getId())) {
            throw new BadRequestException("You can only update stock for your own products");
        }

        StockUpdateRequest request = StockUpdateRequest.builder()
                .product(product)
                .seller(seller)
                .requestedQuantity(quantity)
                .currentStockAtRequest(product.getStockQuantity())
                .reason(reason)
                .status(StockUpdateRequest.RequestStatus.PENDING)
                .build();

        request = stockRequestRepository.save(request);

        // ✅ Notify all admins
        notificationService.notifyAdminsStockUpdateRequest(seller, product, quantity);

        log.info("Seller {} requested stock update for product {} (+{} units)",
                seller.getEmail(), productAsin, quantity);

        return request;
    }

    @Transactional
    public void approveStockRequest(Long requestId, String adminNotes) {
        User admin = getCurrentUser();

        StockUpdateRequest request = stockRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock request", "id", requestId));

        if (request.getStatus() != StockUpdateRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        Product product = request.getProduct();
        product.addStock(request.getRequestedQuantity());
        productRepository.save(product);

        request.setStatus(StockUpdateRequest.RequestStatus.APPROVED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        request.setAdminNotes(adminNotes);
        stockRequestRepository.save(request);

        // ✅ Notify seller
        notificationService.notifySellerStockApproved(request.getSeller(), product, request.getRequestedQuantity());

        log.info("Admin {} approved stock request {} (+{} units for {})",
                admin.getEmail(), requestId, request.getRequestedQuantity(), product.getAsin());
    }

    @Transactional
    public void rejectStockRequest(Long requestId, String rejectionReason, String adminNotes) {
        User admin = getCurrentUser();

        StockUpdateRequest request = stockRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock request", "id", requestId));

        if (request.getStatus() != StockUpdateRequest.RequestStatus.PENDING) {
            throw new BadRequestException("This request has already been processed");
        }

        request.setStatus(StockUpdateRequest.RequestStatus.REJECTED);
        request.setReviewedBy(admin);
        request.setReviewedAt(LocalDateTime.now());
        request.setAdminNotes(adminNotes);
        stockRequestRepository.save(request);

        // ✅ Notify seller
        notificationService.notifySellerStockRejected(request.getSeller(), request.getProduct(), rejectionReason);

        log.info("Admin {} rejected stock request {}: {}",
                admin.getEmail(), requestId, rejectionReason);
    }

    public Page<StockUpdateRequest> getPendingStockRequests(Pageable pageable) {
        return stockRequestRepository.findByStatusOrderByCreatedAtDesc(
                StockUpdateRequest.RequestStatus.PENDING, pageable);
    }

    public Long getPendingStockRequestCount() {
        return stockRequestRepository.countPendingRequests();
    }

    public Page<StockUpdateRequest> getMyStockRequests(Pageable pageable) {
        User seller = getCurrentUser();
        return stockRequestRepository.findBySellerOrderByCreatedAtDesc(seller, pageable);
    }
}