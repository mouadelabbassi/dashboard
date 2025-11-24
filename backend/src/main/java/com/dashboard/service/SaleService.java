package com.dashboard.service;

import com.dashboard.dto.request.SaleRequest;
import com.dashboard.dto.response.SaleResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.Sale;
import com.dashboard.entity.User;
import com.dashboard.exception.ResourceNotFoundException;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.SaleRepository;
import com.dashboard.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaleService {

    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<SaleResponse> getAllSales(Pageable pageable) {
        log.debug("Fetching all sales with pagination");
        return saleRepository.findAll(pageable)
                .map(this::convertToResponse);
    }

    @Transactional(readOnly = true)
    public SaleResponse getSaleById(Long id) {
        log.debug("Fetching sale with id: {}", id);
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        return convertToResponse(sale);
    }

    @Transactional
    public SaleResponse createSale(SaleRequest request) {
        log.info("Creating new sale for product: {}", request.getProductAsin());

        Product product = productRepository.findByAsin(request.getProductAsin())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "asin", request.getProductAsin()));

        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        Sale.SaleStatus status;
        try {
            status = Sale.SaleStatus.valueOf(request.getStatus().toUpperCase());
        } catch (IllegalArgumentException e) {
            status = Sale.SaleStatus.COMPLETED;
        }

        Sale sale = Sale.builder()
                .product(product)
                .user(user)
                .quantity(request.getQuantity())
                .unitPrice(request.getUnitPrice())
                .status(status)
                .build();

        sale = saleRepository.save(sale);
        log.info("Sale created successfully with id: {}", sale.getId());

        return convertToResponse(sale);
    }

    @Transactional
    public SaleResponse updateSale(Long id, SaleRequest request) {
        log.info("Updating sale with id: {}", id);

        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));

        if (request.getQuantity() != null) {
            sale.setQuantity(request.getQuantity());
        }

        if (request.getUnitPrice() != null) {
            sale.setUnitPrice(request.getUnitPrice());
        }

        if (request.getStatus() != null) {
            try {
                Sale.SaleStatus status = Sale.SaleStatus.valueOf(request.getStatus().toUpperCase());
                sale.setStatus(status);
            } catch (IllegalArgumentException e) {
                log.warn("Invalid status value: {}", request.getStatus());
            }
        }

        sale = saleRepository.save(sale);
        log.info("Sale updated successfully: {}", sale.getId());

        return convertToResponse(sale);
    }

    @Transactional
    public void deleteSale(Long id) {
        log.info("Deleting sale with id: {}", id);

        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));

        saleRepository.delete(sale);
        log.info("Sale deleted successfully: {}", id);
    }

    @Transactional(readOnly = true)
    public List<Object[]> getSalesByCategory() {
        log.debug("Fetching sales grouped by category");
        return saleRepository.getSalesByCategory();
    }

    @Transactional(readOnly = true)
    public List<Object[]> getMonthlySales(int year) {
        log.debug("Fetching monthly sales for year: {}", year);
        return saleRepository.getMonthlySales(year);
    }

    // ADD THIS NEW METHOD
    @Transactional(readOnly = true)
    public Map<String, Long> getMonthlySalesCount(int year) {
        log.debug("Fetching monthly sales count for year: {}", year);

        List<Object[]> results = saleRepository.getMonthlySalesCount(year);

        Map<String, Long> monthlySales = new HashMap<>();
        String[] months = {
                "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
                "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
        };

        // Initialize all months with 0
        for (String month : months) {
            monthlySales.put(month, 0L);
        }

        // Fill in actual data
        for (Object[] result : results) {
            Integer monthNumber = ((Number) result[0]).intValue();
            Long count = ((Number) result[1]).longValue();

            if (monthNumber >= 1 && monthNumber <= 12) {
                monthlySales.put(months[monthNumber - 1], count);
            }
        }

        log.debug("Monthly sales count: {}", monthlySales);
        return monthlySales;
    }

    @Transactional(readOnly = true)
    public BigDecimal getTotalRevenue() {
        log.debug("Calculating total revenue");
        BigDecimal revenue = saleRepository.calculateTotalRevenue();
        return revenue != null ? revenue : BigDecimal.ZERO;
    }

    private SaleResponse convertToResponse(Sale sale) {
        return SaleResponse.builder()
                .id(sale.getId())
                .productAsin(sale.getProduct().getAsin())
                .productName(sale.getProduct().getProductName())
                .userId(sale.getUser() != null ? sale.getUser().getId() : null)
                .userName(sale.getUser() != null ? sale.getUser().getFullName() : null)
                .quantity(sale.getQuantity())
                .unitPrice(sale.getUnitPrice())
                .totalAmount(sale.getTotalAmount())
                .saleDate(sale.getSaleDate())
                .status(sale.getStatus().name())
                .build();
    }
}