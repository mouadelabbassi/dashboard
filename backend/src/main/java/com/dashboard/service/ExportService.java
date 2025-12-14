package com.dashboard.service;

import com.dashboard.entity.Product;
import com.dashboard.repository.ProductRepository;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExportService {

    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public byte[] exportProductsToCsv() throws IOException {
        log.info("Exporting products to CSV");

        List<Product> products = productRepository.findAll();

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter osw = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
             CSVWriter writer = new CSVWriter(osw)) {

            // Write header
            String[] header = {"ASIN", "Category", "Product Link", "No of Sellers", "Ranking",
                    "Rating", "Reviews Count", "Price", "Product Name", "Description", "Image URL"};
            writer.writeNext(header);

            // Write data
            for (Product product : products) {
                String[] data = {
                        product.getAsin(),
                        product.getCategory() != null ? product.getCategory().getName() : "",
                        product.getProductLink() != null ? product.getProductLink() : "",
                        product.getNoOfSellers() != null ? product.getNoOfSellers().toString() : "",
                        product.getRanking() != null ? product.getRanking().toString() : "",
                        product.getRating() != null ? product.getRating().toString() : "",
                        product.getReviewsCount() != null ? product.getReviewsCount().toString() : "",
                        product.getPrice() != null ? product.getPrice().toString() : "",
                        product.getProductName() != null ? product.getProductName() : "",
                        product.getDescription() != null ? product.getDescription() : "",
                        product.getImageUrl() != null ? product.getImageUrl() : ""
                };
                writer.writeNext(data);
            }

            writer.flush();
            log.info("Exported {} products to CSV", products.size());
            return baos.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportProductsToExcel() throws IOException {
        log.info("Exporting products to Excel");

        List<Product> products = productRepository.findAll();

        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            Sheet sheet = workbook.createSheet("Products");

            // Create header style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);

            // Create header row
            Row headerRow = sheet.createRow(0);
            String[] headers = {"ASIN", "Category", "Product Name", "Price", "Rating",
                    "Reviews", "Ranking", "Sellers", "Bestseller"};

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fill data
            int rowNum = 1;
            for (Product product : products) {
                Row row = sheet.createRow(rowNum++);

                row.createCell(0).setCellValue(product.getAsin());
                row.createCell(1).setCellValue(product.getCategory() != null ? product.getCategory().getName() : "");
                row.createCell(2).setCellValue(product.getProductName() != null ? product.getProductName() : "");
                row.createCell(3).setCellValue(product.getPrice() != null ? product.getPrice().doubleValue() : 0.0);
                row.createCell(4).setCellValue(product.getRating() != null ? product.getRating().doubleValue() : 0.0);
                row.createCell(5).setCellValue(product.getReviewsCount() != null ? product.getReviewsCount() : 0);
                row.createCell(6).setCellValue(product.getRanking() != null ? product.getRanking() : 0);
                row.createCell(7).setCellValue(product.getNoOfSellers() != null ? product.getNoOfSellers() : 0);
                row.createCell(8).setCellValue(product.getIsBestseller() != null && product.getIsBestseller() ? "Yes" : "No");
            }

            // Auto-size columns
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(baos);
            log.info("Exported {} products to Excel", products.size());
            return baos.toByteArray();
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportSalesToCsv() throws IOException {
        log.info("Exporting sales to CSV");


        try (ByteArrayOutputStream baos = new ByteArrayOutputStream();
             OutputStreamWriter osw = new OutputStreamWriter(baos, StandardCharsets.UTF_8);
             CSVWriter writer = new CSVWriter(osw)) {

            // Write header
            String[] header = {"Sale ID", "Product ASIN", "Product Name", "User Email",
                    "Quantity", "Unit Price", "Total Amount", "Sale Date", "Status"};
            writer.writeNext(header);



            writer.flush();
            return baos.toByteArray();
        }
    }
}