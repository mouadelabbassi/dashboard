package com. dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations. CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "search_history", indexes = {
        @Index(name = "idx_search_user", columnList = "user_id"),
        @Index(name = "idx_search_query", columnList = "query"),
        @Index(name = "idx_search_created", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SearchHistory {

    @Id
    @GeneratedValue(strategy = GenerationType. IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 500)
    private String query;

    @Column(name = "normalized_query", length = 500)
    private String normalizedQuery;

    @Column(length = 50)
    private String intent;

    @Column(name = "results_count")
    private Integer resultsCount;

    @Column(name = "search_time_ms")
    private Double searchTimeMs;

    @Column(name = "user_role", length = 20)
    private String userRole;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}