package com.dashboard.controller;

import com.dashboard.dto.request.SaleRequest;
import com.dashboard.dto.response.ApiResponse;
import com.dashboard.dto.response.SaleResponse;
import com.dashboard.entity.Product;
import com.dashboard.entity.Sale;
import com.dashboard.entity.User;
import com.dashboard.repository.ProductRepository;
import com.dashboard.repository.SaleRepository;
import com.dashboard.repository.UserRepository;
import com.dashboard.service.SaleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

@Slf4j
@RestController
@RequestMapping("/api/sales")
@RequiredArgsConstructor
@Tag(name = "Sales", description = "Sales management endpoints")
public class SaleController {

    private final SaleService saleService;
    private final SaleRepository saleRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    @Operation(summary = "Get all sales", description = "Returns paginated list of all sales")
    public ResponseEntity<ApiResponse<Page<SaleResponse>>> getAllSales(
            @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort by field") @RequestParam(defaultValue = "saleDate") String sortBy,
            @Parameter(description = "Sort direction (asc/desc)") @RequestParam(defaultValue = "desc") String direction) {

        Sort.Direction sortDirection = direction.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));

        Page<SaleResponse> sales = saleService.getAllSales(pageable);
        return ResponseEntity.ok(ApiResponse.success("Sales retrieved successfully", sales));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get sale by ID", description = "Returns a single sale by its ID")
    public ResponseEntity<ApiResponse<SaleResponse>> getSaleById(
            @Parameter(description = "Sale ID") @PathVariable Long id) {

        SaleResponse sale = saleService.getSaleById(id);
        return ResponseEntity.ok(ApiResponse.success("Sale retrieved successfully", sale));
    }

    @PostMapping
    @Operation(summary = "Create sale", description = "Creates a new sale record")
    public ResponseEntity<ApiResponse<SaleResponse>> createSale(
            @Valid @RequestBody SaleRequest request) {

        SaleResponse sale = saleService.createSale(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Sale created successfully", sale));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update sale", description = "Updates an existing sale")
    public ResponseEntity<ApiResponse<SaleResponse>> updateSale(
            @Parameter(description = "Sale ID") @PathVariable Long id,
            @Valid @RequestBody SaleRequest request) {

        SaleResponse sale = saleService.updateSale(id, request);
        return ResponseEntity.ok(ApiResponse.success("Sale updated successfully", sale));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete sale", description = "Deletes a sale by ID")
    public ResponseEntity<ApiResponse<Void>> deleteSale(
            @Parameter(description = "Sale ID") @PathVariable Long id) {

        saleService.deleteSale(id);
        return ResponseEntity.ok(ApiResponse.success("Sale deleted successfully", null));
    }

    @GetMapping("/by-category")
    @Operation(summary = "Get sales by category", description = "Returns sales grouped by category")
    public ResponseEntity<ApiResponse<Map<String, BigDecimal>>> getSalesByCategory() {
        List<Object[]> results = saleService.getSalesByCategory();

        Map<String, BigDecimal> salesByCategory = new HashMap<>();
        for (Object[] result : results) {
            String categoryName = (String) result[0];
            BigDecimal totalSales = (BigDecimal) result[1];
            salesByCategory.put(categoryName, totalSales);
        }

        return ResponseEntity.ok(ApiResponse.success("Sales by category retrieved successfully", salesByCategory));
    }

    // REPLACE the existing /monthly endpoint with this:
    @GetMapping("/monthly")
    @Operation(summary = "Get monthly sales", description = "Returns monthly sales count for a specific year")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getMonthlySalesCount(
            @Parameter(description = "Year") @RequestParam(defaultValue = "2025") int year) {

        Map<String, Long> monthlySales = saleService.getMonthlySalesCount(year);
        return ResponseEntity.ok(ApiResponse.success("Monthly sales retrieved successfully", monthlySales));
    }

    @GetMapping("/revenue")
    @Operation(summary = "Get total revenue", description = "Returns total revenue from all completed sales")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalRevenue() {
        BigDecimal revenue = saleService.getTotalRevenue();
        return ResponseEntity.ok(ApiResponse.success("Total revenue retrieved successfully", revenue));
    }

    @PostMapping("/generate-sample")
    @Operation(summary = "Generate sample sales data", description = "Creates sample sales for testing")
    public ResponseEntity<ApiResponse<String>> generateSampleSales() {
        try {
            log.info("Starting sample sales generation...");

            // Get all products
            List<Product> products = productRepository.findAll();
            if (products.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("No products found. Please import products first."));
            }

            log.info("Found {} products", products.size());

            // Get or create a sample user
            User user = userRepository.findByEmail("admin@dashboard.com")
                    .orElseGet(() -> {
                        log.info("Creating sample admin user...");
                        User newUser = User.builder()
                                .email("admin@dashboard.com")
                                .password(passwordEncoder.encode("admin123"))
                                .fullName("Admin User")
                                .role(User.Role.ADMIN)
                                .isActive(true)
                                .build();
                        return userRepository.save(newUser);
                    });

            log.info("Using user: {}", user.getEmail());

            // Generate random sales for the past 12 months
            Random random = new Random();
            int salesCreated = 0;
            int currentYear = LocalDateTime.now().getYear();

            for (int month = 0; month < 12; month++) {
                int salesThisMonth = 50 + random.nextInt(100); // 50-150 sales per month

                for (int i = 0; i < salesThisMonth; i++) {
                    Product randomProduct = products.get(random.nextInt(products.size()));

                    int quantity = 1 + random.nextInt(5);
                    BigDecimal unitPrice = randomProduct.getPrice() != null
                            ? randomProduct.getPrice()
                            : new BigDecimal("10.00");

                    Sale sale = Sale.builder()
                            .product(randomProduct)
                            .user(user)
                            .quantity(quantity)
                            .unitPrice(unitPrice)
                            .status(Sale.SaleStatus.COMPLETED)
                            .build();

                    // Set sale date to random day in the month
                    LocalDateTime saleDate = LocalDateTime.of(currentYear, 12 - month, 1, 0, 0)
                            .plusDays(random.nextInt(28));
                    sale.setSaleDate(saleDate);

                    saleRepository.save(sale);
                    salesCreated++;
                }

                log.info("Generated {} sales for month {}", salesThisMonth, 12 - month);
            }

            log.info("Total sales created: {}", salesCreated);

            return ResponseEntity.ok(ApiResponse.success(
                    "Sample sales generated successfully",
                    salesCreated + " sales created across 12 months"
            ));

        } catch (Exception e) {
            log.error("Error generating sample sales", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error generating sample sales: " + e.getMessage()));
        }
    }
}