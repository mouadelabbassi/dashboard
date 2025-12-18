package com.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdvancedPredictionResponseDTO {

    private String productId;
    private String productName;

    // Health Score
    private HealthScoreDTO healthScore;

    // Sales Forecast
    private SalesForecastDTO salesForecast;

    // Trend Momentum
    private MomentumDTO momentum;

    // ==================== NESTED DTOs ====================

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HealthScoreDTO {
        private Double healthScore;
        private String healthLevel;
        private String healthEmoji;
        private String healthColor;
        private String recommendation;
        private Map<String, MetricBreakdown> breakdown;
        private List<String> strengths;
        private List<String> weaknesses;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MetricBreakdown {
        private Double score;
        private String weight;
        private String value;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SalesForecastDTO {
        private Integer forecastPeriodDays;
        private Integer totalPredictedSales;
        private Double averageDailySales;
        private Double projectedRevenue;
        private Double currentVelocity;
        private Double confidence;
        private Boolean stockWarning;
        private Integer stockDepletedInDays;
        private List<DailyForecast> dailyForecasts;
        private WeeklySummary weeklySummary;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DailyForecast {
        private String date;
        private String dayName;
        private Double predictedSales;
        private Double cumulativeSales;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WeeklySummary {
        private Integer week1;
        private Integer week2;
        private Integer week3;
        private Integer week4;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MomentumDTO {
        private Double overallMomentum;
        private String trend;
        private String trendColor;
        private String trendAdvice;
        private MomentumBreakdown momentumBreakdown;
        private Velocities velocities;
        private Projection projection;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MomentumBreakdown {
        private Double salesMomentum;
        private Double engagementMomentum;
        private Double ratingMomentum;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Velocities {
        private Double salesPerDay;
        private Double reviewsPerDay;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Projection {
        private Integer nextWeekSales;
        private Integer nextMonthSales;
    }
}

