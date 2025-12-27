package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO for price intelligence (statistical analysis) responses.
 * NOT ML-based - uses statistical analysis of category prices.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceIntelligenceResponse {

    private String productId;
    private String productName;
    private String categoryName;
    private String imageUrl;

    // Current price info
    private BigDecimal currentPrice;

    // Recommended price
    private BigDecimal recommendedPrice;
    private BigDecimal priceDifference;
    private BigDecimal priceChangePercentage;

    // Price action
    private String priceAction;  // INCREASE, DECREASE, MAINTAIN
    private String actionDescription;

    // Market positioning
    private String positioning;  // BUDGET, VALUE, MID_RANGE, PREMIUM, LUXURY
    private BigDecimal pricePercentile;

    // Category statistics
    private BigDecimal categoryAvgPrice;
    private BigDecimal categoryMinPrice;
    private BigDecimal categoryMaxPrice;

    // Suggested range (sweet spot: 40th-60th percentile)
    private BigDecimal suggestedRangeMin;
    private BigDecimal suggestedRangeMax;

    // Confidence and method
    private BigDecimal confidence;
    private String analysisMethod;  // Always "STATISTICAL" for this

    // Alert flag
    private Boolean shouldNotifySeller;

    // Seller info
    private Long sellerId;
    private String sellerName;

    // Note about methodology
    @Builder.Default
    private String methodologyNote = "Analyse statistique basée sur les prix de la catégorie. " +
            "Les recommandations sont calculées selon la position dans le percentile 40-60 (zone optimale).";

    /**
     * Create response from product and category statistics.
     */
    public static PriceIntelligenceResponse create(
            String productId,
            String productName,
            String categoryName,
            String imageUrl,
            BigDecimal currentPrice,
            BigDecimal categoryAvg,
            BigDecimal categoryMin,
            BigDecimal categoryMax,
            Long sellerId,
            String sellerName
    ) {
        // Calculate recommended price (40th-60th percentile = sweet spot)
        BigDecimal range = categoryMax.subtract(categoryMin);
        BigDecimal suggestedMin = categoryMin.add(range.multiply(new BigDecimal("0.40")));
        BigDecimal suggestedMax = categoryMin.add(range.multiply(new BigDecimal("0.60")));
        BigDecimal recommendedPrice = suggestedMin.add(suggestedMax).divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);

        // Calculate price difference
        BigDecimal priceDiff = recommendedPrice.subtract(currentPrice);
        BigDecimal priceChangePct = currentPrice.compareTo(BigDecimal.ZERO) > 0 ?
                priceDiff.divide(currentPrice, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
                BigDecimal.ZERO;

        // Calculate percentile
        BigDecimal percentile = range.compareTo(BigDecimal.ZERO) > 0 ?
                currentPrice.subtract(categoryMin).divide(range, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
                new BigDecimal("50");

        // Determine positioning
        String positioning;
        if (percentile.compareTo(new BigDecimal("25")) < 0) {
            positioning = "BUDGET";
        } else if (percentile.compareTo(new BigDecimal("50")) < 0) {
            positioning = "VALUE";
        } else if (percentile.compareTo(new BigDecimal("75")) < 0) {
            positioning = "MID_RANGE";
        } else if (percentile.compareTo(new BigDecimal("90")) < 0) {
            positioning = "PREMIUM";
        } else {
            positioning = "LUXURY";
        }

        // Determine price action
        String priceAction;
        String actionDescription;
        if (priceChangePct.abs().compareTo(new BigDecimal("5")) < 0) {
            priceAction = "MAINTAIN";
            actionDescription = "Le prix actuel est bien positionné";
        } else if (priceChangePct.compareTo(BigDecimal.ZERO) > 0) {
            priceAction = "INCREASE";
            actionDescription = String.format("Envisagez d'augmenter le prix de %.1f%%", priceChangePct.abs().doubleValue());
        } else {
            priceAction = "DECREASE";
            actionDescription = String.format("Envisagez de réduire le prix de %.1f%%", priceChangePct.abs().doubleValue());
        }

        // Should notify if change > 15%
        boolean shouldNotify = priceChangePct.abs().compareTo(new BigDecimal("15")) > 0;

        return PriceIntelligenceResponse.builder()
                .productId(productId)
                .productName(productName)
                .categoryName(categoryName)
                .imageUrl(imageUrl)
                .currentPrice(currentPrice)
                .recommendedPrice(recommendedPrice)
                .priceDifference(priceDiff)
                .priceChangePercentage(priceChangePct)
                .priceAction(priceAction)
                .actionDescription(actionDescription)
                .positioning(positioning)
                .pricePercentile(percentile)
                .categoryAvgPrice(categoryAvg)
                .categoryMinPrice(categoryMin)
                .categoryMaxPrice(categoryMax)
                .suggestedRangeMin(suggestedMin)
                .suggestedRangeMax(suggestedMax)
                .confidence(new BigDecimal("0.85"))
                .analysisMethod("STATISTICAL")
                .shouldNotifySeller(shouldNotify)
                .sellerId(sellerId)
                .sellerName(sellerName)
                .build();
    }
}