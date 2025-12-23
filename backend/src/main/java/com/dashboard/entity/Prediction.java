package com.dashboard.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "predictions", indexes = {
        @Index(name = "idx_prediction_product", columnList = "product_id"),
        @Index(name = "idx_prediction_seller", columnList = "seller_id"),
        @Index(name = "idx_prediction_generated", columnList = "generated_at"),
        @Index(name = "idx_prediction_bestseller", columnList = "is_potential_bestseller")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prediction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private String productAsin;  // ← Vérifiez ça!

    @Column(name = "product_name")
    private String productName;

    @Column(name = "seller_id")
    private Long sellerId;

    @Column(name = "category")
    private String category;

    // ========== PRÉDICTION DE CLASSEMENT ==========

    @Column(name = "current_ranking")
    private Integer currentRanking;

    @Column(name = "predicted_ranking")
    private Integer predictedRanking;

    @Column(name = "ranking_change")
    private Integer rankingChange;

    @Column(name = "ranking_trend", length = 20)
    private String rankingTrend;

    @Column(name = "ranking_confidence")
    private Double rankingConfidence;

    // ========== PRÉDICTION BESTSELLER ==========

    @Column(name = "bestseller_probability")
    private Double bestsellerProbability;

    @Column(name = "is_potential_bestseller")
    @Builder.Default
    private Boolean isPotentialBestseller = false;

    @Column(name = "potential_level", length = 20)
    private String potentialLevel;

    @Column(name = "bestseller_confidence")
    private Double bestsellerConfidence;

    // ========== RECOMMANDATION DE PRIX ==========

    @Column(name = "current_price")
    private Double currentPrice;

    @Column(name = "recommended_price")
    private Double recommendedPrice;

    @Column(name = "price_difference")
    private Double priceDifference;

    @Column(name = "price_change_percentage")
    private Double priceChangePercentage;

    @Column(name = "price_action", length = 20)
    private String priceAction;

    @Column(name = "price_confidence")
    private Double priceConfidence;

    @CreationTimestamp
    @Column(name = "generated_at", nullable = false, updatable = false)
    private LocalDateTime generatedAt;

    @Column(name = "notification_sent")
    @Builder.Default
    private Boolean notificationSent = false;
}