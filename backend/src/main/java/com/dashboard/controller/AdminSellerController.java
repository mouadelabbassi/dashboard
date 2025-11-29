package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.entity.User;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.SellerRevenueRepository;
import com.dashboard.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/admin/sellers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Seller Management", description = "Admin endpoints for managing sellers")
public class AdminSellerController {

    private final UserRepository userRepository;
    private final SellerRevenueRepository sellerRevenueRepository;

    @GetMapping
    @Operation(summary = "Get all sellers", description = "Returns paginated list of all sellers")
    public ResponseEntity<ApiResponse<Page<Map<String, Object>>>> getAllSellers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean verified) {

        Pageable pageable = PageRequest.of(page, size);
        Page<User> sellers;

        if (verified != null) {
            sellers = userRepository.findByRoleAndIsVerifiedSeller(User.Role.SELLER, verified, pageable);
        } else {
            sellers = userRepository.findByRole(User.Role.SELLER, pageable);
        }

        Page<Map<String, Object>> sellerData = sellers.map(this::mapSellerToResponse);

        return ResponseEntity.ok(ApiResponse.success("Sellers retrieved successfully", sellerData));
    }

    @GetMapping("/{sellerId}")
    @Operation(summary = "Get seller details", description = "Returns detailed information about a seller")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSellerDetails(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        return ResponseEntity.ok(ApiResponse.success("Seller details retrieved", mapSellerToResponse(seller)));
    }

    @GetMapping("/top-performers")
    @Operation(summary = "Get top performing sellers", description = "Returns sellers ranked by revenue and products sold")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getTopPerformers(
            @RequestParam(defaultValue = "10") int limit) {

        List<Object[]> topSellers = sellerRevenueRepository.getTopSellersByRevenue(Pageable.ofSize(limit));

        List<Map<String, Object>> result = topSellers.stream().map(row -> {
            Map<String, Object> seller = new HashMap<>();
            seller.put("sellerId", row[0]);
            seller.put("sellerName", row[1]);
            seller.put("storeName", row[2]);
            seller.put("totalRevenue", row[3] != null ? ((BigDecimal) row[3]).doubleValue() : 0.0);
            seller.put("totalProductsSold", row[4] != null ?  ((Long) row[4]).intValue() : 0);
            seller.put("totalOrders", row[5] != null ? ((Long) row[5]).intValue() : 0);
            return seller;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Top performers retrieved", result));
    }

    @PostMapping("/{sellerId}/verify")
    @Operation(summary = "Verify a seller", description = "Marks a seller as verified")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifySeller(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        seller.setIsVerifiedSeller(true);
        userRepository.save(seller);

        log.info("Seller {} has been verified", seller.getEmail());

        return ResponseEntity.ok(ApiResponse.success("Seller verified successfully", mapSellerToResponse(seller)));
    }

    @PostMapping("/{sellerId}/unverify")
    @Operation(summary = "Unverify a seller", description = "Removes verification from a seller")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unverifySeller(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        seller.setIsVerifiedSeller(false);
        userRepository.save(seller);

        log.info("Seller {} verification has been removed", seller.getEmail());

        return ResponseEntity.ok(ApiResponse.success("Seller unverified successfully", mapSellerToResponse(seller)));
    }

    @DeleteMapping("/{sellerId}")
    @Operation(summary = "Deactivate a seller", description = "Deactivates a seller account")
    public ResponseEntity<ApiResponse<String>> deactivateSeller(@PathVariable Long sellerId) {
        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResourceNotFoundException("Seller", "id", sellerId));

        if (seller.getRole() != User.Role.SELLER) {
            throw new ResourceNotFoundException("Seller", "id", sellerId);
        }

        seller.setIsActive(false);
        userRepository.save(seller);

        log.info("Seller {} has been deactivated", seller.getEmail());

        return ResponseEntity.ok(ApiResponse.success("Seller deactivated successfully", "deactivated"));
    }

    private Map<String, Object> mapSellerToResponse(User seller) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", seller.getId());
        map.put("email", seller.getEmail());
        map.put("fullName", seller.getFullName());
        map.put("phone", seller.getPhone());
        map.put("storeName", seller.getStoreName());
        map.put("storeDescription", seller.getStoreDescription());
        map.put("businessAddress", seller.getBusinessAddress());
        map.put("isVerifiedSeller", seller.getIsVerifiedSeller());
        map.put("isActive", seller.getIsActive());
        map.put("profileImage", seller.getProfileImage());
        map.put("createdAt", seller.getCreatedAt());
        return map;
    }
}