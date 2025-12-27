package com.dashboard.entity;

import com.fasterxml. jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time. LocalDateTime;
import java.util. ArrayList;
import java.util.List;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType. IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @JsonIgnore
    @Column(nullable = false, length = 255)
    private String password;

    @Column(name = "full_name", length = 255)
    private String fullName;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String bio;

    @Column(name = "profile_image", length = 500)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Role role = Role. BUYER;

    @Column(name = "security_question", length = 500)
    private String securityQuestion;

    @JsonIgnore
    @Column(name = "security_answer", length = 255)
    private String securityAnswer;

    @Column(name = "is_active")
    @Builder. Default
    private Boolean isActive = true;

    @Column(name = "store_name", length = 255)
    private String storeName;

    @Column(name = "store_description", length = 1000)
    private String storeDescription;

    @Column(name = "business_address", length = 500)
    private String businessAddress;

    @Column(name = "is_verified_seller")
    @Builder. Default
    private Boolean isVerifiedSeller = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;


    @Column(name = "seller_rating")
    private Double sellerRating;

    public Double getSellerRating() {
        return sellerRating != null ? sellerRating : 4.0;
    }

    public enum Role {
        BUYER("Regular Buyer"),
        SELLER("Product Seller"),
        ANALYST("Data Analyst"),
        ADMIN("Administrator");

        private final String description;

        Role(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}