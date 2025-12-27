package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PriceIntelligenceResponse {

    private String productId;
    private String productName;
    private String categoryName;
    private String imageUrl;

    private BigDecimal currentPrice;

    private BigDecimal recommendedPrice;
    private BigDecimal priceDifference;
    private BigDecimal priceChangePercentage;

    private String priceAction;
    private String actionDescription;


    private String positioning;
    private BigDecimal pricePercentile;


    private BigDecimal categoryAvgPrice;
    private BigDecimal categoryMinPrice;
    private BigDecimal categoryMaxPrice;


    private BigDecimal suggestedRangeMin;
    private BigDecimal suggestedRangeMax;


    private BigDecimal confidence;
    private String analysisMethod;


    private Boolean shouldNotifySeller;

    private Long sellerId;
    private String sellerName;

    @Builder.Default
    private String methodologyNote = "Analyse statistique basée sur les prix de la catégorie. " +
            "Les recommandations sont calculées selon la position dans le percentile 40-60 (zone optimale).";

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
        BigDecimal range = categoryMax.subtract(categoryMin);
        BigDecimal suggestedMin = categoryMin.add(range.multiply(new BigDecimal("0.40")));
        BigDecimal suggestedMax = categoryMin.add(range.multiply(new BigDecimal("0.60")));
        BigDecimal recommendedPrice = suggestedMin.add(suggestedMax).divide(new BigDecimal("2"), 2, java.math.RoundingMode.HALF_UP);

        BigDecimal priceDiff = recommendedPrice.subtract(currentPrice);
        BigDecimal priceChangePct = currentPrice.compareTo(BigDecimal.ZERO) > 0 ?
                priceDiff.divide(currentPrice, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
                BigDecimal.ZERO;

        BigDecimal percentile = range.compareTo(BigDecimal.ZERO) > 0 ?
                currentPrice.subtract(categoryMin).divide(range, 4, java.math.RoundingMode.HALF_UP).multiply(new BigDecimal("100")) :
                new BigDecimal("50");

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