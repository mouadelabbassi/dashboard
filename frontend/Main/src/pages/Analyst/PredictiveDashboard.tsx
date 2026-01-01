import React, { useState, useEffect, useCallback } from 'react';
import {
    getLatestPredictions,
    triggerBackgroundRefresh,
    getRefreshStatus,
    BestsellerPrediction as BestsellerPredictionType,
    RankingTrendPrediction as RankingTrendPredictionType,
    PriceIntelligence as PriceIntelligenceType,
    formatProbability,
    formatPrice,
    formatGeneratedAt,
} from '../../service/predictionService';

// Icons
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

// Types
interface CombinedPrediction {
    productId: string;
    productName: string;
    category: string;
    bestseller: BestsellerPredictionType | null;
    ranking: RankingTrendPredictionType | null;
    price: PriceIntelligenceType | null;
    lastUpdated: string;
}

interface DashboardStats {
    totalProducts: number;
    potentialBestsellers: number;
    improvingRankings: number;
    priceRecommendations: number;
    avgBestsellerProbability: number;
}

// Components
const ProgressBar: React.FC<{ value: number; color: string; label?: string }> = ({ value, color, label }) => (
    <div className="w-full">
        {label && (
            <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">{label}</span>
                <span className="font-medium text-gray-900 dark:text-white">{value.toFixed(1)}%</span>
            </div>
        )}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
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
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>{children}</span>;
};

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
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

