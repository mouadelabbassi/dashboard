/**
 * Composant de notifications prédictives pour les vendeurs
 * Plateforme de Gestion et Analyse de Ventes - Mini Projet JEE 2025
 * Module: Analyse Prédictive
 *
 * Ce composant affiche les alertes et notifications basées sur les
 * analyses prédictives pour les vendeurs.
 */

import React, { useState, useEffect } from 'react';
import {
    getSellerPredictionAlerts,
    ProductPrediction,
    formatProbability,
    formatPrice,
    getPotentialLevelColor,
    formatGeneratedAt
} from '../../service/predictionService';

interface PredictionNotificationsProps {
    sellerId: number;
}

const PredictionNotifications: React.FC<PredictionNotificationsProps> = ({ sellerId }) => {
    const [alerts, setAlerts] = useState<ProductPrediction[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<number | null>(null);

    useEffect(() => {
        loadAlerts();
    }, [sellerId]);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await getSellerPredictionAlerts(sellerId);
            setAlerts(data);
        } catch (error) {
            console.error('Erreur lors du chargement des alertes:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse bg-gray-100 rounded-lg p-4">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
        );
    }

    if (alerts.length === 0) {
        return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
                <div className="flex items-center">
                    <span className="text-2xl mr-3">✅</span>
                    <div>
                        <p className="font-medium">Aucune alerte prédictive</p>
                        <p className="text-sm">Tous vos produits sont bien positionnés actuellement.</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">
                    🔮 Alertes Prédictives
                </h3>
                <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
          {alerts.length} alerte(s)
        </span>
            </div>

            {alerts.map((alert) => (
                <div
                    key={alert.productId}
                    className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                    {/* En-tête de l'alerte */}
                    <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpanded(expanded === alert.productId ?  null : alert.productId)}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    {alert.bestsellerPrediction?.isPotentialBestseller && (
                                        <span className="text-yellow-500">⭐</span>
                                    )}
                                    {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                        <span className="text-green-500">💰</span>
                                    )}
                                    <h4 className="font-semibold text-gray-800">{alert.productName}</h4>
                                </div>
                                <p className="text-sm text-gray-500">{alert.category}</p>
                            </div>
                            <span className="text-gray-400">
                {expanded === alert.productId ? '▼' : '▶'}
              </span>
                        </div>

                        {/* Résumé rapide */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <span className={`px-2 py-1 rounded-full text-xs text-white ${
                                    getPotentialLevelColor(alert.bestsellerPrediction.potentialLevel)
                                }`}>
                  Potentiel:  {alert.bestsellerPrediction.potentialLevel}
                </span>
                            )}
                            {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                    alert.pricePrediction?.priceAction === 'AUGMENTER'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                }`}>
                  Prix: {alert.pricePrediction?.priceAction} ({alert.pricePrediction?.priceChangePercentage?.toFixed(1)}%)
                </span>
                            )}
                        </div>
                    </div>

                    {/* Détails expandables */}
                    {expanded === alert.productId && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                            {/* Alerte Bestseller */}
                            {alert.bestsellerPrediction?.isPotentialBestseller && (
                                <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                                    <h5 className="font-medium text-yellow-800 mb-2">
                                        ⭐ Potentiel Bestseller Détecté
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Probabilité: </span>
                                            <span className="ml-2 font-bold">
                        {formatProbability(alert.bestsellerPrediction.bestsellerProbability)}
                      </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Niveau: </span>
                                            <span className="ml-2 font-bold">
                        {alert.bestsellerPrediction.potentialLevel}
                      </span>
                                        </div>
                                    </div>
                                    {alert.bestsellerPrediction.recommendation && (
                                        <p className="mt-2 text-sm text-yellow-700 bg-yellow-100 rounded p-2">
                                            💡 {alert.bestsellerPrediction.recommendation}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Alerte Prix */}
                            {alert.pricePrediction?.priceAction !== 'MAINTENIR' && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <h5 className="font-medium text-blue-800 mb-2">
                                        💰 Recommandation de Prix
                                    </h5>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Prix actuel:</span>
                                            <span className="ml-2 font-medium">
                        {formatPrice(alert.pricePrediction.currentPrice)}
                      </span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Prix recommandé:</span>
                                            <span className="ml-2 font-bold text-blue-600">
                        {formatPrice(alert.pricePrediction.recommendedPrice)}
                      </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center">
                    <span className={`text-lg mr-2 ${
                        alert.pricePrediction.priceAction === 'AUGMENTER' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {alert.pricePrediction.priceAction === 'AUGMENTER' ?  '↑' : '↓'}
                    </span>
                                        <span className="text-sm">
                      {alert.pricePrediction.actionDescription}
                    </span>
                                    </div>
                                </div>
                            )}

                            {/* Prédiction de classement */}
                            {alert.rankingPrediction && (
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <h5 className="font-medium text-purple-800 mb-2">
                                        🏆 Évolution du Classement
                                    </h5>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div>
                                            <span className="text-gray-600">Actuel:</span>
                                            <span className="ml-2 font-mono">#{alert.rankingPrediction.currentRanking}</span>
                                        </div>
                                        <span className="text-gray-400">→</span>
                                        <div>
                                            <span className="text-gray-600">Prédit:</span>
                                            <span className="ml-2 font-mono font-bold">#{alert.rankingPrediction.predictedRanking}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs ${
                                            alert.rankingPrediction.trend === 'AMÉLIORATION' ? 'bg-green-100 text-green-800' :
                                                alert.rankingPrediction.trend === 'DÉCLIN' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                      {alert.rankingPrediction.trend}
                    </span>
                                    </div>
                                </div>
                            )}

                            {/* Date de génération */}
                            <div className="mt-3 text-xs text-gray-400 text-right">
                                Analyse générée le {formatGeneratedAt(alert.generatedAt)}
                            </div>
                        </div>
                    )}
                </div>
            ))}

            {/* Note informative */}
            <div className="mt-4 p-3 bg-gray-100 rounded-lg text-xs text-gray-600">
                <strong>ℹ️ Note:</strong> Ces alertes sont générées par notre système d'analyse prédictive
                et constituent des recommandations d'aide à la décision. Les résultats doivent être
                interprétés en fonction du contexte de votre activité.
            </div>
        </div>
    );
};

export default PredictionNotifications;