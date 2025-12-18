import React from 'react';

interface HealthScoreData {
    health_score: number;
    health_level: string;
    health_emoji: string;
    health_color: string;
    recommendation: string;
    breakdown: {
        [key: string]: {
            score: number;
            weight: string;
            value: string;
        };
    };
    strengths: string[];
    weaknesses: string[];
}

interface ForecastData {
    forecast_period_days: number;
    total_predicted_sales: number;
    average_daily_sales: number;
    projected_revenue: number;
    current_velocity: number;
    confidence: number;
    stock_warning: boolean;
    stock_depleted_in_days: number | null;
    daily_forecasts: Array<{
        date: string;
        day_name: string;
        predicted_sales: number;
        cumulative_sales: number;
    }>;
    weekly_summary: {
        week_1: number;
        week_2: number | null;
        week_3: number | null;
        week_4: number | null;
    };
}

interface MomentumData {
    overall_momentum: number;
    trend: string;
    trend_color: string;
    trend_advice: string;
    momentum_breakdown: {
        sales_momentum: number;
        engagement_momentum: number;
        rating_momentum: number;
    };
    velocities: {
        sales_per_day: number;
        reviews_per_day: number;
    };
    projection: {
        next_week_sales: number;
        next_month_sales: number;
    };
}

// ============================================================================
// HEALTH SCORE CARD COMPONENT
// ============================================================================

