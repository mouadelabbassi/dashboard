package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "product_ranking_history", indexes = {
        @Index(name = "idx_asin_date", columnList = "product_asin, recorded_at"),
        @Index(name = "idx_date", columnList = "recorded_at")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductRankingHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_asin", nullable = false, length = 20)
    private String productAsin;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_asin", referencedColumnName = "asin",
            insertable = false, updatable = false)
    private Product product;

    @Column(name = "amazon_rank")
    private Integer amazonRank;

    @Column(name = "platform_rank")
    private Integer platformRank;

    @Column(name = "sales_velocity", precision = 10, scale = 4)
    private BigDecimal salesVelocity;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) {
            recordedAt = LocalDateTime.now();
        }
    }
}