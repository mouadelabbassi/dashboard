import React, { useState, useEffect, useCallback } from 'react';
import {
    getAllPredictions,
    getPredictionStats,
    getPotentialBestsellers,
    checkPredictionServiceHealth,
    ProductPrediction,
    PredictionStats,
    HealthStatus,
    getPredictionCount,
    generatePredictionsSync,
    formatProbability,
    formatPrice,
    formatGeneratedAt
} from '../../service/predictionService';

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-. 402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

const CpuIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
);

const BoxIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);
const XCircleIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// ==================== COMPOSANTS ====================

interface StatCardProps {
    title:string;
    value:string | number;
    subtitle?:string;
    icon:React.ReactNode;
    trend?:'up' | 'down' | 'neutral';
    trendValue?:string;
    color: 'blue' | 'green' | 'yellow' | 'purple' | 'red' | 'indigo';
}

const StatCard:React.FC<StatCardProps> = ({ title, value, subtitle, icon, trend, trendValue, color }) => {
    const colorClasses = {
        blue:'from-blue-500 to-blue-600',
        green:'from-green-500 to-green-600',
        yellow:'from-yellow-500 to-yellow-600',
        purple:'from-purple-500 to-purple-600',
        red:'from-red-500 to-red-600',
        indigo: 'from-indigo-500 to-indigo-600'
    };

    const bgColorClasses = {
        blue: 'bg-blue-500/10 dark:bg-blue-500/20',
        green:'bg-green-500/10 dark:bg-green-500/20',
        yellow:'bg-yellow-500/10 dark:bg-yellow-500/20',
        purple:'bg-purple-500/10 dark:bg-purple-500/20',
        red:'bg-red-500/10 dark:bg-red-500/20',
        indigo:'bg-indigo-500/10 dark:bg-indigo-500/20'
    };

    const iconColorClasses = {
        blue: 'text-blue-500',
        green:'text-green-500',
        yellow: 'text-yellow-500',
        purple:'text-purple-500',
        red: 'text-red-500',
        indigo:'text-indigo-500'
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Gradient accent */}
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${colorClasses[color]}`} />

            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                    {subtitle && (
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
                    )}
                    {trend && trendValue && (
                        <div className={`mt-2 flex items-center gap-1 text-sm ${
                            trend === 'up' ?  'text-green-500' :trend === 'down' ? 'text-red-500' :'text-gray-500'
                        }`}>
                            {trend === 'up' ? <TrendUpIcon /> :trend === 'down' ? <TrendDownIcon /> :null}
                            <span>{trendValue}</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${bgColorClasses[color]}`}>
                    <span className={iconColorClasses[color]}>{icon}</span>
                </div>
            </div>
        </div>
    );
};


