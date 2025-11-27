package com.dashboard.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProfileUpdateRequest {
    private String fullName;
    private String phone;
    private String bio;
    private String profileImage;
    private String storeName;
    private String storeDescription;
    private String businessAddress;
}