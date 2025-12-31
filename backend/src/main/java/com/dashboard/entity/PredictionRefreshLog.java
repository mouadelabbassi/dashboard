package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "prediction_refresh_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PredictionRefreshLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "refresh_type", nullable = false)
    private String refreshType;

    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "total_products")
    @Builder.Default
    private Integer totalProducts = 0;

    @Column(name = "success_count")
    @Builder.Default
    private Integer successCount = 0;

    @Column(name = "error_count")
    @Builder.Default
    private Integer errorCount = 0;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    private RefreshStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    public enum RefreshStatus {
        RUNNING, COMPLETED, FAILED, PARTIAL
    }
}