package com.dashboard.dto. response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math. BigDecimal;
import java.time. LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileResponse {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String bio;
    private String profileImage;
    private String storeName;
    private String storeDescription;
    private String businessAddress;
    private Boolean isVerifiedSeller;
    private Long totalProducts;
    private BigDecimal totalRevenue;
    private Long totalSales;
    private BigDecimal averageRating;
    private LocalDateTime memberSince;
}