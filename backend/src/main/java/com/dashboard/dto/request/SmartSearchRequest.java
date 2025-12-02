package com.dashboard.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SmartSearchRequest {
    private String query;
    private Long userId;
    private String userRole;
    @Builder.Default
    private String language = "fr";
    @Builder.Default
    private int page = 0;
    @Builder.Default
    private int size = 20;
}