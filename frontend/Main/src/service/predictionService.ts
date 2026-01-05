import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/predictions';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
        }
    };
};

export interface RankingPrediction {
    predictedRanking: number;
    currentRanking: number;
    rankingChange: number;
    trend: string;
    trendDescription: string;
    confidence: number;
}

export interface BestsellerPrediction {
    productId: string;
    productName: string;
    bestsellerProbability: number;
    isPotentialBestseller: boolean;
    confidenceLevel: string;
    potentialLevel: string;
    recommendation: string;
    predictedAt: string;
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

export interface RankingTrendPrediction {
    productId: string;
    productName: string;
    currentRank: number;
    predictedTrend: string;
    confidenceScore: number;
    estimatedChange: number;
    predictedRank: number;
    recommendation: string;
    isExperimental: boolean;
    predictedAt: string;
}

export interface PriceIntelligence {
    productId: string;
    productName: string;
    currentPrice: number;
    recommendedPrice: number;
    priceDifference: number;
    priceChangePercentage: number;
    priceAction: string;
    positioning: string;
    categoryAvgPrice: number;
    categoryMinPrice: number;
    categoryMaxPrice: number;
    analysisMethod: string;
    shouldNotifySeller: boolean;
    analyzedAt: string;
}

export interface ProductPrediction {
    productId: string;
    productName: string;
    category: string;
    rankingPrediction: RankingPrediction;
    bestsellerPrediction: {
        bestsellerProbability: number;
        isPotentialBestseller: boolean;
        potentialLevel: string;
        recommendation: string;
        confidence: number;
    };
    pricePrediction: PricePrediction;
    generatedAt: string;
}

export interface PredictionStats {
    totalPredictions: number;
    potentialBestsellers: number;
    potentialBestsellersCount: number;
    avgBestsellerProbability: number;
    averageBestsellerProbability: number;
    avgPriceChange: number;
    averagePriceChangeRecommended: number;
    productsWithPriceRecommendation: number;
    productsWithRankingImprovement: number;
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
    productCount: number;
    avgBestsellerProb: number;
    avgBestsellerProbability: number;
    avgPriceChange: number;
}

export interface LatestPredictionsResponse {
    bestsellerPredictions: BestsellerPrediction[];
    rankingPredictions: RankingTrendPrediction[];
    priceIntelligence: PriceIntelligence[];
    totalCount: number;
    lastRefreshedAt: string | null;
    isRefreshing: boolean;
    fromCache: boolean;
}

export interface HealthStatus {
    springBootService: string;
    mlServiceAvailable: boolean;
}

export interface ModelMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
}

export interface PredictionCountResponse {
    predictionCount: number;
    productCount: number;
    needsGeneration: boolean;
    coveragePercent: number;
}

export interface GenerateSyncResponse {
    processed: number;
    successCount: number;
    failureCount: number;
    remainingProducts: number;
    totalProducts: number;
}

const normalizeStats = (data: any): PredictionStats => {
    return {
        totalPredictions: data.totalPredictions || 0,
        potentialBestsellers: data.potentialBestsellers || data.potentialBestsellersCount || 0,
        potentialBestsellersCount: data.potentialBestsellersCount || data.potentialBestsellers || 0,
        avgBestsellerProbability: data.avgBestsellerProbability || data.averageBestsellerProbability || 0,
        averageBestsellerProbability: data.averageBestsellerProbability || data.avgBestsellerProbability || 0,
        avgPriceChange: data.avgPriceChange || data.averagePriceChangeRecommended || 0,
        averagePriceChangeRecommended: data.averagePriceChangeRecommended || data.avgPriceChange || 0,
        productsWithPriceRecommendation: data.productsWithPriceRecommendation || 0,
        productsWithRankingImprovement: data.productsWithRankingImprovement || data.improvingProducts || 0,
        improvingProducts: data.improvingProducts || data.productsWithRankingImprovement || 0,
        decliningProducts: data.decliningProducts || 0,
        stableProducts: data.stableProducts || 0,
        trendDistribution: data.trendDistribution || {},
        priceActionDistribution: data.priceActionDistribution || {},
        categoryStats: (data.categoryStats || []).map(normalizeCategoryStats)
    };
};

const normalizeCategoryStats = (cat: any): CategoryStats => {
    return {
        category: cat.category || '',
        count: cat.count || cat.productCount || 0,
        productCount: cat.productCount || cat.count || 0,
        avgBestsellerProb: cat.avgBestsellerProb || cat.avgBestsellerProbability || 0,
        avgBestsellerProbability: cat.avgBestsellerProbability || cat.avgBestsellerProb || 0,
        avgPriceChange: cat.avgPriceChange || 0
    };
};

export const getLatestPredictions = async (): Promise<LatestPredictionsResponse> => {
    console.log('Fetching cached predictions from /latest...');
    const response = await axios.get(`${API_BASE_URL}/latest`, getAuthHeaders());
    console.log('Cache response received:', response.data);
    return response.data;
};

