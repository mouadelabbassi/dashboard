/**
 * Service de Prédiction - API Integration
 * Plateforme MouadVision - Mini Projet JEE 2025
 *
 * Ce service gère toutes les communications avec l'API de prédiction ML
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/predictions';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RankingPrediction {
    predictedRanking: number;
    currentRanking: number;
    rankingChange: number;
    trend: string;
    trendDescription: string;
    confidence: number;
}

export interface BestsellerPrediction {
    bestsellerProbability: number;
    isPotentialBestseller: boolean;
    potentialLevel: string;
    recommendation: string;
    confidence: number;
}

export interface PricePrediction {
    recommendedPrice: number;
    currentPrice: number;
    priceDifference: number;
    priceChangePercentage: number;
    priceAction: string;
    actionDescription: string;
    shouldNotifySeller: boolean;
    confidence: number;
}

export interface ProductPrediction {
    productId: string;
    productName:  string;
    category: string;
    rankingPrediction:  RankingPrediction;
    bestsellerPrediction:  BestsellerPrediction;
    pricePrediction:  PricePrediction;
    generatedAt: string;
}

export interface PredictionStats {
    totalPredictions:  number;
    potentialBestsellers: number;
    avgBestsellerProbability: number;
    avgPriceChange: number;
    improvingProducts: number;
    decliningProducts: number;
    stableProducts: number;
    trendDistribution: Record<string, number>;
    priceActionDistribution: Record<string, number>;
    categoryStats: CategoryStats[];
}

export interface CategoryStats {
    category: string;
    count: number;
    avgBestsellerProb: number;
    avgPriceChange: number;
}

export interface ModelMetrics {
    ranking: {
        r2_score: number;
        rmse: number;
        mae: number;
        feature_importance: Record<string, number>;
    };
    bestseller: {
        accuracy: number;
        precision: number;
        recall: number;
        f1_score: number;
        auc_roc: number;
        feature_importance: Record<string, number>;
    };
    price:  {
        r2_score: number;
        rmse: number;
        mape: number;
        feature_importance: Record<string, number>;
    };
    metadata: {
        trained_at: string;
        version: string;
        real_data_count: number;
    };
}

export interface HealthStatus {
    springBootService: string;
    mlServiceAvailable: boolean;
    mlServiceStatus?:  {
        models_loaded: boolean;
        available_models: string[];
    };
}

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};


export const checkPredictionServiceHealth = async (): Promise<HealthStatus> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`, getAuthHeaders());
        return response.data;
    } catch (error) {
        return { springBootService: 'DOWN', mlServiceAvailable: false };
    }
};

export const getPredictionCount = async (): Promise<{
    predictionCount: number;
    productCount: number;
    needsGeneration: boolean;
    coveragePercent: number;
}> => {
    const response = await axios.get(`${API_BASE_URL}/count`, getAuthHeaders());
    return response.data;
};

export const generatePredictionsSync = async (limit: number = 50): Promise<{
    success: boolean;
    processed: number;
    successCount: number;
    failureCount: number;
    totalProducts: number;
    remainingProducts: number;
    errors?: string[];
}> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/sync?limit=${limit}`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

export const getModelMetrics = async (): Promise<ModelMetrics> => {
    const response = await axios.get(`${API_BASE_URL}/metrics`, getAuthHeaders());
    return response.data;
};

export const getAllPredictions = async (): Promise<ProductPrediction[]> => {
    const response = await axios.get(`${API_BASE_URL}/all`, getAuthHeaders());
    return response.data;
};

export const getPredictionStats = async (): Promise<PredictionStats> => {
    const response = await axios.get(`${API_BASE_URL}/stats`, getAuthHeaders());
    return response.data;
};

export const getPotentialBestsellers = async (): Promise<ProductPrediction[]> => {
    const response = await axios.get(`${API_BASE_URL}/bestsellers`, getAuthHeaders());
    return response.data;
};

export const generatePrediction = async (productId: string): Promise<ProductPrediction> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/${productId}`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

export const generateAllPredictions = async (): Promise<{ message: string; status: string }> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/all`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

export const generatePredictionsForSeller = async (sellerId: number): Promise<ProductPrediction[]> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/seller/${sellerId}`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

export const getProductPrediction = async (productId: string): Promise<ProductPrediction> => {
    const response = await axios.get(
        `${API_BASE_URL}/product/${productId}`,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * 🔔 Get seller prediction alerts - CRITICAL FOR PredictionNotifications.tsx
 * This was the MISSING function causing the import error!
 */