const ProgressBar:React.FC<{ value:number; color:string; label?: string }> = ({ value, color, label }) => (
    <div className="w-full">
        {label && <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400">{label}</span>
            <span className="font-medium text-gray-900 dark:text-white">{value. toFixed(1)}%</span>
        </div>}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${color}`}
                style={{ width:`${Math.min(value, 100)}%` }}
            />
        </div>
    </div>
);
// Badge Component
const Badge:React.FC<{ children:React.ReactNode; variant:'success' | 'warning' | 'danger' | 'info' | 'neutral' }> = ({ children, variant }) => {
    const variants = {
        success:'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        warning:'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        danger:'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        info:'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        neutral:'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
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
    const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'rankings' | 'bestsellers' | 'prices' | 'models'>('overview');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [showInitialGenModal, setShowInitialGenModal] = useState(false);
    const [generationProgress, setGenerationProgress] = useState<{
        processed: number;
        total: number;
        success: number;
        failures: number;
    } | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const loadDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [predictionsData, statsData, bestsellersData, health] = await Promise.all([
                getAllPredictions().catch(() => []),
                getPredictionStats().catch(() => null),
                getPotentialBestsellers().catch(() => []),
                checkPredictionServiceHealth().catch(() => ({ springBootService:'UP', mlServiceAvailable:false })),
                getPredictionCount().catch(() => ({ predictionCount: 0, productCount: 0, needsGeneration: false, coveragePercent: 0 }))
            ]);
            setPredictions(predictionsData);
            setStats(statsData);
            setBestsellers(bestsellersData);
            setHealthStatus(health);
        } catch (err: any) {
            console.error('Erreur:', err);
            setError(err.response?.data?.message || 'Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    }, []);
    const handleAutoGenerate = async () => {
        if (!healthStatus?.mlServiceAvailable) {
            alert('Le service ML n\'est pas disponible.');
            return;
        }
        setShowInitialGenModal(false);
        setGenerating(true);
        setGenerationProgress({ processed: 0, total: 0, success: 0, failures: 0 });
        try {
            let remaining = 999;
            let totalProcessed = 0;
            let totalSuccess = 0;
            let totalFailures = 0;
            while (remaining > 0) {
                const result = await generatePredictionsSync(50);
                totalProcessed += result.processed;
                totalSuccess += result.successCount;
                totalFailures += result.failureCount;
                remaining = result.remainingProducts;
                setGenerationProgress({
                    processed: totalProcessed,
                    total: result.totalProducts,
                    success: totalSuccess,
                    failures: totalFailures
                });
                if (remaining > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            await loadDashboardData();
        } catch (err: any) {
            console.error('Erreur génération:', err);
            setError(err.response?.data?.message || 'Erreur lors de la génération');
        } finally {
            setGenerating(false);
            setGenerationProgress(null);
        }
    };

    useEffect(() => {
        loadDashboardData();
    }, [loadDashboardData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadDashboardData();
        setRefreshing(false);
    };

    const handleGenerateAll = async () => {
        if (!healthStatus?.mlServiceAvailable) {
            alert('Le service ML n\'est pas disponible. Veuillez démarrer le microservice Flask.');
            return;
        }
        await handleAutoGenerate();
    };

    // Filtrage
    const filteredPredictions = selectedCategory === 'all'
        ? predictions
        :predictions.filter(p => p.category === selectedCategory);

    const categories = ['all', ... new Set(predictions.map(p => p.category).filter(Boolean))];

    // Helpers
    const getTrendBadge = (trend:string) => {
        switch (trend) {
            case 'AMÉLIORATION':return <Badge variant="success">↑ {trend}</Badge>;
            case 'DÉCLIN':return <Badge variant="danger">↓ {trend}</Badge>;
            default:return <Badge variant="neutral">→ {trend}</Badge>;
        }
    };

    const getPotentialBadge = (level:string) => {
        switch (level) {
            case 'TRÈS ÉLEVÉ':return <Badge variant="success">{level}</Badge>;
            case 'ÉLEVÉ':return <Badge variant="info">{level}</Badge>;
            case 'MODÉRÉ':return <Badge variant="warning">{level}</Badge>;
            default:return <Badge variant="danger">{level}</Badge>;
        }
    };

    const getPriceActionBadge = (action:string) => {
        switch (action) {
            case 'AUGMENTER':return <Badge variant="success">↑ {action}</Badge>;
            case 'DIMINUER':return <Badge variant="danger">↓ {action}</Badge>;
            default:return <Badge variant="neutral">→ {action}</Badge>;
        }
    };

    // Loading State
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 rounded-full animate-spin border-t-blue-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <ChartIcon />
                    </div>
                </div>
                <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading predictive analysis...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        High Analysis
                    </h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                        Predictive Decision Support Dashboard for Sales Management
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">

                    <button
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all disabled:opacity-50"
                    >
                        <RefreshIcon />
                    </button>

                    <button
                        onClick={handleGenerateAll}
                        disabled={generating || !healthStatus?.mlServiceAvailable}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                            generating || !healthStatus?.mlServiceAvailable
                                ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:shadow-lg hover:shadow-blue-500/25 hover:-translate-y-0.5'
                        }`}
                    >
                        {generating ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Generation...
                            </>
                        ) :(
                            <>
                                <RefreshIcon />
                                Generate
                            </>
                        )}
                    </button>
                </div>
            </div>

            {showInitialGenModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ChartIcon />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Bienvenue dans l'Analyse Prédictive
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Aucune prédiction n'a encore été générée. Voulez-vous lancer l'analyse ML sur tous vos produits ?
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowInitialGenModal(false)}
                                    className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                    Plus tard
                                </button>
                                <button
                                    onClick={handleAutoGenerate}
                                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25 transition-all"
                                >
                                    Générer maintenant
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Generation Progress */}
            {generating && generationProgress && (
                <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin border-t-blue-500"></div>
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">Génération des prédictions en cours...</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Analyse ML de {generationProgress.processed} / {generationProgress.total} produits
                            </p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden mb-2">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300"
                            style={{ width: `${generationProgress.total > 0 ? (generationProgress.processed / generationProgress.total) * 100 : 0}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-green-600 dark:text-green-400">{generationProgress.success} réussies</span>
                        {generationProgress.failures > 0 && (
                            <span className="text-red-600 dark:text-red-400">{generationProgress.failures} échecs</span>
                        )}
                    </div>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
                    <div className="flex items-center gap-2">
                        <XCircleIcon />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatCard
                        title="Produits Analysés"
                        value={stats. totalPredictions}
                        subtitle="Total des prédictions"
                        icon={<BoxIcon />}
                        color="blue"
                    />
                    <StatCard
                        title="Bestsellers Potentiels"
                        value={stats.potentialBestsellersCount}
                        subtitle={`${formatProbability(stats.averageBestsellerProbability)} prob.  moyenne`}
                        icon={<StarIcon />}
                        color="green"
                        trend="up"
                        trendValue={`${((stats.potentialBestsellersCount / Math.max(stats.totalPredictions, 1)) * 100).toFixed(1)}% du total`}
                    />
                    <StatCard
                        title="Recommandations Prix"
                        value={stats.productsWithPriceRecommendation}
                        subtitle={`±${stats.averagePriceChangeRecommended. toFixed(1)}% en moyenne`}
                        icon={<DollarIcon />}
                        color="yellow"
                    />
                    <StatCard
                        title="Tendance Positive"
                        value={stats.productsWithRankingImprovement}
                        subtitle="Amélioration prévue"
                        icon={<TrendUpIcon />}
                        color="purple"
                        trend="up"
                        trendValue="En progression"
                    />
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex overflow-x-auto">
                        {[
                            { id:'overview', label:'Vue d\'ensemble', icon:<ChartIcon /> },
                            { id:'rankings', label:'Classements', icon:<TrendUpIcon /> },
                            { id:'bestsellers', label:'Bestsellers', icon:<StarIcon /> },
                            { id:'prices', label:'Prix', icon:<DollarIcon /> },
                            { id:'models', label:'Modèles ML', icon:<CpuIcon /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                                        :'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Category Filter */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Catégorie:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>
                                    {cat === 'all' ? 'Toutes les catégories' :cat}
                                </option>
                            ))}
                        </select>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredPredictions.length} produit(s)
            </span>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && stats && (
                        <div className="space-y-8">
                            {/* Distribution Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Trend Distribution */}
                                <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Distribution des Tendances
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(stats.trendDistribution || {}).map(([trend, count]) => {
                                            const percentage = (count / stats.totalPredictions) * 100;
                                            const color = trend === 'AMÉLIORATION' ? 'bg-green-500' :trend === 'DÉCLIN' ?  'bg-red-500' :'bg-yellow-500';
                                            return (
                                                <div key={trend}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-gray-400">{trend}</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">{count} ({percentage.toFixed(1)}%)</span>
                                                    </div>
                                                    <ProgressBar value={percentage} color={color} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Price Action Distribution */}
                                <div className="p-6 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Recommandations de Prix
                                    </h3>
                                    <div className="space-y-4">
                                        {Object.entries(stats.priceActionDistribution || {}).map(([action, count]) => {
                                            const percentage = (count / stats.totalPredictions) * 100;
                                            const color = action === 'AUGMENTER' ? 'bg-green-500' :action === 'DIMINUER' ? 'bg-red-500' :'bg-gray-400';
                                            return (
                                                <div key={action}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-600 dark:text-gray-400">{action}</span>
                                                        <span className="font-medium text-gray-900 dark:text-white">{count} ({percentage.toFixed(1)}%)</span>
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
                                        Analyse par Catégorie
                                    </h3>
                                    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Catégorie</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Produits</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Prob. Bestseller</th>
                                                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Variation Prix</th>
                                            </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {stats.categoryStats.map((cat, index) => (
                                                <tr key={cat.category} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' :'bg-gray-50 dark:bg-gray-800/50'}>
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{cat.category}</td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">{cat.productCount}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant={cat.avgBestsellerProbability > 0.5 ? 'success' : 'neutral'}>
                                                            {formatProbability(cat.avgBestsellerProbability)}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                              <span className={`font-medium ${cat.avgPriceChange > 0 ? 'text-green-500' :cat.avgPriceChange < 0 ? 'text-red-500' :'text-gray-500'}`}>
                                {cat.avgPriceChange > 0 ? '+' :''}{cat.avgPriceChange.toFixed(1)}%
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
                                Future Ranking Predictions
                            </h3>
                            {filteredPredictions.length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <BoxIcon />
                                    <p className="mt-2">No Active Prediction</p>
                                </div>
                            ) :(
                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Product</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Actuel</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">predict</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Variation</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tendance</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Confidence</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredPredictions
                                            .sort((a, b) => (b.rankingPrediction?. rankingChange || 0) - (a.rankingPrediction?.rankingChange || 0))
                                            .slice(0, 20)
                                            .map((pred, index) => (
                                                <tr key={pred.productId} className={index % 2 === 0 ?  'bg-white dark:bg-gray-800' :'bg-gray-50 dark:bg-gray-800/50'}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{pred.productName}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">ID:{pred.productId}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <Badge variant="info">{pred.category}</Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-gray-600 dark:text-gray-400">
                                                        #{pred.rankingPrediction?. currentRanking || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono font-bold text-gray-900 dark:text-white">
                                                        #{pred.rankingPrediction?. predictedRanking || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${
                                (pred.rankingPrediction?. rankingChange || 0) > 0 ? 'text-green-500' :
                                    (pred.rankingPrediction?.rankingChange || 0) < 0 ? 'text-red-500' : 'text-gray-500'
                            }`}>
                              {(pred.rankingPrediction?.rankingChange || 0) > 0 ? '+' : ''}
                                {pred.rankingPrediction?.rankingChange || 0}
                            </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getTrendBadge(pred.rankingPrediction?.trend || 'STABLE')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                                <div
                                                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                                                    style={{ width: `${(pred.rankingPrediction?.confidence || 0) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {formatProbability(pred.rankingPrediction?.confidence || 0)}
                              </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bestsellers' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Bestsellers Potentiels Identifiés
                            </h3>
                            {bestsellers.length === 0 ?  (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <StarIcon />
                                    <p className="mt-2">No potential bestsellers identified</p>
                                </div>
                            ) :(
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {bestsellers.slice(0, 12).map(pred => (
                                        <div
                                            key={pred.productId}
                                            className="p-6 rounded-xl bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all hover:-translate-y-1"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{pred.productName}</h4>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{pred.category}</p>
                                                </div>
                                                {getPotentialBadge(pred.bestsellerPrediction?.potentialLevel || 'FAIBLE')}
                                            </div>

                                            <div className="mb-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600 dark:text-gray-400">Probability </span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                            {formatProbability(pred.bestsellerPrediction?.bestsellerProbability || 0)}
                          </span>
                                                </div>
                                                <ProgressBar
                                                    value={(pred.bestsellerPrediction?.bestsellerProbability || 0) * 100}
                                                    color={
                                                        (pred.bestsellerPrediction?.bestsellerProbability || 0) >= 0.7 ? 'bg-green-500' :
                                                            (pred.bestsellerPrediction?.bestsellerProbability || 0) >= 0.5 ? 'bg-yellow-500' :'bg-red-500'
                                                    }
                                                />
                                            </div>

                                            {pred.bestsellerPrediction?. recommendation && (
                                                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                                        💡 {pred.bestsellerPrediction.recommendation}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                                Generated At {formatGeneratedAt(pred.generatedAt)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'prices' && (
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Optimal Price Recommendation
                            </h3>
                            {filteredPredictions.filter(p => p.pricePrediction?. priceAction !== 'MAINTENIR').length === 0 ? (
                                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                                    <DollarIcon />
                                    <p className="mt-2">No significant price recommendations</p>
                                </div>
                            ) :(
                                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Produit</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Prix Actuel</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Prix Recommandé</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Variation</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Action</th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Confiance</th>
                                        </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredPredictions
                                            .filter(p => p.pricePrediction?.priceAction !== 'MAINTENIR')
                                            .sort((a, b) => Math.abs(b.pricePrediction?.priceChangePercentage || 0) - Math.abs(a.pricePrediction?.priceChangePercentage || 0))
                                            .slice(0, 20)
                                            .map((pred, index) => (
                                                <tr key={pred.productId} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' :'bg-gray-50 dark:bg-gray-800/50'}>
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{pred. productName}</div>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">{pred.category}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono text-gray-600 dark:text-gray-400">
                                                        {formatPrice(pred.pricePrediction?.currentPrice || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {formatPrice(pred.pricePrediction?.recommendedPrice || 0)}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                            <span className={`font-bold ${
                                (pred.pricePrediction?.priceChangePercentage || 0) > 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {(pred. pricePrediction?.priceChangePercentage || 0) > 0 ? '+' : ''}
                                {pred. pricePrediction?.priceChangePercentage?. toFixed(1)}%
                            </span>
                                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                                            ({formatPrice(pred.pricePrediction?.priceDifference || 0)})
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {getPriceActionBadge(pred. pricePrediction?.priceAction || 'MAINTENIR')}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
                                                        {formatProbability(pred.pricePrediction?.confidence || 0)}
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