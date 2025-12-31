import React, { useState, useEffect, useCallback } from 'react';
import {
    getAllPredictions,
    getPredictionStats,
    getPotentialBestsellers,
    checkPredictionServiceHealth,
    ProductPrediction,
    PredictionStats,
    HealthStatus,
    formatProbability,
    formatPrice, getLatestPredictions,

} from '../../service/predictionService';

// ==================== ICONS ====================
const TrendUpIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const TrendDownIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
);

const StarIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const DollarIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const BoxIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const AlertCircle = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ==================== COMPONENTS ====================

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, trendValue }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-500">{subtitle}</p>
                    )}
                    {trend && trendValue && (
                        <div className={`mt-2 flex items-center gap-1 text-sm font-medium ${
                            trend === 'up' ? 'text-green-600 dark:text-green-400' :
                                trend === 'down' ? 'text-red-600 dark:text-red-400' :
                                    'text-gray-600 dark:text-gray-400'
                        }`}>
                            {trend === 'up' && <TrendUpIcon />}
                            {trend === 'down' && <TrendDownIcon />}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>
                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <span className="text-gray-700 dark:text-gray-300">{icon}</span>
                </div>
            </div>
        </div>
    );
};

const ProgressBar: React.FC<{ value: number; color: string; label?: string }> = ({ value, color, label }) => (
    <div className="w-full">
        {label && (
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{value.toFixed(1)}%</span>
            </div>
        )}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width: `${Math.min(value, 100)}%` }}
            />
        </div>
    </div>
);

