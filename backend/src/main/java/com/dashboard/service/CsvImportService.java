package com.dashboard.service;

import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.dashboard.repository.CategoryRepository;
import com.dashboard.repository.ProductRepository;
import com.dashboard.util.CsvHelper;
import com.opencsv.exceptions.CsvException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CsvImportService implements CommandLineRunner {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final CsvHelper csvHelper;
    private final ResourceLoader resourceLoader;

    @Value("${csv.import.file-path}")
    private String csvFilePath;

    @Value("${csv.import.batch-size}")
    private int batchSize;

    @Value("${csv.import.auto-import-on-startup}")
    private boolean autoImportOnStartup;

    @Override
    public void run(String... args) throws Exception {
        if (autoImportOnStartup) {
            // Check if data already exists
            long productCount = productRepository.count();
            if (productCount == 0) {
                log.info("No products found in database. Starting CSV import...");
                importCsvFromResources();
            } else {
                log.info("Database already contains {} products. Skipping auto-import.", productCount);
            }
        }
    }

    @Transactional
    public void importCsvFromResources() {
        try {
            Resource resource = resourceLoader.getResource(csvFilePath);
            if (resource.exists()) {
                // Read the resource once into memory
                byte[] csvData = resource.getInputStream().readAllBytes();

                // Use the data for import
                importCsvDataFromBytes(csvData);
                log.info("CSV import from resources completed successfully");
            } else {
                log.warn("CSV file not found at: {}", csvFilePath);
            }
        } catch (Exception e) {
            log.error("Error importing CSV from resources", e);
        }
    }

    @Transactional
    public Map<String, Object> importCsvFile(MultipartFile file) throws IOException, CsvException {
        log.info("Starting CSV import from uploaded file: {}", file.getOriginalFilename());

        byte[] csvData = file.getBytes();
        return importCsvDataFromBytes(csvData);
    }

    @Transactional
    public Map<String, Object> importCsvDataFromBytes(byte[] csvData) throws IOException, CsvException {
        long startTime = System.currentTimeMillis();

        // Step 1: Extract unique categories from the first pass
        log.info("Step 1: Extracting unique categories...");
        Set<String> categoryNames = csvHelper.extractUniqueCategoriesFromBytes(csvData);

        // Step 2: Create or get existing categories
        log.info("Step 2: Creating categories...");
        Map<String, Category> categoryMap = createCategories(categoryNames);

        // Step 3: Parse and import products from the second pass
        log.info("Step 3: Parsing products from CSV...");
        List<Product> products = csvHelper.parseProductsFromBytes(csvData, categoryMap);

        // Step 4: Save products in batches
        log.info("Step 4: Saving products in batches...");
        int savedCount = 0;
        int updatedCount = 0;
        int skippedCount = 0;

        for (int i = 0; i < products.size(); i += batchSize) {
            int end = Math.min(i + batchSize, products.size());
            List<Product> batch = products.subList(i, end);

            for (Product product : batch) {
                try {
                    Optional<Product> existing = productRepository.findByAsin(product.getAsin());
                    if (existing.isPresent()) {
                        // Update existing product
                        Product existingProduct = existing.get();
                        updateProductFromImport(existingProduct, product);
                        productRepository.save(existingProduct);
                        updatedCount++;
                    } else {
                        // Save new product
                        productRepository.save(product);
                        if (product.getCategory() != null) {
                            product.getCategory().incrementProductCount();
                        }
                        savedCount++;
                    }
                } catch (Exception e) {
                    log.error("Error saving product {}: {}", product.getAsin(), e.getMessage());
                    skippedCount++;
                }
            }

            // Save category counts
            categoryMap.values().forEach(categoryRepository::save);

            log.info("Processed batch {}/{}", end, products.size());
        }

        long endTime = System.currentTimeMillis();
        long duration = (endTime - startTime) / 1000;

        log.info("CSV import completed - Created: {}, Updated: {}, Skipped: {}, Duration: {}s",
                savedCount, updatedCount, skippedCount, duration);

        Map<String, Object> result = new HashMap<>();
        result.put("categoriesCreated", categoryMap.size());
        result.put("productsCreated", savedCount);
        result.put("productsUpdated", updatedCount);
        result.put("productsSkipped", skippedCount);
        result.put("totalProcessed", products.size());
        result.put("durationSeconds", duration);

        return result;
    }

    private Map<String, Category> createCategories(Set<String> categoryNames) {
        Map<String, Category> categoryMap = new HashMap<>();

        for (String name : categoryNames) {
            Optional<Category> existing = categoryRepository.findByName(name);
            if (existing.isPresent()) {
                categoryMap.put(name, existing.get());
            } else {
                Category category = Category.builder()
                        .name(name)
                        .description("Imported from CSV")
                        .productCount(0)
                        .build();
                category = categoryRepository.save(category);
                categoryMap.put(name, category);
                log.debug("Created category: {}", name);
            }
        }

        log.info("Categories ready: {} total", categoryMap.size());
        return categoryMap;
    }

    private void updateProductFromImport(Product existing, Product imported) {
        existing.setProductName(imported.getProductName());
        existing.setDescription(imported.getDescription());
        existing.setPrice(imported.getPrice());
        existing.setRating(imported.getRating());
        existing.setReviewsCount(imported.getReviewsCount());
        existing.setRanking(imported.getRanking());
        existing.setNoOfSellers(imported.getNoOfSellers());
        existing.setProductLink(imported.getProductLink());
        existing.setImageUrl(imported.getImageUrl());

        // Update category if changed
        if (imported.getCategory() != null &&
                (existing.getCategory() == null || !existing.getCategory().getId().equals(imported.getCategory().getId()))) {
            if (existing.getCategory() != null) {
                existing.getCategory().decrementProductCount();
            }
            existing.setCategory(imported.getCategory());
            imported.getCategory().incrementProductCount();
        }
    }
}