// Main Component
const PredictiveDashboard: React.FC = () => {
    const [combinedPredictions, setCombinedPredictions] = useState<CombinedPrediction[]>([]);
    const [stats, setStats] = useState<DashboardStats>({ totalProducts: 0, potentialBestsellers: 0, improvingRankings: 0, priceRecommendations: 0, avgBestsellerProbability: 0 });
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'bestsellers' | 'prices'>('overview');
    const [isLoading, setIsLoading] = useState(true);

    // LOAD FROM CACHE ONLY - NO ML CALLS
    const loadCachedPredictions = useCallback(async () => {
        console.log('⚡ Loading from cache ONLY...');
        setIsLoading(true);
        setError(null);

        try {
            const cached = await getLatestPredictions();
            console.log('✅ Cache:', { bestsellers: cached.bestsellerPredictions?.length, rankings: cached.rankingPredictions?.length, prices: cached.priceIntelligence?.length });

            const predictionMap = new Map<string, CombinedPrediction>();

            (cached.bestsellerPredictions || []).forEach(bs => {
                predictionMap.set(bs.productId, { productId: bs.productId, productName: bs.productName || 'Unknown', category: 'General', bestseller: bs, ranking: null, price: null, lastUpdated: bs.predictedAt });
            });

            (cached.rankingPredictions || []).forEach(rk => {
                const existing = predictionMap.get(rk.productId);
                if (existing) { existing.ranking = rk; }
                else { predictionMap.set(rk.productId, { productId: rk.productId, productName: rk.productName || 'Unknown', category: 'General', bestseller: null, ranking: rk, price: null, lastUpdated: rk.predictedAt }); }
            });

            (cached.priceIntelligence || []).forEach(pr => {
                const existing = predictionMap.get(pr.productId);
                if (existing) { existing.price = pr; }
                else { predictionMap.set(pr.productId, { productId: pr.productId, productName: pr.productName || 'Unknown', category: 'General', bestseller: null, ranking: null, price: pr, lastUpdated: pr.analyzedAt }); }
            });

            const combined = Array.from(predictionMap.values());
            setCombinedPredictions(combined);

            const bestsellers = cached.bestsellerPredictions || [];
            const rankings = cached.rankingPredictions || [];
            const prices = cached.priceIntelligence || [];

            setStats({
                totalProducts: combined.length,
                potentialBestsellers: bestsellers.filter(b => b.isPotentialBestseller).length,
                improvingRankings: rankings.filter(r => r.predictedTrend === 'IMPROVING' || r.predictedTrend === 'AMÉLIORATION').length,
                priceRecommendations: prices.filter(p => p.priceAction !== 'MAINTAIN' && p.priceAction !== 'MAINTENIR').length,
                avgBestsellerProbability: bestsellers.length > 0 ? (bestsellers.reduce((s, b) => s + (b.bestsellerProbability || 0), 0) / bestsellers.length) * 100 : 0
            });

            setLastRefreshedAt(cached.lastRefreshedAt);
            setIsRefreshing(cached.isRefreshing || false);
        } catch (err) {
            console.error('❌ Cache error:', err);
            setError('Failed to load predictions.');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // MANUAL REFRESH - Only when user clicks
    const handleManualRefresh = useCallback(async () => {
        if (isRefreshing) return;
        console.log('🔄 Manual refresh triggered...');
        setIsRefreshing(true);

        try {
            await triggerBackgroundRefresh();
            const pollId = setInterval(async () => {
                const status = await getRefreshStatus();
                if (!status.isRefreshing) {
                    clearInterval(pollId);
                    setIsRefreshing(false);
                    await loadCachedPredictions();
                }
            }, 5000);
            setTimeout(() => { clearInterval(pollId); setIsRefreshing(false); }, 300000);
        } catch (err) {
            console.error('Refresh error:', err);
            setIsRefreshing(false);
        }
    }, [isRefreshing, loadCachedPredictions]);

    // INITIAL LOAD - CACHE ONLY!
    useEffect(() => { loadCachedPredictions(); }, [loadCachedPredictions]);

    // Helpers
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

    const bestsellers = combinedPredictions.filter(p => p.bestseller?.isPotentialBestseller);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading from cache...</p>
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
                            <span className="text-sm text-blue-700 dark:text-blue-300">Updating...</span>
                        </div>
                    )}
                    {lastRefreshedAt && !isRefreshing && <span className="text-sm text-gray-500">Last: {formatGeneratedAt(lastRefreshedAt)}</span>}
                    <button onClick={handleManualRefresh} disabled={isRefreshing} className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${isRefreshing ? 'bg-gray-300 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-gray-800'}`}>
                        <RefreshIcon />{isRefreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {error && <div className="p-4 rounded-lg bg-red-50 border border-red-200"><p className="text-red-800">{error}</p></div>}

            {combinedPredictions.length === 0 && !error && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-sm">
                    <ChartIcon />
                    <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No Predictions in Cache</h3>
                    <p className="mt-2 text-gray-500">Click "Refresh" to generate predictions.</p>
                </div>
            )}

            {combinedPredictions.length > 0 && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Products" value={stats.totalProducts} icon={<ChartIcon />} color="bg-blue-100 text-blue-600" />
                        <StatCard title="Potential Bestsellers" value={stats.potentialBestsellers} icon={<StarIcon />} color="bg-yellow-100 text-yellow-600" />
                        <StatCard title="Improving Rankings" value={stats.improvingRankings} icon={<TrendUpIcon />} color="bg-green-100 text-green-600" />
                        <StatCard title="Price Recommendations" value={stats.priceRecommendations} icon={<ChartIcon />} color="bg-purple-100 text-purple-600" />
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="border-b border-gray-200 dark:border-gray-700">
                            <nav className="flex space-x-8 px-6">
                                {[{ id: 'overview', label: 'Overview' }, { id: 'bestsellers', label: 'Bestsellers' }, { id: 'rankings', label: 'Rankings' }, { id: 'prices', label: 'Prices' }].map(tab => (
                                    <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)} className={`py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>{tab.label}</button>
                                ))}
                            </nav>
                        </div>

                        <div className="p-6">
                            {activeTab === 'overview' && (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <h3 className="text-lg font-medium mb-4">Avg Bestseller Probability</h3>
                                        <ProgressBar value={stats.avgBestsellerProbability} color="bg-blue-500" label="Overall" />
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <h3 className="text-lg font-medium mb-4">Top Bestsellers</h3>
                                        <div className="space-y-3">
                                            {bestsellers.slice(0, 5).map(p => (
                                                <div key={p.productId} className="flex justify-between">
                                                    <span className="text-sm truncate max-w-[200px]">{p.productName}</span>
                                                    <span className="text-sm font-medium text-blue-600">{formatProbability(p.bestseller?.bestsellerProbability || 0)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'bestsellers' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Potential</th></tr></thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {combinedPredictions.filter(p => p.bestseller).sort((a, b) => (b.bestseller?.bestsellerProbability || 0) - (a.bestseller?.bestsellerProbability || 0)).slice(0, 50).map(p => (
                                        <tr key={p.productId}><td className="px-4 py-4 text-sm">{p.productName}</td><td className="px-4 py-4">{formatProbability(p.bestseller?.bestsellerProbability || 0)}</td><td className="px-4 py-4">{getPotentialBadge(p.bestseller?.potentialLevel)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'rankings' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Current</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Predicted</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Trend</th></tr></thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {combinedPredictions.filter(p => p.ranking).slice(0, 50).map(p => (
                                        <tr key={p.productId}><td className="px-4 py-4 text-sm">{p.productName}</td><td className="px-4 py-4">#{p.ranking?.currentRank}</td><td className="px-4 py-4">#{p.ranking?.predictedRank}</td><td className="px-4 py-4">{getTrendBadge(p.ranking?.predictedTrend)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}

                            {activeTab === 'prices' && (
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead><tr><th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Current</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Recommended</th><th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th></tr></thead>
                                    <tbody className="divide-y divide-gray-200">
                                    {combinedPredictions.filter(p => p.price).slice(0, 50).map(p => (
                                        <tr key={p.productId}><td className="px-4 py-4 text-sm">{p.productName}</td><td className="px-4 py-4">{formatPrice(p.price?.currentPrice || 0)}</td><td className="px-4 py-4 text-blue-600">{formatPrice(p.price?.recommendedPrice || 0)}</td><td className="px-4 py-4">{getPriceActionBadge(p.price?.priceAction)}</td></tr>
                                    ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PredictiveDashboard;