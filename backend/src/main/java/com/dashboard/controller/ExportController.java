package com.dashboard.controller;

import com.dashboard.service.ExportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@Slf4j
@RestController
@RequestMapping("/api/export")
@RequiredArgsConstructor
@Tag(name = "Export", description = "Data export endpoints")
public class ExportController {

    private final ExportService exportService;

    @GetMapping("/products/csv")
    @Operation(summary = "Export products to CSV", description = "Downloads all products as CSV file")
    public ResponseEntity<byte[]> exportProductsToCsv() throws IOException {
        log.info("Exporting products to CSV");

        byte[] csvData = exportService.exportProductsToCsv();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "products_export.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }

    @GetMapping("/products/excel")
    @Operation(summary = "Export products to Excel", description = "Downloads all products as Excel file")
    public ResponseEntity<byte[]> exportProductsToExcel() throws IOException {
        log.info("Exporting products to Excel");

        byte[] excelData = exportService.exportProductsToExcel();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
        headers.setContentDispositionFormData("attachment", "products_export.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .body(excelData);
    }

    @GetMapping("/sales/csv")
    @Operation(summary = "Export sales to CSV", description = "Downloads all sales as CSV file")
    public ResponseEntity<byte[]> exportSalesToCsv() throws IOException {
        log.info("Exporting sales to CSV");

        byte[] csvData = exportService.exportSalesToCsv();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "sales_export.csv");

        return ResponseEntity.ok()
                .headers(headers)
                .body(csvData);
    }
}