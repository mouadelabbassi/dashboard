package com.dashboard.util;

import com.dashboard.entity.Category;
import com.dashboard.entity.Product;
import com.opencsv.CSVReader;
import com.opencsv.exceptions.CsvException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.util.*;

@Slf4j
@Component
public class CsvHelper {

    public Set<String> extractUniqueCategoriesFromBytes(byte[] csvData) throws IOException, CsvException {
        try (InputStream inputStream = new ByteArrayInputStream(csvData)) {
            return extractUniqueCategories(inputStream);
        }
    }

    public List<Product> parseProductsFromBytes(byte[] csvData, Map<String, Category> categoryMap)
            throws IOException, CsvException {
        try (InputStream inputStream = new ByteArrayInputStream(csvData)) {
            return parseCsvFile(inputStream, categoryMap);
        }
    }

    public List<Product> parseCsvFile(InputStream inputStream, Map<String, Category> categoryMap)
            throws IOException, CsvException {
        List<Product> products = new ArrayList<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> records = reader.readAll();

            // Skip header
            for (int i = 1; i < records.size(); i++) {
                String[] record = records.get(i);

                try {
                    Product product = parseProductFromCsvRecord(record, categoryMap);
                    if (product != null) {
                        products.add(product);
                    }
                } catch (Exception e) {
                    log.warn("Failed to parse product at line {}: {}", i + 1, e.getMessage());
                }
            }
        }

        log.info("Successfully parsed {} products from CSV", products.size());
        return products;
    }

    private Product parseProductFromCsvRecord(String[] record, Map<String, Category> categoryMap) {
        if (record.length < 11) {
            log.warn("Invalid CSV record - insufficient columns");
            return null;
        }

        try {
            String asin = cleanString(record[0]);
            String categoryName = cleanString(record[1]);
            String productLink = cleanString(record[2]);
            Integer noOfSellers = parseInteger(record[3]);
            Integer ranking = parseInteger(record[4]);
            BigDecimal rating = parseBigDecimal(record[5]);
            Integer reviewsCount = parseInteger(record[6]);
            BigDecimal price = parseBigDecimal(record[7]);
            String productName = cleanString(record[8]);
            String description = cleanString(record[9]);
            String imageUrl = cleanString(record[10]);

            // Validate required fields
            if (asin == null || asin.isEmpty()) {
                log.warn("Skipping product with empty ASIN");
                return null;
            }

            // Get or create category
            Category category = categoryMap.get(categoryName);

            return Product.builder()
                    .asin(asin)
                    .productName(productName != null ? productName : "Unknown Product")
                    .description(description)
                    .price(price)
                    .rating(rating)
                    .reviewsCount(reviewsCount)
                    .ranking(ranking)
                    .noOfSellers(noOfSellers)
                    .productLink(productLink)
                    .imageUrl(imageUrl)
                    .category(category)
                    .isBestseller(ranking != null && ranking <= 10)
                    .build();

        } catch (Exception e) {
            log.error("Error parsing product record: {}", e.getMessage());
            return null;
        }
    }

    private String cleanString(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }

    private Integer parseInteger(String value) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return null;
            }
            return Integer.parseInt(value.trim());
        } catch (NumberFormatException e) {
            log.debug("Failed to parse integer: {}", value);
            return null;
        }
    }

    private BigDecimal parseBigDecimal(String value) {
        try {
            if (value == null || value.trim().isEmpty()) {
                return null;
            }
            return new BigDecimal(value.trim());
        } catch (NumberFormatException e) {
            log.debug("Failed to parse decimal: {}", value);
            return null;
        }
    }

    public Set<String> extractUniqueCategories(InputStream inputStream) throws IOException, CsvException {
        Set<String> categories = new HashSet<>();

        try (CSVReader reader = new CSVReader(new InputStreamReader(inputStream))) {
            List<String[]> records = reader.readAll();

            // Skip header
            for (int i = 1; i < records.size(); i++) {
                String[] record = records.get(i);
                if (record.length > 1 && record[1] != null && !record[1].trim().isEmpty()) {
                    categories.add(record[1].trim());
                }
            }
        }

        log.info("Extracted {} unique categories", categories.size());
        return categories;
    }
}