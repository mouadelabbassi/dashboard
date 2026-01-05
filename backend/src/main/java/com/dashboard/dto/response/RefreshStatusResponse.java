package com.dashboard.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshStatusResponse {
    private boolean isRefreshing;
    private LocalDateTime lastRefreshStarted;
    private LocalDateTime lastRefreshCompleted;
    private int lastSuccessCount;
    private int lastErrorCount;
    private String status;

    public String getStatus() {
        if (isRefreshing) return "RUNNING";
        if (lastRefreshCompleted != null) return "COMPLETED";
        return "IDLE";
    }
}