export const triggerBackgroundRefresh = async (): Promise<{ message: string; status: string }> => {
    console.log('Triggering background refresh...');
    const response = await axios.post(`${API_BASE_URL}/refresh-async`, {}, getAuthHeaders());
    return response.data;
};

export const getRefreshStatus = async (): Promise<{ isRefreshing: boolean; status: string }> => {
    const response = await axios.get(`${API_BASE_URL}/refresh-status`, getAuthHeaders());
    return response.data;
};

export const getCachedStats = async (): Promise<PredictionStats> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/stats/cached`, getAuthHeaders());
        return normalizeStats(response.data);
    } catch (error) {
        const cached = await getLatestPredictions();
        const bestsellers = cached.bestsellerPredictions || [];
        const rankings = cached.rankingPredictions || [];
        const prices = cached.priceIntelligence || [];

        return {
            totalPredictions: bestsellers.length,
            potentialBestsellers: bestsellers.filter(b => b.isPotentialBestseller).length,
            potentialBestsellersCount: bestsellers.filter(b => b.isPotentialBestseller).length,
            avgBestsellerProbability: bestsellers.length > 0
                ? bestsellers.reduce((sum, b) => sum + b.bestsellerProbability, 0) / bestsellers.length
                : 0,
            averageBestsellerProbability: bestsellers.length > 0
                ? bestsellers.reduce((sum, b) => sum + b.bestsellerProbability, 0) / bestsellers.length
                : 0,
            avgPriceChange: 0,
            averagePriceChangeRecommended: 0,
            productsWithPriceRecommendation: prices.filter(p => p.priceAction !== 'MAINTAIN' && p.priceAction !== 'MAINTENIR').length,
            productsWithRankingImprovement: rankings.filter(r => r.predictedTrend === 'IMPROVING' || r.predictedTrend === 'AMÉLIORATION').length,
            improvingProducts: rankings.filter(r => r.predictedTrend === 'IMPROVING' || r.predictedTrend === 'AMÉLIORATION').length,
            decliningProducts: rankings.filter(r => r.predictedTrend === 'DECLINING' || r.predictedTrend === 'DÉCLIN').length,
            stableProducts: rankings.filter(r => r.predictedTrend === 'STABLE').length,
            trendDistribution: {},
            priceActionDistribution: {},
            categoryStats: []
        };
    }
};

export const checkPredictionServiceHealth = async (): Promise<HealthStatus> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`, getAuthHeaders());
        return response.data;
    } catch (error) {
        return { springBootService: 'DOWN', mlServiceAvailable: false };
    }
};

export const getModelMetrics = async (): Promise<ModelMetrics> => {
    const response = await axios.get(`${API_BASE_URL}/metrics`, getAuthHeaders());
    return response.data;
};

export const getAllPredictions = async (): Promise<ProductPrediction[]> => {
    console.warn('getAllPredictions() is slow - consider using getLatestPredictions() instead');
    const response = await axios.get(`${API_BASE_URL}/all`, getAuthHeaders());
    return response.data;
};

export const getPredictionStats = async (): Promise<PredictionStats> => {
    console.warn('getPredictionStats() is slow - consider using getCachedStats() instead');
    const response = await axios.get(`${API_BASE_URL}/stats`, getAuthHeaders());
    return normalizeStats(response.data);
};

