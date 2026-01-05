import React, { useState } from 'react';
import usePredictions from '../../hooks/usePredictions';
import {
    formatProbability,
    formatPrice,
    formatGeneratedAt,
} from '../../service/predictionService';

const RefreshIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const TrendUpIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const StarIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

const ChartIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const Badge: React.FC<{ variant: 'success' | 'danger' | 'warning' | 'info' | 'neutral'; children: React.ReactNode }> = ({ variant, children }) => {
    const colors = {
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        danger: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        neutral: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[variant]}`}>{children}</span>;
};

const ProgressBar: React.FC<{ value: number; color: string; label?: string }> = ({ value, color, label }) => (
    <div className="w-full">
        {label && <div className="text-xs text-gray-500 mb-1">{label}</div>}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
        </div>
    </div>
);

const StatCard: React.FC<{ title: string; value: number | string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
        </div>
    </div>
);

const PredictiveDashboard: React.FC = () => {
    const {
        predictions,
        lastRefreshedAt,
        isRefreshing,
        isLoading,
        error,
        stats,
        refresh
    } = usePredictions();

    const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'bestsellers' | 'prices'>('overview');

    const getTrendBadge = (trend: string | undefined) => {
        if (!trend) return <Badge variant="neutral">N/A</Badge>;
        if (trend === 'IMPROVING' || trend === 'AMÉLIORATION') return <Badge variant="success">Improving</Badge>;
        if (trend === 'DECLINING' || trend === 'DÉCLIN') return <Badge variant="danger">Declining</Badge>;
        return <Badge variant="neutral">Stable</Badge>;
    };

    const getPotentialBadge = (level: string | undefined) => {
        if (!level) return <Badge variant="neutral">N/A</Badge>;
        if (level === 'TRÈS ÉLEVÉ' || level === 'VERY_HIGH') return <Badge variant="success">Very High</Badge>;
        if (level === 'ÉLEVÉ' || level === 'HIGH') return <Badge variant="info">High</Badge>;
        if (level === 'MODÉRÉ' || level === 'MODERATE') return <Badge variant="warning">Moderate</Badge>;
        return <Badge variant="neutral">Low</Badge>;
    };

    const getPriceActionBadge = (action: string | undefined) => {
        if (!action) return <Badge variant="neutral">N/A</Badge>;
        if (action === 'INCREASE' || action === 'AUGMENTER') return <Badge variant="success">Increase</Badge>;
        if (action === 'DECREASE' || action === 'DIMINUER') return <Badge variant="danger">Decrease</Badge>;
        return <Badge variant="neutral">Maintain</Badge>;
    };

    const bestsellers = predictions.filter(p => p.bestseller?.isPotentialBestseller);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading predictions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Predictive Analysis</h1>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">AI-powered insights for your products</p>
                </div>
                <div className="flex items-center gap-3">
                    {isRefreshing && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                            <span className="text-sm text-blue-700 dark:text-blue-300">Updating in background...</span>
                        </div>
                    )}
                    {lastRefreshedAt && !isRefreshing && (
                        <span className="text-sm text-gray-500">Last: {formatGeneratedAt(lastRefreshedAt)}</span>
                    )}
                    <button
                        onClick={refresh}
                        disabled={isRefreshing}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            isRefreshing
                                ? 'bg-gray-300 cursor-not-allowed'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                    >
                        <RefreshIcon />
                        {isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-red-800">{error}</p>
                </div>
            )}

            {predictions.length === 0 && !error && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
                    <ChartIcon />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Predictions in Cache</h3>
                    <p className="mt-2 text-gray-500">Click "Refresh" to generate predictions.</p>
                </div>
            )}

            {predictions.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Products"
                            value={stats.totalProducts}
                            icon={<ChartIcon />}
                            color="bg-blue-100 text-blue-600"
                        />
                        <StatCard
                            title="Potential Bestsellers"
                            value={stats.potentialBestsellers}
                            icon={<StarIcon />}
                            color="bg-yellow-100 text-yellow-600"
                        />
                        <StatCard
                            title="Improving Rankings"
                            value={stats.improvingRankings}
                            icon={<TrendUpIcon />}
                            color="bg-green-100 text-green-600"
                        />
                        <StatCard
                            title="Price Recommendations"
                            value={stats.priceRecommendations}
                            icon={<ChartIcon />}
                            color="bg-purple-100 text-purple-600"
                        />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="flex space-x-8 px-6">
                                {[
                                    { id: 'overview', label: 'Overview' },
                                    { id: 'bestsellers', label: 'Bestsellers' },
                                    { id: 'rankings', label: 'Rankings' },
                                    { id: 'prices', label: 'Prices' }
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                            activeTab === tab.id
                                                ? 'border-blue-500 text-blue-600'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Top Potential Bestsellers</h3>
                                            {bestsellers.slice(0, 5).map((p) => (
                                                <div key={p.productId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">{p.productName}</p>
                                                        <p className="text-sm text-gray-500">{p.productId}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <ProgressBar
                                                            value={(p.bestseller?.bestsellerProbability || 0) * 100}
                                                            color="bg-yellow-500"
                                                        />
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-14 text-right">
                                                            {formatProbability(p.bestseller?.bestsellerProbability || 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                            {bestsellers.length === 0 && (
                                                <p className="text-gray-500 text-center py-4">No potential bestsellers found</p>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Price Recommendations</h3>
                                            {predictions.filter(p => p.price && p.price.priceAction !== 'MAINTAIN' && p.price.priceAction !== 'MAINTENIR').slice(0, 5).map((p) => (
                                                <div key={p.productId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 dark:text-white truncate">{p.productName}</p>
                                                        <p className="text-sm text-gray-500">
                                                            {formatPrice(p.price?.currentPrice)} → {formatPrice(p.price?.recommendedPrice)}
                                                        </p>
                                                    </div>
                                                    {getPriceActionBadge(p.price?.priceAction)}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bestsellers' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <th className="pb-3 pr-4">Product</th>
                                            <th className="pb-3 pr-4">Probability</th>
                                            <th className="pb-3 pr-4">Potential</th>
                                            <th className="pb-3 pr-4">Confidence</th>
                                            <th className="pb-3">Recommendation</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {predictions.filter(p => p.bestseller).slice(0, 20).map((p) => (
                                            <tr key={p.productId} className="text-sm">
                                                <td className="py-3 pr-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{p.productName}</p>
                                                        <p className="text-gray-500 text-xs">{p.productId}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <ProgressBar
                                                            value={(p.bestseller?.bestsellerProbability || 0) * 100}
                                                            color={p.bestseller?.isPotentialBestseller ? 'bg-yellow-500' : 'bg-gray-400'}
                                                        />
                                                        <span className="w-12 text-right">{formatProbability(p.bestseller?.bestsellerProbability || 0)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4">{getPotentialBadge(p.bestseller?.potentialLevel)}</td>
                                                <td className="py-3 pr-4">
                                                    <Badge variant={p.bestseller?.confidenceLevel === 'HIGH' ? 'success' : p.bestseller?.confidenceLevel === 'MEDIUM' ? 'warning' : 'neutral'}>
                                                        {p.bestseller?.confidenceLevel || 'N/A'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                                                    {p.bestseller?.recommendation || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'rankings' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <th className="pb-3 pr-4">Product</th>
                                            <th className="pb-3 pr-4">Current Rank</th>
                                            <th className="pb-3 pr-4">Trend</th>
                                            <th className="pb-3 pr-4">Predicted Change</th>
                                            <th className="pb-3">Confidence</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {predictions.filter(p => p.ranking).slice(0, 20).map((p) => (
                                            <tr key={p.productId} className="text-sm">
                                                <td className="py-3 pr-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{p.productName}</p>
                                                        <p className="text-gray-500 text-xs">{p.productId}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 font-medium">#{p.ranking?.currentRank || '-'}</td>
                                                <td className="py-3 pr-4">{getTrendBadge(p.ranking?.predictedTrend)}</td>
                                                <td className="py-3 pr-4">
                                                        <span className={p.ranking?.estimatedChange && p.ranking.estimatedChange < 0 ? 'text-green-600' : p.ranking?.estimatedChange && p.ranking.estimatedChange > 0 ? 'text-red-600' : 'text-gray-600'}>
                                                            {p.ranking?.estimatedChange ? (p.ranking.estimatedChange > 0 ? '+' : '') + p.ranking.estimatedChange : '0'}
                                                        </span>
                                                </td>
                                                <td className="py-3">
                                                    <ProgressBar
                                                        value={(p.ranking?.confidenceScore || 0) * 100}
                                                        color="bg-blue-500"
                                                        label={`${((p.ranking?.confidenceScore || 0) * 100).toFixed(0)}%`}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {activeTab === 'prices' && (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                        <tr className="text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                                            <th className="pb-3 pr-4">Product</th>
                                            <th className="pb-3 pr-4">Current Price</th>
                                            <th className="pb-3 pr-4">Recommended</th>
                                            <th className="pb-3 pr-4">Action</th>
                                            <th className="pb-3">Positioning</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {predictions.filter(p => p.price).slice(0, 20).map((p) => (
                                            <tr key={p.productId} className="text-sm">
                                                <td className="py-3 pr-4">
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{p.productName}</p>
                                                        <p className="text-gray-500 text-xs">{p.productId}</p>
                                                    </div>
                                                </td>
                                                <td className="py-3 pr-4 font-medium">{formatPrice(p.price?.currentPrice)}</td>
                                                <td className="py-3 pr-4">
                                                        <span className={p.price?.priceAction === 'INCREASE' || p.price?.priceAction === 'AUGMENTER' ? 'text-green-600' : p.price?.priceAction === 'DECREASE' || p.price?.priceAction === 'DIMINUER' ? 'text-red-600' : 'text-gray-600'}>
                                                            {formatPrice(p.price?.recommendedPrice)}
                                                        </span>
                                                </td>
                                                <td className="py-3 pr-4">{getPriceActionBadge(p.price?.priceAction)}</td>
                                                <td className="py-3">
                                                    <Badge variant={p.price?.positioning === 'PREMIUM' ? 'info' : p.price?.positioning === 'BUDGET' ? 'warning' : 'neutral'}>
                                                        {p.price?.positioning || 'N/A'}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PredictiveDashboard;