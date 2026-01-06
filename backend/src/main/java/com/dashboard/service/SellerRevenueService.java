package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerRevenueService {

    private final OrderItemRepository orderItemRepository;
    private final SellerRevenueRepository revenueRepository;
    private final PlatformRevenueRepository platformRevenueRepository;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.10");

    @Transactional
    public void processConfirmedOrderItems(Order order) {
        log.info("Processing revenue for order: {} with {} items",
                order.getOrderNumber(), order.getItems().size());

        for (OrderItem item : order.getItems()) {
            log.info("Processing item ID: {}, Product: {}, Seller: {}",
                    item.getId(),
                    item.getProduct().getAsin(),
                    item.getSeller() != null ? item.getSeller().getEmail() : "PLATFORM (MouadVision)");

            if (Boolean.TRUE.equals(item.getSellerRevenueCalculated())) {
                log.info("Skipping item {} - already processed", item.getId());
                continue;
            }

            try {
                BigDecimal grossAmount = item.getSubtotal();

                if (item.getSeller() == null) {
                    log.info("Processing PLATFORM product - 100% revenue to MouadVision");

                    PlatformRevenue platformRevenue = PlatformRevenue.builder()
                            .order(order)
                            .orderItem(item)
                            .product(item.getProduct())
                            .revenueDate(LocalDate.now())
                            .quantitySold(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .grossAmount(grossAmount)
                            .revenueType(PlatformRevenue.RevenueType.DIRECT_SALE)
                            .description("Direct sale - MouadVision product")
                            .build();

                    platformRevenueRepository.save(platformRevenue);

                    log.info("SUCCESS: Platform revenue created for MouadVision product - Amount: ${}",
                            grossAmount);

                } else {
                    log.info("Processing SELLER product - 10% commission to platform");

                    if (revenueRepository.existsByOrderItemId(item.getId())) {
                        log.info("Skipping item {} - seller revenue already exists", item.getId());
                        item.setSellerRevenueCalculated(true);
                        orderItemRepository.save(item);
                        continue;
                    }

                    BigDecimal platformFee = grossAmount.multiply(PLATFORM_FEE_RATE)
                            .setScale(2, RoundingMode.HALF_UP);
                    BigDecimal sellerNetAmount = grossAmount.subtract(platformFee);

                    SellerRevenue sellerRevenue = SellerRevenue.builder()
                            .seller(item.getSeller())
                            .product(item.getProduct())
                            .order(order)
                            .orderItem(item)
                            .revenueDate(LocalDate.now())
                            .quantitySold(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .grossAmount(grossAmount)
                            .platformFeePercent(new BigDecimal("10"))
                            .platformFee(platformFee)
                            .netAmount(sellerNetAmount)
                            .build();

                    revenueRepository.save(sellerRevenue);

                    PlatformRevenue platformCommission = PlatformRevenue.builder()
                            .order(order)
                            .orderItem(item)
                            .product(item.getProduct())
                            .seller(item.getSeller())
                            .revenueDate(LocalDate.now())
                            .quantitySold(item.getQuantity())
                            .unitPrice(item.getUnitPrice())
                            .grossAmount(platformFee)
                            .revenueType(PlatformRevenue.RevenueType.COMMISSION)
                            .description("10% commission from seller: " + item.getSeller().getStoreName())
                            .build();

                    platformRevenueRepository.save(platformCommission);

                    log.info("SUCCESS: Revenue split - Seller {} gets ${}, Platform gets ${}",
                            item.getSeller().getEmail(),
                            sellerNetAmount,
                            platformFee);
                }

                item.setSellerRevenueCalculated(true);
                orderItemRepository.save(item);

            } catch (Exception e) {
                log.error("FAILED to create revenue for item {}: {}", item.getId(), e.getMessage(), e);
                throw e;
            }
        }

        log.info("Revenue processing completed for order: {}", order.getOrderNumber());
    }

    @Transactional(readOnly = true)
    public BigDecimal getSellerTotalRevenue(User seller) {
        return revenueRepository.calculateTotalRevenueBySeller(seller);
    }

    @Transactional(readOnly = true)
    public BigDecimal getSellerRevenueForPeriod(User seller, LocalDate startDate, LocalDate endDate) {
        return revenueRepository.calculateRevenueBetweenDates(seller, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public Long getSellerTotalUnitsSold(User seller) {
        return revenueRepository.countTotalUnitsSold(seller);
    }
}