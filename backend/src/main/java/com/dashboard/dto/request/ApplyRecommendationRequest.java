package com.dashboard.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for applying a prediction recommendation.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApplyRecommendationRequest {

    @NotBlank(message = "Product ID is required")
    private String productId;

    @NotNull(message = "Recommendation type is required")
    private RecommendationType recommendationType;

    private String action;  // e.g., "FEATURE_PRODUCT", "CHANGE_PRICE", "BOOST_MARKETING"

    private String originalValue;  // Original value before change

    private String newValue;  // New value after applying recommendation

    private String notes;  // Optional notes from the user

    private Double confidenceScore;  // The confidence of the recommendation being applied

    public enum RecommendationType {
        BESTSELLER_FEATURE("Feature product based on bestseller prediction"),
        PRICE_CHANGE("Apply price recommendation"),
        RANKING_ACTION("Take action based on ranking trend"),
        MARKETING_BOOST("Boost marketing for potential bestseller");

        private final String description;

        RecommendationType(String description) {
            this.description = description;
        }

        public String getDescription() {
            return description;
        }
    }
}