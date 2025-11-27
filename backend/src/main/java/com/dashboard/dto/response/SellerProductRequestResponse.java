package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time. LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductRequestResponse {
    private Long id;
    private String productName;
    private String description;
    private BigDecimal price;
    private Integer stockQuantity;
    private String imageUrl;
    private Long categoryId;
    private String categoryName;
    private String status;
    private String statusDescription;
    private String adminNotes;
    private String rejectionReason;
    private String generatedAsin;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}