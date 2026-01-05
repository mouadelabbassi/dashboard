import React, { useState, useEffect } from 'react';
import {
    getSellerAlerts,
    ProductPrediction,
    formatProbability,
    formatPrice,
    formatGeneratedAt
} from '../../service/predictionService';

interface PredictionNotificationsProps {
    sellerId: number;
    compact?: boolean;
    maxItems?: number;
}

const PredictionNotifications: React.FC<PredictionNotificationsProps> = ({
                                                                             sellerId,
                                                                             compact = false,
                                                                             maxItems
                                                                         }) => {
    const [alerts, setAlerts] = useState<ProductPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    useEffect(() => {
        if (sellerId) {
            loadAlerts();
        }
    }, [sellerId]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getSellerAlerts(sellerId);
            setAlerts(maxItems ? data.slice(0, maxItems) : data);
        } catch (err) {
            console.error('Erreur lors du chargement des alertes:', err);
            setError('Impossible de charger les alertes prédictives');
        } finally {
            setLoading(false);
        }
    };

    const getPotentialLevelColor = (level: string): string => {
        switch (level) {
            case 'TRÈS ÉLEVÉ':
            case 'VERY_HIGH':
                return 'bg-gradient-to-r from-yellow-400 to-orange-500';
            case 'ÉLEVÉ':
            case 'HIGH':
                return 'bg-gradient-to-r from-green-400 to-emerald-500';
            case 'MODÉRÉ':
            case 'MODERATE':
                return 'bg-blue-500';
            case 'FAIBLE':
            case 'LOW':
                return 'bg-gray-400';
            default:
                return 'bg-gray-400';
        }
    };

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-4 text-red-600 dark:text-red-400">
                {error}
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400">Aucune alerte prédictive pour le moment</p>
            </div>
        );
    }

    if (compact) {
        return (
            <div className="space-y-2">
                {alerts.map((alert) => (
                    <div
                        key={alert.productId}
                        className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {alert.productName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    {alert.bestsellerPrediction?.isPotentialBestseller && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                            🌟 {formatProbability(alert.bestsellerPrediction.bestsellerProbability)}
                                        </span>
                                    )}
                                    {alert.pricePrediction?.priceAction && alert.pricePrediction.priceAction !== 'MAINTENIR' && alert.pricePrediction.priceAction !== 'MAINTAIN' && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                                            alert.pricePrediction.priceAction === 'AUGMENTER' || alert.pricePrediction.priceAction === 'INCREASE'
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                        }`}>
                                            💹 {alert.pricePrediction.priceAction}
                                        </span>
                                    )}
                                    {alert.rankingPrediction?.trend && (alert.rankingPrediction.trend === 'AMÉLIORATION' || alert.rankingPrediction.trend === 'IMPROVING') && (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                            📈 +{Math.abs(alert.rankingPrediction.rankingChange || 0)}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {alerts.map((alert) => (
                <div
                    key={alert.productId}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                    <div
                        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        onClick={() => setExpanded(expanded === alert.productId ? null : alert.productId)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {alert.productName}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {alert.productId} • {alert.category}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {alert.bestsellerPrediction?.isPotentialBestseller && (
                                    <span className={`px-3 py-1 rounded-full text-white text-xs font-medium ${getPotentialLevelColor(alert.bestsellerPrediction.potentialLevel)}`}>
                                        🌟 Bestseller Potentiel
                                    </span>
                                )}
                                <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expanded === alert.productId ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-3">
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <span className="inline-flex items-center gap-1 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                                    🎯 Probabilité: {formatProbability(alert.bestsellerPrediction.bestsellerProbability)}
                                </span>
                            )}
                            {alert.pricePrediction?.priceAction && alert.pricePrediction.priceAction !== 'MAINTENIR' && alert.pricePrediction.priceAction !== 'MAINTAIN' && (
                                <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded ${
                                    alert.pricePrediction.priceAction === 'AUGMENTER' || alert.pricePrediction.priceAction === 'INCREASE'
                                        ? 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                        : 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                                }`}>
                                    💹 Prix: {alert.pricePrediction.priceAction} ({alert.pricePrediction.priceChangePercentage?.toFixed(1)}%)
                                </span>
                            )}
                            {alert.rankingPrediction?.trend && (alert.rankingPrediction.trend === 'AMÉLIORATION' || alert.rankingPrediction.trend === 'IMPROVING') && (
                                <span className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                                    📈 Classement: +{Math.abs(alert.rankingPrediction.rankingChange || 0)} places
                                </span>
                            )}
                        </div>
                    </div>

                    {expanded === alert.productId && (
                        <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <div className="mb-4 p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                                    <h5 className="font-medium text-yellow-800 dark:text-yellow-300 mb-2">
                                        🌟 Analyse Bestseller
                                    </h5>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Probabilité</span>
                                            <span className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                                {formatProbability(alert.bestsellerPrediction.bestsellerProbability)}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Niveau</span>
                                            <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                                {alert.bestsellerPrediction.potentialLevel}
                                            </span>
                                        </div>
                                    </div>
                                    {alert.bestsellerPrediction.recommendation && (
                                        <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                💡 <strong>Recommandation:</strong> {alert.bestsellerPrediction.recommendation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {alert.pricePrediction?.priceAction && alert.pricePrediction.priceAction !== 'MAINTENIR' && alert.pricePrediction.priceAction !== 'MAINTAIN' && (
                                <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                                    <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                                        💹 Recommandation de Prix
                                    </h5>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prix actuel</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                {formatPrice(alert.pricePrediction.currentPrice)}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <span className={`text-2xl ${
                                                alert.pricePrediction.priceAction === 'AUGMENTER' || alert.pricePrediction.priceAction === 'INCREASE'
                                                    ? 'text-green-500' : 'text-red-500'
                                            }`}>
                                                {alert.pricePrediction.priceAction === 'AUGMENTER' || alert.pricePrediction.priceAction === 'INCREASE' ? '↑' : '↓'}
                                            </span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">
                                                {alert.pricePrediction.actionDescription || alert.pricePrediction.priceAction}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prix recommandé</span>
                                            <span className={`text-lg font-bold ${
                                                alert.pricePrediction.priceAction === 'AUGMENTER' || alert.pricePrediction.priceAction === 'INCREASE'
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-red-600 dark:text-red-400'
                                            }`}>
                                                {formatPrice(alert.pricePrediction.recommendedPrice)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {alert.rankingPrediction && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                                    <h5 className="font-medium text-purple-800 dark:text-purple-300 mb-2">
                                        📊 Tendance du Classement
                                    </h5>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Classement actuel</span>
                                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                                #{alert.rankingPrediction.currentRanking}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
                                            <span className={`text-2xl ${
                                                alert.rankingPrediction.trend === 'AMÉLIORATION' || alert.rankingPrediction.trend === 'IMPROVING'
                                                    ? 'text-green-500'
                                                    : alert.rankingPrediction.trend === 'DÉCLIN' || alert.rankingPrediction.trend === 'DECLINING'
                                                        ? 'text-red-500'
                                                        : 'text-gray-500'
                                            }`}>
                                                {alert.rankingPrediction.trend === 'AMÉLIORATION' || alert.rankingPrediction.trend === 'IMPROVING' ? '↑' : ''}
                                                {alert.rankingPrediction.trend === 'DÉCLIN' || alert.rankingPrediction.trend === 'DECLINING' ? '↓' : ''}
                                                {alert.rankingPrediction.trend === 'STABLE' ? '→' : ''}
                                                {' '}{alert.rankingPrediction.trend}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prévu</span>
                                            <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                                #{alert.rankingPrediction.predictedRanking}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-right">
                                Généré: {formatGeneratedAt(alert.generatedAt)}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default PredictionNotifications;