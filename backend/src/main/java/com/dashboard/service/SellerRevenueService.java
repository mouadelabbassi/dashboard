package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerRevenueService {

    private final OrderItemRepository orderItemRepository;
    private final SellerRevenueRepository revenueRepository;
    private final NotificationService notificationService;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.10"); // 10% platform fee

    @Transactional
    public void processConfirmedOrderItems(Order order) {
        for (OrderItem item : order.getItems()) {
            // Skip if already processed
            if (item.getSellerRevenueCalculated() != null && item.getSellerRevenueCalculated()) {
                continue;
            }

            // Only process items from sellers (not MouadVision products)
            if (item.getSeller() == null) {
                continue;
            }

            // Calculate revenue
            BigDecimal grossAmount = item.getSubtotal();
            BigDecimal platformFee = grossAmount.multiply(PLATFORM_FEE_RATE);
            BigDecimal netAmount = grossAmount.subtract(platformFee);

            // Create revenue record
            SellerRevenue revenue = SellerRevenue.builder()
                    .seller(item.getSeller())
                    .product(item.getProduct())
                    .orderItem(item)
                    .revenueDate(LocalDate.now())
                    .quantitySold(item.getQuantity())
                    .grossAmount(grossAmount)
                    .platformFee(platformFee)
                    .netAmount(netAmount)
                    .build();

            revenueRepository.save(revenue);

            // Mark as processed
            item.setSellerRevenueCalculated(true);
            orderItemRepository.save(item);

            // Send notification to seller
            notificationService.notifySellerProductPurchased(
                    item.getSeller(),
                    item.getProduct(),
                    order,
                    item.getQuantity()
            );

            log.info("Created revenue record for seller {} - Product {} - Amount: {}",
                    item.getSeller().getId(),
                    item.getProduct().getAsin(),
                    netAmount);
        }
    }

    @Transactional
    public void processAllUnprocessedRevenue() {
        List<User> sellers = orderItemRepository.findAll().stream()
                .map(OrderItem::getSeller)
                .filter(seller -> seller != null)
                .distinct()
                .toList();

        for (User seller : sellers) {
            List<OrderItem> unprocessedItems = orderItemRepository.findUnprocessedRevenueItems(seller);

            for (OrderItem item : unprocessedItems) {
                if (item.getOrder().getStatus() == Order.OrderStatus.CONFIRMED) {
                    processConfirmedOrderItems(item.getOrder());
                }
            }
        }
    }
}