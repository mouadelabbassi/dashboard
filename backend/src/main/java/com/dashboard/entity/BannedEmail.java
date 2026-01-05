package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "banned_emails")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BannedEmail {

    @Id
    @GeneratedValue(strategy = GenerationType. IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(length = 500)
    private String reason;

    @Column(name = "banned_by")
    private Long bannedBy;

    @CreationTimestamp
    @Column(name = "banned_at", updatable = false)
    private LocalDateTime bannedAt;
}