interface HealthScoreCardProps {
    data: HealthScoreData;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ data }) => {
    const getColorClass = (color: string) => {
        const colors: { [key: string]: string } = {
            green: 'from-green-500 to-emerald-600',
            blue: 'from-blue-500 to-indigo-600',
            yellow: 'from-yellow-500 to-amber-600',
            orange: 'from-orange-500 to-red-500',
            red: 'from-red-500 to-rose-700'
        };
        return colors[color] || colors.blue;
    };

    const getBgColorClass = (color: string) => {
        const colors: { [key: string]: string } = {
            green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
            blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
            yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
            orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
            red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        };
        return colors[color] || colors.blue;
    };

    const formatLabel = (key: string) => {
        const labels: { [key: string]: string } = {
            sales_performance: '📈 Performance Ventes',
            rating_quality: '⭐ Qualité Rating',
            review_engagement: '💬 Engagement Reviews',
            price_competitiveness: '💰 Compétitivité Prix',
            stock_health: '📦 Santé Stock'
        };
        return labels[key] || key;
    };

    return (
        <div className={`rounded-2xl border p-6 ${getBgColorClass(data.health_color)}`}>
            {/* Header with Score */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Score de Santé Produit
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Évaluation globale de la performance
                    </p>
                </div>
                <div className="text-center">
                    <div className={`text-5xl font-bold bg-gradient-to-r ${getColorClass(data.health_color)} bg-clip-text text-transparent`}>
                        {data.health_score}
                    </div>
                    <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        /100
                    </div>
                </div>
            </div>

            {/* Health Level Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getColorClass(data.health_color)} text-white font-medium mb-4`}>
                <span className="text-xl">{data.health_emoji}</span>
                <span>{data.health_level}</span>
            </div>

            {/* Recommendation */}
            <p className="text-gray-700 dark:text-gray-300 mb-6">
                💡 {data.recommendation}
            </p>

            {/* Breakdown */}
            <div className="space-y-3">
                {Object.entries(data.breakdown).map(([key, metric]) => (
                    <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600 dark:text-gray-400">
                                {formatLabel(key)}
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {metric.score}/100 ({metric.weight})
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                    metric.score >= 70 ? 'bg-green-500' :
                                        metric.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${metric.score}%` }}
                            />
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                            {metric.value}
                        </div>
                    </div>
                ))}
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                    <h4 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                        💪 Points Forts
                    </h4>
                    <ul className="text-xs text-green-700 dark:text-green-400 space-y-1">
                        {data.strengths.length > 0 ? (
                            data.strengths.map(s => <li key={s}>✓ {formatLabel(s)}</li>)
                        ) : (
                            <li className="italic">Aucun point fort identifié</li>
                        )}
                    </ul>
                </div>
                <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30">
                    <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
                        ⚠️ À Améliorer
                    </h4>
                    <ul className="text-xs text-red-700 dark:text-red-400 space-y-1">
                        {data.weaknesses.length > 0 ? (
                            data.weaknesses.map(w => <li key={w}>✗ {formatLabel(w)}</li>)
                        ) : (
                            <li className="italic">Aucune faiblesse majeure</li>
                        )}
                    </ul>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// SALES FORECAST COMPONENT
// ============================================================================

interface SalesForecastCardProps {
    data: ForecastData;
}

export const SalesForecastCard: React.FC<SalesForecastCardProps> = ({ data }) => {
    // Calculate max for chart scaling
    const maxSales = Math.max(...data.daily_forecasts.map(f => f.predicted_sales));

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        📈 Prévision des Ventes
                        <span className="text-sm font-normal text-gray-500">
                            ({data.forecast_period_days} jours)
                        </span>
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Confiance: {(data.confidence * 100).toFixed(0)}%
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {data.total_predicted_sales}
                    </div>
                    <div className="text-sm text-gray-500">ventes prévues</div>
                </div>
            </div>

            {/* Stock Warning */}
            {data.stock_warning && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-400 font-medium">
                        🚨 Alerte Stock: Rupture prévue dans {data.stock_depleted_in_days} jours!
                    </p>
                </div>
            )}

            {/* Mini Bar Chart */}
            <div className="mb-6">
                <div className="flex items-end justify-between h-32 gap-1">
                    {data.daily_forecasts.map((forecast) => (
                        <div key={forecast.date} className="flex flex-col items-center flex-1">
                            <div
                                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all hover:from-blue-600 hover:to-blue-500"
                                style={{ height: `${(forecast.predicted_sales / maxSales) * 100}%`, minHeight: '4px' }}
                                title={`${forecast.predicted_sales} ventes`}
                            />
                            <span className="text-xs text-gray-500 mt-1 truncate w-full text-center">
                                {forecast.day_name.slice(0, 3)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Moy. Quotidienne</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {data.average_daily_sales}
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="text-sm text-gray-500 dark:text-gray-400">Vélocité Actuelle</div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                        {data.current_velocity}/jour
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30">
                    <div className="text-sm text-green-600 dark:text-green-400">Revenu Projeté</div>
                    <div className="text-xl font-bold text-green-700 dark:text-green-300">
                        ${data.projected_revenue.toLocaleString()}
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Semaine 1</div>
                    <div className="text-xl font-bold text-blue-700 dark:text-blue-300">
                        {data.weekly_summary.week_1} ventes
                    </div>
                </div>
            </div>

            {/* Weekly Summary */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Résumé Hebdomadaire
                </h4>
                <div className="flex gap-2">
                    {[1, 2, 3, 4].map(week => {
                        const weekKey = `week_${week}` as keyof typeof data.weekly_summary;
                        const value = data.weekly_summary[weekKey];
                        return value !== null ? (
                            <div key={week} className="flex-1 text-center p-2 rounded bg-gray-100 dark:bg-gray-700">
                                <div className="text-xs text-gray-500">S{week}</div>
                                <div className="font-semibold text-gray-900 dark:text-white">{value}</div>
                            </div>
                        ) : null;
                    })}
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// MOMENTUM INDICATOR COMPONENT
// ============================================================================

interface MomentumIndicatorProps {
    data: MomentumData;
}

export const MomentumIndicator: React.FC<MomentumIndicatorProps> = ({ data }) => {
    const getGaugeColor = (momentum: number) => {
        if (momentum >= 70) return 'text-green-500';
        if (momentum >= 50) return 'text-blue-500';
        if (momentum >= 30) return 'text-yellow-500';
        if (momentum >= 15) return 'text-orange-500';
        return 'text-red-500';
    };

    const getGaugeGradient = (momentum: number) => {
        if (momentum >= 70) return 'from-green-500 to-emerald-600';
        if (momentum >= 50) return 'from-blue-500 to-indigo-600';
        if (momentum >= 30) return 'from-yellow-500 to-amber-600';
        if (momentum >= 15) return 'from-orange-500 to-red-500';
        return 'from-red-500 to-rose-700';
    };

    // SVG Gauge
    const radius = 60;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (data.overall_momentum / 100) * circumference;

    return (
        <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                🚀 Momentum & Tendance
            </h3>

            <div className="flex items-center gap-6">
                {/* Circular Gauge */}
                <div className="relative">
                    <svg width="150" height="150" className="transform -rotate-90">
                        <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                        />
                        <circle
                            cx="75"
                            cy="75"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="12"
                            fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            className={`${getGaugeColor(data.overall_momentum)} transition-all duration-1000`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-3xl font-bold ${getGaugeColor(data.overall_momentum)}`}>
                            {data.overall_momentum}
                        </span>
                        <span className="text-xs text-gray-500">/100</span>
                    </div>
                </div>

                {/* Trend Info */}
                <div className="flex-1">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r ${getGaugeGradient(data.overall_momentum)} text-white font-medium mb-3`}>
                        {data.trend}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        {data.trend_advice}
                    </p>

                    {/* Velocities */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                            <span className="text-gray-500">📈 Ventes/jour:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                {data.velocities.sales_per_day}
                            </span>
                        </div>
                        <div className="p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                            <span className="text-gray-500">💬 Reviews/jour:</span>
                            <span className="ml-1 font-semibold text-gray-900 dark:text-white">
                                {data.velocities.reviews_per_day}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Momentum Breakdown */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Décomposition du Momentum
                </h4>
                <div className="space-y-2">
                    {Object.entries(data.momentum_breakdown).map(([key, value]) => {
                        const labels: { [k: string]: string } = {
                            sales_momentum: '📈 Ventes',
                            engagement_momentum: '💬 Engagement',
                            rating_momentum: '⭐ Rating'
                        };
                        return (
                            <div key={key} className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 dark:text-gray-400 w-28">
                                    {labels[key]}
                                </span>
                                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className={`h-full rounded-full ${
                                            value >= 70 ? 'bg-green-500' :
                                                value >= 40 ? 'bg-blue-500' : 'bg-yellow-500'
                                        }`}
                                        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                                    />
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white w-12 text-right">
                                    {value.toFixed(0)}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Projections */}
            <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm text-blue-600 dark:text-blue-400">Projection 7 jours</div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                        ~{data.projection.next_week_sales} ventes
                    </div>
                </div>
                <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="text-sm text-purple-600 dark:text-purple-400">Projection 30 jours</div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                        ~{data.projection.next_month_sales} ventes
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
    HealthScoreCard,
    SalesForecastCard,
    MomentumIndicator
};