const Badge: React.FC<{ children: React.ReactNode; variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = ({ children, variant }) => {
    const variants = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};


const PredictiveDashboard: React.FC = () => {
    const [predictions, setPredictions] = useState<ProductPrediction[]>([]);
    const [stats, setStats] = useState<PredictionStats | null>(null);
    const [bestsellers, setBestsellers] = useState<ProductPrediction[]>([]);
    const [setHealthStatus] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'bestsellers' | 'prices'>('overview');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);

        console.log('🚀 Loading dashboard data...');

        try {
            // ✅ TRY CACHE FIRST (INSTANT!)
            try {
                console.log('📦 Attempting to load from cache...');
                const cached = await getLatestPredictions();

                console.log('✅ Cache hit! Got:', {
                    bestsellers: cached.bestsellerPredictions.length,
                    rankings: cached.rankingPredictions.length,
                    prices: cached.priceIntelligence.length,
                    total: cached.totalCount,
                    fromCache: cached.fromCache
                });

                const mappedPredictions: ProductPrediction[] = cached.bestsellerPredictions.map(bs => ({
                    productId: bs.productId,
                    productName: bs.productName || 'Unknown Product',
                    category: 'Electronics', // Default category
                    bestsellerPrediction: {
                        bestsellerProbability: bs.bestsellerProbability,
                        isPotentialBestseller: bs.isPotentialBestseller,
                        potentialLevel: bs.potentialLevel || 'MODÉRÉ',
                        recommendation: bs.recommendation || '',
                        confidence: 0.8
                    },
                    rankingPrediction: {
                        predictedRanking: 0,
                        currentRanking: 0,
                        rankingChange: 0,
                        trend: 'STABLE',
                        trendDescription: '',
                        confidence: 0
                    },
                    pricePrediction: {
                        recommendedPrice: 0,
                        currentPrice: 0,
                        priceDifference: 0,
                        priceChangePercentage: 0,
                        priceAction: 'MAINTENIR',
                        actionDescription: '',
                        shouldNotifySeller: false,
                        confidence: 0
                    },
                    generatedAt: bs.predictedAt
                }));

                console.log('📊 Mapped predictions:', mappedPredictions.length);

                setPredictions(mappedPredictions);
                setBestsellers(mappedPredictions.filter(p => p.bestsellerPrediction.isPotentialBestseller));

                // Load stats separately (fast query)
                const statsData = await getPredictionStats().catch(err => {
                    console.warn('Stats failed:', err);
                    return null;
                });
                setStats(statsData);

                const health = await checkPredictionServiceHealth().catch(() => ({
                    springBootService: 'UP',
                    mlServiceAvailable: false
                }));
                setHealthStatus(health);

                console.log('✅ Dashboard loaded from cache in <1 second!');
                setLoading(false);
                return;

            } catch (cacheError) {
                console.warn('⚠️ Cache endpoint failed, falling back to ML generation:', cacheError);
            }

            console.log('🔄 Cache failed, loading with ML generation (slow)...');
            const [predictionsData, statsData, bestsellersData, health] = await Promise.all([
                getAllPredictions().catch(() => []),
                getPredictionStats().catch(() => null),
                getPotentialBestsellers().catch(() => []),
                checkPredictionServiceHealth().catch(() => ({ springBootService: 'UP', mlServiceAvailable: false }))
            ]);

            setPredictions(predictionsData);
            setStats(statsData);
            setBestsellers(bestsellersData);
            setHealthStatus(health);

        } catch (err: any) {
            console.error('❌ Error loading dashboard:', err);
            setError(err.response?.data?.message || 'Failed to load data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    // Filtering
    const filteredPredictions = selectedCategory === 'all'
        ? predictions
        : predictions.filter(p => p.category === selectedCategory);

    const categories = ['all', ...new Set(predictions.map(p => p.category).filter(Boolean))];

    // Helper functions
    const getTrendBadge = (trend: string) => {
        switch (trend) {
            case 'AMÉLIORATION':
                return <Badge variant="success">Improving</Badge>;
            case 'DÉCLIN':
                return <Badge variant="danger">Declining</Badge>;
            default:
                return <Badge variant="neutral">Stable</Badge>;
        }
    };

    const getPotentialBadge = (level: string) => {
        switch (level) {
            case 'TRÈS ÉLEVÉ':
                return <Badge variant="success">Very High</Badge>;
            case 'ÉLEVÉ':
                return <Badge variant="info">High</Badge>;
            case 'MODÉRÉ':
                return <Badge variant="warning">Moderate</Badge>;
            default:
                return <Badge variant="neutral">Low</Badge>;
        }
    };

    const getPriceActionBadge = (action: string) => {
        switch (action) {
            case 'AUGMENTER':
                return <Badge variant="success">Increase</Badge>;
            case 'DIMINUER':
                return <Badge variant="danger">Decrease</Badge>;
            default:
                return <Badge variant="neutral">Maintain</Badge>;
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin border-t-gray-900 dark:border-t-white"></div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading predictions...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Predictive Analysis</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        AI-powered insights and predictions for your product catalog
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadDashboardData}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors font-medium"
                    >
                        <RefreshIcon />
                        Refresh Data
                    </button>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                    <div className="flex items-center gap-2">
                        <AlertCircle />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Products Analyzed"
                        value={stats.totalPredictions}
                        subtitle="Total predictions generated"
                        icon={<BoxIcon />}
                    />
                    <StatCard
                        title="Potential Bestsellers"
                        value={stats.potentialBestsellersCount}
                        subtitle={`${formatProbability(stats.averageBestsellerProbability)} avg probability`}
                        icon={<StarIcon />}
                        trend="up"
                        trendValue={`${((stats.potentialBestsellersCount / Math.max(stats.totalPredictions, 1)) * 100).toFixed(1)}% of total`}
                    />
                    <StatCard
                        title="Price Recommendations"
                        value={stats.productsWithPriceRecommendation}
                        subtitle={`±${stats.averagePriceChangeRecommended.toFixed(1)}% average change`}
                        icon={<DollarIcon />}
                    />
                    <StatCard
                        title="Improving Trends"
                        value={stats.productsWithRankingImprovement}
                        subtitle="Positive ranking forecast"
                        icon={<TrendUpIcon />}
                        trend="up"
                        trendValue="Growing"
                    />
                </div>
            )}

            {/* Main Content Card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex overflow-x-auto">
                        {[
                            { id: 'overview', label: 'Overview', icon: <ChartIcon /> },
                            { id: 'rankings', label: 'Rankings', icon: <TrendUpIcon /> },
                            { id: 'bestsellers', label: 'Bestsellers', icon: <StarIcon /> },
                            { id: 'prices', label: 'Pricing', icon: <DollarIcon /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                                    activeTab === tab.id
                                        ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white'
                                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Category:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'All Categories' : cat}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            {filteredPredictions.length} products
                        </span>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && stats && (
                        <div className="space-y-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Trend Distribution */}
                                <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Trend Distribution
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(stats.trendDistribution || {}).map(([trend, count]) => {
                                            const percentage = (count / stats.totalPredictions) * 100;
                                            const color = trend === 'AMÉLIORATION' ? 'bg-green-600' :
                                                trend === 'DÉCLIN' ? 'bg-red-600' : 'bg-gray-600';
                                            return (
                                                <div key={trend}>
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-gray-600 dark:text-gray-400">{trend}</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {count} ({percentage.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <ProgressBar value={percentage} color={color} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Price Action Distribution */}
                                <div className="p-6 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Price Recommendations
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(stats.priceActionDistribution || {}).map(([action, count]) => {
                                            const percentage = (count / stats.totalPredictions) * 100;
                                            const color = action === 'AUGMENTER' ? 'bg-green-600' :
                                                action === 'DIMINUER' ? 'bg-red-600' : 'bg-gray-600';
                                            return (
                                                <div key={action}>
                                                    <div className="flex justify-between text-sm mb-2">
                                                        <span className="text-gray-600 dark:text-gray-400">{action}</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">
                                                            {count} ({percentage.toFixed(1)}%)
                                                        </span>
                                                    </div>
                                                    <ProgressBar value={percentage} color={color} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Category Stats Table */}
                            {stats.categoryStats && stats.categoryStats.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Category Analysis
                                    </h3>
                                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    Products
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    Bestseller Prob
                                                </th>
                                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                                    Price Change
                                                </th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {stats.categoryStats.map((cat, index) => (
                                                <tr key={cat.category} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                        {cat.category}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                        {cat.productCount}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant={cat.avgBestsellerProbability > 0.5 ? 'success' : 'neutral'}>
                                                            {formatProbability(cat.avgBestsellerProbability)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                            <span className={`font-medium ${
                                                                cat.avgPriceChange > 0 ? 'text-green-600 dark:text-green-400' :
                                                                    cat.avgPriceChange < 0 ? 'text-red-600 dark:text-red-400' :
                                                                        'text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                                {cat.avgPriceChange > 0 ? '+' : ''}{cat.avgPriceChange.toFixed(1)}%
                                                            </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* RANKINGS TAB */}
                    {activeTab === 'rankings' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Ranking Predictions
                            </h3>
                            {filteredPredictions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <BoxIcon />
                                    <p className="mt-2">No predictions available</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Product</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Current</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Predicted</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Change</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Trend</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredPredictions
                                            .sort((a, b) => (b.rankingPrediction?.rankingChange || 0) - (a.rankingPrediction?.rankingChange || 0))
                                            .slice(0, 20)
                                            .map((pred, index) => (
                                                <tr key={pred.productId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[250px]">
                                                            {pred.productName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-500">{pred.category}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-gray-600 dark:text-gray-400">
                                                        #{pred.rankingPrediction?.currentRanking || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono font-semibold text-gray-900 dark:text-white">
                                                        #{pred.rankingPrediction?.predictedRanking || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                            <span className={`font-semibold ${
                                                                (pred.rankingPrediction?.rankingChange || 0) > 0 ? 'text-green-600 dark:text-green-400' :
                                                                    (pred.rankingPrediction?.rankingChange || 0) < 0 ? 'text-red-600 dark:text-red-400' :
                                                                        'text-gray-600 dark:text-gray-400'
                                                            }`}>
                                                                {(pred.rankingPrediction?.rankingChange || 0) > 0 ? '+' : ''}
                                                                {pred.rankingPrediction?.rankingChange || 0}
                                                            </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getTrendBadge(pred.rankingPrediction?.trend || 'STABLE')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* BESTSELLERS TAB */}
                    {activeTab === 'bestsellers' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Potential Bestsellers
                            </h3>
                            {bestsellers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <StarIcon />
                                    <p className="mt-2">No potential bestsellers identified</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {bestsellers.slice(0, 12).map(pred => (
                                        <div
                                            key={pred.productId}
                                            className="p-6 rounded-lg bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                                        {pred.productName}
                                                    </h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{pred.category}</p>
                                                </div>
                                                {getPotentialBadge(pred.bestsellerPrediction?.potentialLevel || 'FAIBLE')}
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600 dark:text-gray-400">Probability</span>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {formatProbability(pred.bestsellerPrediction?.bestsellerProbability || 0)}
                                                    </span>
                                                </div>
                                                <ProgressBar
                                                    value={(pred.bestsellerPrediction?.bestsellerProbability || 0) * 100}
                                                    color={
                                                        (pred.bestsellerPrediction?.bestsellerProbability || 0) >= 0.7 ? 'bg-green-600' :
                                                            (pred.bestsellerPrediction?.bestsellerProbability || 0) >= 0.5 ? 'bg-yellow-600' :
                                                                'bg-gray-600'
                                                    }
                                                />
                                            </div>

                                            {pred.bestsellerPrediction?.recommendation && (
                                                <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                                    <p className="text-xs text-gray-700 dark:text-gray-300">
                                                        {pred.bestsellerPrediction.recommendation}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PRICES TAB */}
                    {activeTab === 'prices' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Price Optimization
                            </h3>
                            {filteredPredictions.filter(p => p.pricePrediction?.priceAction !== 'MAINTENIR').length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <DollarIcon />
                                    <p className="mt-2">No price recommendations</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Product</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Current</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Recommended</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Change</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Action</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredPredictions
                                            .filter(p => p.pricePrediction?.priceAction !== 'MAINTENIR')
                                            .sort((a, b) => Math.abs(b.pricePrediction?.priceChangePercentage || 0) - Math.abs(a.pricePrediction?.priceChangePercentage || 0))
                                            .slice(0, 20)
                                            .map((pred, index) => (
                                                <tr key={pred.productId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-900/30'}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[250px]">
                                                            {pred.productName}
                                                        </div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-500">{pred.category}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-gray-600 dark:text-gray-400">
                                                        {formatPrice(pred.pricePrediction?.currentPrice || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono font-semibold text-gray-900 dark:text-white">
                                                        {formatPrice(pred.pricePrediction?.recommendedPrice || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                            <span className={`font-semibold ${
                                                                (pred.pricePrediction?.priceChangePercentage || 0) > 0 ? 'text-green-600 dark:text-green-400' :
                                                                    'text-red-600 dark:text-red-400'
                                                            }`}>
                                                                {(pred.pricePrediction?.priceChangePercentage || 0) > 0 ? '+' : ''}
                                                                {pred.pricePrediction?.priceChangePercentage?.toFixed(1)}%
                                                            </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getPriceActionBadge(pred.pricePrediction?.priceAction || 'MAINTENIR')}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PredictiveDashboard;