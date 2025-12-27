package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalystResponse {

    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private String bio;
    private String profileImage;
    private String department;
    private String specialization;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;


    private Integer totalReportsGenerated;
    private Integer totalExportsCreated;
    private LocalDateTime lastActivityAt;
}