import React, { useState, useEffect } from 'react';
import {
    getSellerAlerts,
    ProductPrediction,
    formatProbability,
    formatPrice,
    formatGeneratedAt
} from '../../service/predictionService';

interface PredictionNotificationsProps {
    sellerId:number;
    compact?:boolean;
    maxItems?:number;
}

const PredictionNotifications:React.FC<PredictionNotificationsProps> = ({
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
            setAlerts(maxItems ? data.slice(0, maxItems) :data);
        } catch (err) {
            console.error('Erreur lors du chargement des alertes:', err);
            setError('Impossible de charger les alertes prédictives');
        } finally {
            setLoading(false);
        }
    };

    const getPotentialLevelColor = (level:string):string => {
        switch (level) {
            case 'TRÈS ÉLEVÉ':
                return 'bg-gradient-to-r from-yellow-400 to-orange-500';
            case 'ÉLEVÉ':
                return 'bg-gradient-to-r from-green-400 to-emerald-500';
            case 'MODÉRÉ':
                return 'bg-blue-500';
            case 'FAIBLE':
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
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                        <p className="font-medium text-red-800 dark:text-red-200">{error}</p>
                        <button
                            onClick={loadAlerts}
                            className="text-sm text-red-600 dark:text-red-400 hover:underline mt-1"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <span className="text-3xl">✅</span>
                </div>
                <p className="font-semibold text-green-800 dark:text-green-200 text-lg">Aucune alerte prédictive</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Tous vos produits sont bien positionnés actuellement.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            {! compact && (
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl text-white">
                            <span className="text-xl">🔮</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                                Alertes Prédictives
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Recommandations basées sur l'IA
                            </p>
                        </div>
                    </div>
                    <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-bold rounded-full shadow-lg shadow-red-500/25">
                        {alerts.length} alerte{alerts.length > 1 ? 's' :''}
                    </span>
                </div>
            )}

            {/* Alert Cards */}
            {alerts.map((alert) => (
                <div
                    key={alert.productId}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                >
                    {/* Card Header */}
                    <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpanded(expanded === alert.productId ? null :alert.productId)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    {alert.bestsellerPrediction?.isPotentialBestseller && (
                                        <span className="text-yellow-500 text-lg">⭐</span>
                                    )}
                                    {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                        <span className="text-blue-500 text-lg">💰</span>
                                    )}
                                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                        {alert.productName}
                                    </h4>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{alert.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`transform transition-transform duration-200 text-gray-400 ${
                                    expanded === alert.productId ? 'rotate-90' :''
                                }`}>
                                    ▶
                                </span>
                            </div>
                        </div>

                        {/* Quick Summary Badges */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                                    getPotentialLevelColor(alert.bestsellerPrediction.potentialLevel)
                                }`}>
                                    🔮 Potentiel: {alert.bestsellerPrediction.potentialLevel}
                                </span>
                            )}
                            {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                    alert.pricePrediction?.priceAction === 'AUGMENTER'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        :'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                }`}>
                                    💹 Prix:{alert.pricePrediction?.priceAction} ({alert.pricePrediction?.priceChangePercentage?.toFixed(1)}%)
                                </span>
                            )}
                            {alert.rankingPrediction?.trend === 'AMÉLIORATION' && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                                    📈 Classement:+{alert.rankingPrediction.rankingChange} places
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Expanded Details */}
                    {expanded === alert.productId && (
                        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 space-y-4">
                            {/* Bestseller Alert */}
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <div className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                                    <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                                        <span className="text-xl">⭐</span>
                                        Potentiel Bestseller Détecté
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4">
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

                            {/* Price Alert */}
                            {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                                    <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                                        <span className="text-xl">💰</span>
                                        Recommandation de Prix
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 mb-3">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prix actuel</span>
                                            <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                                {formatPrice(alert.pricePrediction.currentPrice)}
                                            </span>
                                        </div>
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prix recommandé</span>
                                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                {formatPrice(alert.pricePrediction.recommendedPrice)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                        <span className={`text-2xl ${
                                            alert.pricePrediction.priceAction === 'AUGMENTER'
                                                ? 'text-green-500'
                                                :'text-red-500'
                                        }`}>
                                            {alert.pricePrediction.priceAction === 'AUGMENTER' ? '↑' :'↓'}
                                        </span>
                                        <span className="text-sm text-blue-800 dark:text-blue-200">
                                            {alert.pricePrediction.actionDescription}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Ranking Prediction */}
                            {alert.rankingPrediction && (
                                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
                                    <h5 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                                        <span className="text-xl">🏆</span>
                                        Évolution du Classement
                                    </h5>
                                    <div className="flex items-center justify-center gap-4 py-2">
                                        <div className="text-center">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Actuel</span>
                                            <span className="text-2xl font-mono font-bold text-gray-600 dark:text-gray-400">
                                                #{alert.rankingPrediction.currentRanking}
                                            </span>
                                        </div>
                                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                                            alert.rankingPrediction.trend === 'AMÉLIORATION'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : alert.rankingPrediction.trend === 'DÉCLIN'
                                                    ?  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                    :'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {alert.rankingPrediction.trend === 'AMÉLIORATION' && '↑'}
                                            {alert.rankingPrediction.trend === 'DÉCLIN' && '↓'}
                                            {alert.rankingPrediction.trend === 'STABLE' && '→'}
                                            {' '}{alert.rankingPrediction.trend}
                                        </div>
                                        <div className="text-center">
                                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Prédit</span>
                                            <span className="text-2xl font-mono font-bold text-purple-600 dark:text-purple-400">
                                                #{alert.rankingPrediction.predictedRanking}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Generation Date */}
                            <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span className="text-xs text-gray-400">
                                    🤖 Analyse générée par ML
                                </span>
                                <span className="text-xs text-gray-400">
                                    {formatGeneratedAt(alert.generatedAt)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Info Note */}
            {!compact && (
                <div className="mt-6 p-4 bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800 dark:to-slate-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                        <strong className="text-gray-700 dark:text-gray-300">ℹ️ Note:</strong> Ces alertes sont générées par notre système d'analyse prédictive basé sur le Machine Learning
                        et constituent des recommandations d'aide à la décision.Les résultats doivent être
                        interprétés en fonction du contexte de votre activité.
                    </p>
                </div>
            )}
        </div>
    );
};

export default PredictionNotifications;