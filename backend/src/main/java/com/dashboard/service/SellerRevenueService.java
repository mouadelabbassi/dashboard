package com.dashboard.service;

import com.dashboard.entity.*;
import com.dashboard.repository.*;
import lombok. RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java. util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerRevenueService {

    private final OrderItemRepository orderItemRepository;
    private final SellerRevenueRepository revenueRepository;

    private static final BigDecimal PLATFORM_FEE_RATE = new BigDecimal("0.10");

    @Transactional
    public void processConfirmedOrderItems(Order order) {
        log.info("Processing revenue for order: {} with {} items",
                order.getOrderNumber(), order. getItems().size());

        for (OrderItem item : order.getItems()) {
            log.info("Processing item ID: {}, Seller: {}, Already processed: {}",
                    item.getId(),
                    item. getSeller() != null ? item. getSeller().getEmail() : "NO SELLER",
                    item.getSellerRevenueCalculated());

            // Skip if already processed
            if (Boolean.TRUE.equals(item.getSellerRevenueCalculated())) {
                log.info("Skipping item {} - already processed", item. getId());
                continue;
            }

            // Skip if no seller (MouadVision product)
            if (item.getSeller() == null) {
                log.info("Skipping item {} - no seller (platform product)", item.getId());
                item.setSellerRevenueCalculated(true);
                orderItemRepository.save(item);
                continue;
            }

            // Check if revenue already exists
            if (revenueRepository.existsByOrderItemId(item.getId())) {
                log.info("Skipping item {} - revenue already exists", item. getId());
                item.setSellerRevenueCalculated(true);
                orderItemRepository.save(item);
                continue;
            }

            try {
                BigDecimal grossAmount = item.getSubtotal();
                BigDecimal platformFee = grossAmount.multiply(PLATFORM_FEE_RATE);
                BigDecimal netAmount = grossAmount. subtract(platformFee);

                SellerRevenue revenue = SellerRevenue.builder()
                        .seller(item.getSeller())
                        . product(item.getProduct())
                        . order(order)
                        .orderItem(item)
                        .revenueDate(LocalDate.now())
                        . quantitySold(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .grossAmount(grossAmount)
                        .platformFee(platformFee)
                        . netAmount(netAmount)
                        . build();

                revenueRepository.save(revenue);

                item.setSellerRevenueCalculated(true);
                orderItemRepository.save(item);

                log.info("SUCCESS: Created revenue for seller {} - Product {} - Net: ${}",
                        item.getSeller(). getEmail(),
                        item. getProduct().getAsin(),
                        netAmount);

            } catch (Exception e) {
                log.error("FAILED to create revenue for item {}: {}", item. getId(), e.getMessage(), e);
                throw e;
            }
        }

        log.info("Revenue processing completed for order: {}", order.getOrderNumber());
    }

    @Transactional
    public void processAllUnprocessedRevenue() {
        log.info("Processing all unprocessed revenue...");

        List<User> sellers = orderItemRepository.findAll(). stream()
                . map(OrderItem::getSeller)
                .filter(seller -> seller != null)
                . distinct()
                .toList();

        for (User seller : sellers) {
            List<OrderItem> unprocessedItems = orderItemRepository.findUnprocessedRevenueItems(seller);
            for (OrderItem item : unprocessedItems) {
                if (item.getOrder().getStatus() == Order.OrderStatus. CONFIRMED) {
                    processConfirmedOrderItems(item.getOrder());
                }
            }
        }
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