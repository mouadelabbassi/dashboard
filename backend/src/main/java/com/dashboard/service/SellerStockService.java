package com.dashboard.service;

import com.dashboard.dto.request.ListFromStockRequest;
import com.dashboard.dto.response.SellerStockResponse;
import com.dashboard.dto.response.StockDashboardResponse;
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
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerStockService {

    private final SellerStockRepository stockRepository;
    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final SellerProductRequestRepository productRequestRepository;
    private final NotificationService notificationService;

    private User getCurrentSeller() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("User not found"));
        if (user.getRole() != User.Role.SELLER) {
            throw new BadRequestException("Only sellers can access stock management");
        }
        return user;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public SellerStock addToStock(User seller, Product product, Order order, int quantity, BigDecimal purchasePrice) {
        Optional<SellerStock> existingStock = stockRepository.findBySellerAndOriginalProductAsin(seller, product.getAsin());

        if (existingStock.isPresent()) {
            SellerStock stock = existingStock.get();
            int oldQuantity = stock.getQuantity();
            int oldAvailable = stock.getAvailableQuantity();

            stock.setQuantity(oldQuantity + quantity);
            stock.setAvailableQuantity(oldAvailable + quantity);

            if (purchasePrice != null && stock.getPurchasePrice() != null) {
                BigDecimal totalOldValue = stock.getPurchasePrice().multiply(BigDecimal.valueOf(oldQuantity));
                BigDecimal totalNewValue = purchasePrice.multiply(BigDecimal.valueOf(quantity));
                BigDecimal averagePrice = totalOldValue.add(totalNewValue)
                        .divide(BigDecimal.valueOf(oldQuantity + quantity), 2, RoundingMode.HALF_UP);
                stock.setPurchasePrice(averagePrice);
            }

            if (stock.getAvailableQuantity() > 0) {
                if (stock.getAvailableQuantity() < stock.getQuantity()) {
                    stock.setStatus(SellerStock.StockStatus.PARTIALLY_LISTED);
                } else {
                    stock.setStatus(SellerStock.StockStatus.IN_STOCK);
                }
            }

            stock = stockRepository.save(stock);
            log.info("Updated existing stock for seller {}: product {} now has {} units (added {})",
                    seller.getEmail(), product.getAsin(), stock.getQuantity(), quantity);

            return stock;
        } else {
            SellerStock stock = SellerStock.builder()
                    .seller(seller)
                    .originalProductAsin(product.getAsin())
                    .originalProductName(product.getProductName())
                    .originalProductImage(product.getImageUrl())
                    .originalPrice(product.getPrice())
                    .purchasePrice(purchasePrice)
                    .quantity(quantity)
                    .availableQuantity(quantity)
                    .orderId(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .category(product.getCategory())
                    .description(product.getDescription())
                    .status(SellerStock.StockStatus.IN_STOCK)
                    .build();

            stock = stockRepository.save(stock);
            log.info("Added {} units of {} to seller {} stock (new entry)", quantity, product.getAsin(), seller.getEmail());

            return stock;
        }
    }

    @Transactional(readOnly = true)
    public StockDashboardResponse getStockDashboard() {
        User seller = getCurrentSeller();

        Long totalItems = stockRepository.countBySeller(seller);
        Long availableItems = stockRepository.countAvailableBySeller(seller);
        Long totalUnits = stockRepository.sumAvailableQuantityBySeller(seller);
        BigDecimal totalInvestment = stockRepository.calculateTotalInvestmentBySeller(seller);

        BigDecimal estimatedValue = totalInvestment != null
                ? totalInvestment.multiply(BigDecimal.valueOf(1.25))
                : BigDecimal.ZERO;

        BigDecimal potentialProfit = estimatedValue.subtract(
                totalInvestment != null ?  totalInvestment : BigDecimal.ZERO);

        return StockDashboardResponse.builder()
                .totalStockItems(totalItems != null ? totalItems : 0L)
                .availableStockItems(availableItems != null ? availableItems : 0L)
                .totalUnitsInStock(totalUnits != null ? totalUnits : 0L)
                .totalUnitsAvailable(totalUnits != null ?  totalUnits : 0L)
                .totalInvestment(totalInvestment != null ? totalInvestment : BigDecimal.ZERO)
                .estimatedValue(estimatedValue)
                .potentialProfit(potentialProfit)
                .build();
    }


    @Transactional(readOnly = true)
    public Page<SellerStockResponse> getMyStock(Pageable pageable) {
        User seller = getCurrentSeller();
        return stockRepository.findBySellerOrderByPurchasedAtDesc(seller, pageable)
                .map(SellerStockResponse::fromEntity);
    }


    @Transactional(readOnly = true)
    public List<SellerStockResponse> getAvailableStock() {
        User seller = getCurrentSeller();
        return stockRepository.findBySellerAndAvailableQuantityGreaterThanOrderByPurchasedAtDesc(seller, 0)
                .stream()
                .map(SellerStockResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SellerStockResponse getStockById(Long stockId) {
        User seller = getCurrentSeller();
        SellerStock stock = stockRepository.findByIdAndSeller(stockId, seller)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", "id", stockId));
        return SellerStockResponse.fromEntity(stock);
    }

    @Transactional
    public SellerProductRequest listFromStock(ListFromStockRequest request) {
        User seller = getCurrentSeller();

        SellerStock stock = stockRepository.findByIdAndSeller(request.getStockId(), seller)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", "id", request.getStockId()));

        if (stock.getAvailableQuantity() < request.getQuantity()) {
            throw new BadRequestException(
                    String.format("Not enough stock available.Available: %d, Requested: %d",
                            stock.getAvailableQuantity(), request.getQuantity()));
        }

        if (request.getPrice().compareTo(stock.getPurchasePrice()) < 0) {
            log.warn("Seller {} listing product below purchase price", seller.getEmail());
        }

        Category category = stock.getCategory();
        if (request.getCategoryId() != null) {
            category = categoryRepository.findById(request.getCategoryId())
                    .orElse(stock.getCategory());
        }
        SellerProductRequest productRequest = SellerProductRequest.builder()
                .seller(seller)
                .productName(request.getCustomProductName() != null
                        ? request.getCustomProductName()
                        : stock.getOriginalProductName())
                .description(request.getCustomDescription() != null
                        ? request.getCustomDescription()
                        : stock.getDescription())
                .price(request.getPrice())
                .stockQuantity(request.getQuantity())
                .imageUrl(request.getCustomImageUrl() != null
                        ? request.getCustomImageUrl()
                        : stock.getOriginalProductImage())
                .category(category)
                .status(SellerProductRequest.RequestStatus.PENDING)
                .sourceStockId(stock.getId())
                .build();

        productRequest = productRequestRepository.save(productRequest);
        stock.decreaseAvailableQuantity(request.getQuantity());
        stockRepository.save(stock);

        log.info("Seller {} listed {} units from stock {} at price {}",
                seller.getEmail(), request.getQuantity(), stock.getId(), request.getPrice());
        notificationService.notifyAdminsNewProductSubmission(productRequest);

        return productRequest;
    }

    @Transactional(readOnly = true)
    public Page<SellerStockResponse> searchStock(String query, Pageable pageable) {
        User seller = getCurrentSeller();
        return stockRepository.searchBySellerAndQuery(seller, query, pageable)
                .map(SellerStockResponse::fromEntity);
    }

    @Transactional
    public void returnToStock(Long stockId, int quantity) {
        SellerStock stock = stockRepository.findById(stockId)
                .orElseThrow(() -> new ResourceNotFoundException("Stock item", "id", stockId));
        stock.increaseAvailableQuantity(quantity);
        stockRepository.save(stock);
        log.info("Returned {} units to stock {}", quantity, stockId);
    }
}