export const getPotentialBestsellers = async (): Promise<ProductPrediction[]> => {
    console.warn('getPotentialBestsellers() is slow - consider using getLatestPredictions() instead');
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

export const getSellerAlerts = async (sellerId: number): Promise<ProductPrediction[]> => {
    const response = await axios.get(
        `${API_BASE_URL}/seller/${sellerId}/alerts`,
        getAuthHeaders()
    );
    return response.data;
};

export const getSellerPredictionAlerts = getSellerAlerts;

export const getPredictionCount = async (): Promise<PredictionCountResponse> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/count`, getAuthHeaders());
        return response.data;
    } catch (error) {
        try {
            const cached = await getLatestPredictions();
            const predictionCount = cached.totalCount || 0;
            const productCount = cached.totalCount || 0;
            const coveragePercent = productCount > 0 ? (predictionCount / productCount) * 100 : 0;

            return {
                predictionCount,
                productCount,
                needsGeneration: predictionCount === 0 && productCount > 0,
                coveragePercent
            };
        } catch {
            return {
                predictionCount: 0,
                productCount: 0,
                needsGeneration: false,
                coveragePercent: 0
            };
        }
    }
};

export const generatePredictionsSync = async (batchSize: number = 50): Promise<GenerateSyncResponse> => {
    try {
        const response = await axios.post(
            `${API_BASE_URL}/generate/batch-sync`,
            { batchSize },
            getAuthHeaders()
        );
        return response.data;
    } catch (error) {
        try {
            await triggerBackgroundRefresh();
            return {
                processed: 0,
                successCount: 0,
                failureCount: 0,
                remainingProducts: 0,
                totalProducts: 0
            };
        } catch {
            return {
                processed: 0,
                successCount: 0,
                failureCount: 0,
                remainingProducts: 0,
                totalProducts: 0
            };
        }
    }
};

export const formatProbability = (probability: number): string => {
    if (probability === undefined || probability === null) return '0.0%';
    const value = probability > 1 ? probability : probability * 100;
    return `${value.toFixed(1)}%`;
};

export const formatPrice = (price: number | null | undefined): string => {
    if (price === null || price === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(price);
};

export const formatGeneratedAt = (dateTime: string | null | undefined): string => {
    if (!dateTime) return 'Jamais';
    try {
        const date = new Date(dateTime);
        if (isNaN(date.getTime())) return 'Date invalide';

        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        if (diffDays < 7) return `Il y a ${diffDays}j`;

        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Date invalide';
    }
};

export const formatPercentage = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return '0%';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
};

export const getTrendColor = (trend: string): string => {
    switch (trend) {
        case 'AMÉLIORATION':
        case 'IMPROVING':
            return 'text-green-600';
        case 'DÉCLIN':
        case 'DECLINING':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

export const getTrendIcon = (trend: string): string => {
    switch (trend) {
        case 'AMÉLIORATION':
        case 'IMPROVING':
            return '↑';
        case 'DÉCLIN':
        case 'DECLINING':
            return '↓';
        default:
            return '→';
    }
};

export const getPriceActionColor = (action: string): string => {
    switch (action) {
        case 'AUGMENTER':
        case 'INCREASE':
            return 'text-green-600';
        case 'DIMINUER':
        case 'DECREASE':
            return 'text-red-600';
        default:
            return 'text-gray-600';
    }
};

export const getBestsellerLevelColor = (level: string): string => {
    switch (level) {
        case 'TRÈS ÉLEVÉ':
        case 'VERY_HIGH':
            return 'text-yellow-500';
        case 'ÉLEVÉ':
        case 'HIGH':
            return 'text-green-500';
        case 'MODÉRÉ':
        case 'MODERATE':
            return 'text-blue-500';
        default:
            return 'text-gray-500';
    }
};

export const getPotentialLevelColor = (level: string): string => {
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

export const calculateAverageConfidence = (predictions: ProductPrediction[]): number => {
    if (!predictions || predictions.length === 0) return 0;
    const total = predictions.reduce((sum, p) => {
        const confidence = p.bestsellerPrediction?.confidence || 0;
        return sum + confidence;
    }, 0);
    return total / predictions.length;
};

export const needsAttention = (prediction: ProductPrediction): boolean => {
    const hasPriceRecommendation = prediction.pricePrediction?.priceAction !== 'MAINTAIN' &&
        prediction.pricePrediction?.priceAction !== 'MAINTENIR';
    const isDeclining = prediction.rankingPrediction?.trend === 'DECLINING' ||
        prediction.rankingPrediction?.trend === 'DÉCLIN';
    return hasPriceRecommendation || isDeclining;
};

export const getPredictionSummary = (prediction: ProductPrediction): string => {
    const parts: string[] = [];

    if (prediction.bestsellerPrediction?.isPotentialBestseller) {
        parts.push(`Bestseller potentiel (${formatProbability(prediction.bestsellerPrediction.bestsellerProbability)})`);
    }

    if (prediction.pricePrediction?.priceAction && prediction.pricePrediction.priceAction !== 'MAINTAIN' && prediction.pricePrediction.priceAction !== 'MAINTENIR') {
        const action = prediction.pricePrediction.priceChangePercentage > 0 ? 'augmentation' : 'réduction';
        parts.push(`${action} de prix recommandée (${Math.abs(prediction.pricePrediction.priceChangePercentage).toFixed(1)}%)`);
    }

    if (prediction.rankingPrediction?.trend === 'AMÉLIORATION' || prediction.rankingPrediction?.trend === 'IMPROVING') {
        parts.push(`Amélioration du classement prévue (+${Math.abs(prediction.rankingPrediction.rankingChange || 0)} places)`);
    } else if (prediction.rankingPrediction?.trend === 'DÉCLIN' || prediction.rankingPrediction?.trend === 'DECLINING') {
        parts.push(`Déclin du classement prévu (${prediction.rankingPrediction.rankingChange || 0} places)`);
    }

    return parts.length > 0 ? parts.join(' • ') : 'Aucune action recommandée';
};

export default {
    getLatestPredictions,
    triggerBackgroundRefresh,
    getRefreshStatus,
    getCachedStats,
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
    getPredictionCount,
    generatePredictionsSync,
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

export class RefreshStatusResponse {
    isRefreshing: boolean | undefined;
}