export const getSellerAlerts = async (sellerId: number): Promise<ProductPrediction[]> => {
    const response = await axios.get(
        `${API_BASE_URL}/seller/${sellerId}/alerts`,
        getAuthHeaders()
    );
    return response.data;
};

// Alias for backward compatibility
export const getSellerPredictionAlerts = getSellerAlerts;

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

export const formatProbability = (probability: number): string => {
    return `${(probability * 100).toFixed(1)}%`;
};

export const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('en-US', {
        style:  'currency',
        currency:  'USD'
    }).format(price);
};

export const formatGeneratedAt = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
};

export const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

// ============================================================================
// COLOR & STYLE UTILITIES
// ============================================================================

export const getTrendColor = (trend: string): string => {
    switch (trend) {
        case 'AMÉLIORATION':
            return 'text-green-500';
        case 'DÉCLIN':
            return 'text-red-500';
        default:
            return 'text-gray-500';
    }
};

export const getTrendIcon = (trend: string): string => {
    switch (trend) {
        case 'AMÉLIORATION':
            return '📈';
        case 'DÉCLIN':
            return '📉';
        default:
            return '➡️';
    }
};

export const getPriceActionColor = (action: string): string => {
    switch (action) {
        case 'AUGMENTER':
            return 'text-green-500 bg-green-100 dark:bg-green-900/30';
        case 'DIMINUER':
            return 'text-red-500 bg-red-100 dark:bg-red-900/30';
        default:
            return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
};

export const getBestsellerLevelColor = (level: string): string => {
    switch (level) {
        case 'TRÈS ÉLEVÉ':
            return 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white';
        case 'ÉLEVÉ':
            return 'bg-gradient-to-r from-green-400 to-emerald-500 text-white';
        case 'MODÉRÉ':
            return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
        case 'FAIBLE':
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

/**
 * Alias for getPotentialLevelColor - used by PredictionNotifications
 */
export const getPotentialLevelColor = (level: string): string => {
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

// ============================================================================
// ANALYSIS HELPERS
// ============================================================================

export const calculateAverageConfidence = (prediction: ProductPrediction): number => {
    const confidences = [
        prediction.rankingPrediction?.confidence || 0,
        prediction.bestsellerPrediction?.confidence || 0,
        prediction.pricePrediction?.confidence || 0
    ];
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
};

export const needsAttention = (prediction: ProductPrediction): boolean => {
    return (
        prediction.bestsellerPrediction?.isPotentialBestseller ||
        (prediction.pricePrediction?.priceChangePercentage &&
            Math.abs(prediction.pricePrediction.priceChangePercentage) > 15) ||
        prediction.rankingPrediction?.trend === 'DÉCLIN'
    );
};

export const getPredictionSummary = (prediction: ProductPrediction): string => {
    const parts:  string[] = [];

    if (prediction.bestsellerPrediction?.isPotentialBestseller) {
        parts.push(`Bestseller potentiel (${formatProbability(prediction.bestsellerPrediction.bestsellerProbability)})`);
    }

    if (prediction.pricePrediction?.priceAction !== 'MAINTENIR') {
        const action = prediction.pricePrediction.priceAction === 'AUGMENTER' ?  'augmentation' : 'réduction';
        parts.push(`${action} de prix recommandée (${Math.abs(prediction.pricePrediction.priceChangePercentage).toFixed(1)}%)`);
    }

    if (prediction.rankingPrediction?.trend === 'AMÉLIORATION') {
        parts.push(`Amélioration du classement prévue (+${prediction.rankingPrediction.rankingChange} places)`);
    } else if (prediction.rankingPrediction?.trend === 'DÉCLIN') {
        parts.push(`Déclin du classement prévu (${prediction.rankingPrediction.rankingChange} places)`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Aucune action recommandée';
};

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
    checkPredictionServiceHealth,
    getModelMetrics,
    getAllPredictions,
    getPredictionStats,
    getPotentialBestsellers,
    generatePrediction,
    generateAllPredictions,
    generatePredictionsForSeller,
    getProductPrediction,
    getSellerAlerts,
    getSellerPredictionAlerts,
    formatProbability,
    formatPrice,
    formatGeneratedAt,
    formatPercentage,
    getTrendColor,
    getTrendIcon,
    getPriceActionColor,
    getBestsellerLevelColor,
    getPotentialLevelColor,
    calculateAverageConfidence,
    needsAttention,
    getPredictionSummary
};