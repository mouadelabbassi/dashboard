package com.dashboard.dto.response;

import com.dashboard.entity.SellerStock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerStockResponse {
    private Long id;
    private String originalProductAsin;
    private String originalProductName;
    private String originalProductImage;
    private BigDecimal originalPrice;
    private BigDecimal purchasePrice;
    private Integer quantity;
    private Integer availableQuantity;
    private String status;
    private String statusDescription;
    private Long orderId;
    private String orderNumber;
    private Long categoryId;
    private String categoryName;
    private String description;
    private LocalDateTime purchasedAt;
    private LocalDateTime updatedAt;
    private BigDecimal potentialProfit;
    private BigDecimal suggestedResalePrice;

    public static SellerStockResponse fromEntity(SellerStock stock) {
        BigDecimal suggestedPrice = stock.getPurchasePrice()
                .multiply(BigDecimal.valueOf(1.25)); // 25% markup suggestion

        return SellerStockResponse.builder()
                .id(stock.getId())
                .originalProductAsin(stock.getOriginalProductAsin())
                .originalProductName(stock.getOriginalProductName())
                .originalProductImage(stock.getOriginalProductImage())
                .originalPrice(stock.getOriginalPrice())
                .purchasePrice(stock.getPurchasePrice())
                .quantity(stock.getQuantity())
                .availableQuantity(stock.getAvailableQuantity())
                .status(stock.getStatus().name())
                .statusDescription(stock.getStatus().getDescription())
                .orderId(stock.getOrderId())
                .orderNumber(stock.getOrderNumber())
                .categoryId(stock.getCategory() != null ? stock.getCategory().getId() : null)
                .categoryName(stock.getCategory() != null ? stock.getCategory().getName() : null)
                .description(stock.getDescription())
                .purchasedAt(stock.getPurchasedAt())
                .updatedAt(stock.getUpdatedAt())
                .suggestedResalePrice(suggestedPrice)
                .potentialProfit(suggestedPrice.subtract(stock.getPurchasePrice())
                        .multiply(BigDecimal.valueOf(stock.getAvailableQuantity())))
                .build();
    }
}