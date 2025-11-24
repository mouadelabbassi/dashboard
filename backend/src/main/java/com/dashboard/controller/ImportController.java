package com.dashboard.controller;

import com.dashboard.dto.response.ApiResponse;
import com.dashboard.service.CsvImportService;
import com.opencsv.exceptions.CsvException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Tag(name = "Import", description = "Data import endpoints")
public class ImportController {

    private final CsvImportService csvImportService;

    @PostMapping(value = "/csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Import CSV file", description = "Imports products from uploaded CSV file (Admin only)")
    public ResponseEntity<ApiResponse<Map<String, Object>>> importCsv(
            @RequestParam("file") MultipartFile file) {

        log.info("Received CSV import request for file: {}", file.getOriginalFilename());

        if (file.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File is empty"));
        }

        if (!file.getOriginalFilename().endsWith(".csv")) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File must be a CSV"));
        }

        try {
            Map<String, Object> result = csvImportService.importCsvFile(file);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("CSV imported successfully", result));
        } catch (IOException e) {
            log.error("IO error during CSV import", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Error reading CSV file: " + e.getMessage()));
        } catch (CsvException e) {
            log.error("CSV parsing error", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error parsing CSV file: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during CSV import", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Unexpected error: " + e.getMessage()));
        }
    }

    @PostMapping("/trigger-auto-import")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Trigger auto import", description = "Manually triggers import from resources CSV file (Admin only)")
    public ResponseEntity<ApiResponse<String>> triggerAutoImport() {
        log.info("Manual trigger for auto-import from resources");

        try {
            csvImportService.importCsvFromResources();
            return ResponseEntity.ok(ApiResponse.success("Auto-import completed successfully", "Data imported from resources"));
        } catch (Exception e) {
            log.error("Error during auto-import", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(ApiResponse.error("Auto-import failed: " + e.getMessage()));
        }
    }
}