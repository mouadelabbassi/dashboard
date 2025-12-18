import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/predictions';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization':  `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

// ==================== INTERFACES ====================

export interface RankingPrediction {
    predictedRanking: number;
    currentRanking: number;
    rankingChange: number;
    trend: 'AMÉLIORATION' | 'DÉCLIN' | 'STABLE';
    trendDescription?: string;
    confidence: number;
}

export interface BestsellerPrediction {
    bestsellerProbability: number;
    isPotentialBestseller: boolean;
    potentialLevel: 'TRÈS ÉLEVÉ' | 'ÉLEVÉ' | 'MODÉRÉ' | 'FAIBLE' | 'TRÈS FAIBLE';
    recommendation?: string;
    confidence: number;
}

export interface PricePrediction {
    recommendedPrice: number;
    currentPrice: number;
    priceDifference:  number;
    priceChangePercentage: number;
    priceAction: 'MAINTENIR' | 'AUGMENTER' | 'DIMINUER';
    actionDescription?: string;
    shouldNotifySeller?: boolean;
    confidence: number;
}

export interface ProductPrediction {
    productId: string;
    productName: string;
    category: string;
    rankingPrediction: RankingPrediction;
    bestsellerPrediction: BestsellerPrediction;
    pricePrediction: PricePrediction;
    generatedAt: string;
}

export interface CategoryStats {
    category: string;
    productCount: number;
    avgBestsellerProbability: number;
    avgPriceChange: number;
}

export interface PredictionStats {
    totalPredictions:  number;
    potentialBestsellersCount: number;
    productsWithPriceRecommendation: number;
    productsWithRankingImprovement: number;
    averageBestsellerProbability:  number;
    averagePriceChangeRecommended: number;
    trendDistribution: Record<string, number>;
    priceActionDistribution: Record<string, number>;
    categoryStats:  CategoryStats[];
}

export interface ModelMetrics {
    ranking:  { mse: number; rmse: number; r2_score:  number; mae?: number };
    bestseller: { accuracy: number; precision: number; recall: number; f1_score: number; auc_roc?: number };
    price: { mse: number; rmse: number; r2_score: number; mape:  number; mae?: number };
    metadata?: { trained_at: string; feature_names: string[]; categories: string[] };
}

export interface HealthStatus {
    springBootService: string;
    mlServiceAvailable: boolean;
    mlServiceStatus?: {
        models_loaded: boolean;
        available_models: string[];
        version?: string;
    };
}

// ==================== API CALLS ====================

/**
 * Vérifie le statut du service de prédiction
 */
export const checkPredictionServiceHealth = async (): Promise<HealthStatus> => {
    try {
        const response = await axios.get(`${API_BASE_URL}/health`, getAuthHeaders());
        return response.data;
    } catch (error) {
        return { springBootService: 'DOWN', mlServiceAvailable:  false };
    }
};

/**
 * Récupère les métriques des modèles ML
 */
export const getModelMetrics = async (): Promise<ModelMetrics> => {
    const response = await axios.get(`${API_BASE_URL}/metrics`, getAuthHeaders());
    return response.data;
};

/**
 * Génère une prédiction pour un produit spécifique
 */
export const generatePrediction = async (productId: string): Promise<ProductPrediction> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/${productId}`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Génère des prédictions pour tous les produits d'un vendeur
 */
export const generatePredictionsForSeller = async (sellerId: number): Promise<ProductPrediction[]> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/seller/${sellerId}`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Déclenche la génération globale des prédictions (Admin)
 */
export const generateAllPredictions = async (): Promise<{ message: string; status: string }> => {
    const response = await axios.post(
        `${API_BASE_URL}/generate/all`,
        {},
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Récupère la dernière prédiction pour un produit
 */
export const getProductPrediction = async (productId: string): Promise<ProductPrediction> => {
    const response = await axios.get(
        `${API_BASE_URL}/product/${productId}`,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Récupère toutes les dernières prédictions
 */
export const getAllPredictions = async (): Promise<ProductPrediction[]> => {
    const response = await axios.get(`${API_BASE_URL}/all`, getAuthHeaders());
    return response.data;
};

/**
 * Récupère les bestsellers potentiels
 */
export const getPotentialBestsellers = async (): Promise<ProductPrediction[]> => {
    const response = await axios.get(`${API_BASE_URL}/bestsellers`, getAuthHeaders());
    return response.data;
};

/**
 * Récupère les prédictions par catégorie
 */
export const getPredictionsByCategory = async (category: string): Promise<ProductPrediction[]> => {
    const response = await axios.get(
        `${API_BASE_URL}/category/${encodeURIComponent(category)}`,
        getAuthHeaders()
    );
    return response.data;
};

/**
 * Récupère les statistiques globales des prédictions
 */
export const getPredictionStats = async (): Promise<PredictionStats> => {
    const response = await axios.get(`${API_BASE_URL}/stats`, getAuthHeaders());
    return response.data;
};

/**
 * Récupère les alertes de prédiction pour un vendeur
 */
export const getSellerPredictionAlerts = async (sellerId:  number): Promise<ProductPrediction[]> => {
    const response = await axios.get(
        `${API_BASE_URL}/seller/${sellerId}/alerts`,
        getAuthHeaders()
    );
    return response.data;
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Formate la probabilité en pourcentage
 */
export const formatProbability = (probability: number): string => {
    if (probability === null || probability === undefined) return '0.0%';
    return `${(probability * 100).toFixed(1)}%`;
};

/**
 * Formate le prix en euros
 */
export const formatPrice = (price: number): string => {
    if (price === null || price === undefined) return '0,00 €';
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: 'EUR'
    }).format(price);
};

/**
 * Retourne la couleur associée à une tendance
 */
export const getTrendColor = (trend: string): string => {
    switch (trend) {
        case 'AMÉLIORATION':
            return 'text-green-500';
        case 'DÉCLIN':
            return 'text-red-500';
        case 'STABLE':
            return 'text-yellow-500';
        default:
            return 'text-gray-500';
    }
};

/**
 * Retourne la couleur de fond associée à un niveau de potentiel
 */
export const getPotentialLevelColor = (level: string): string => {
    switch (level) {
        case 'TRÈS ÉLEVÉ':
            return 'bg-green-500';
        case 'ÉLEVÉ':
            return 'bg-green-400';
        case 'MODÉRÉ':
            return 'bg-yellow-500';
        case 'FAIBLE':
            return 'bg-orange-500';
        case 'TRÈS FAIBLE':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};

/**
 * Retourne la couleur de texte associée à un niveau de potentiel
 */
export const getPotentialLevelTextColor = (level: string): string => {
    switch (level) {
        case 'TRÈS ÉLEVÉ':
            return 'text-green-600 dark:text-green-400';
        case 'ÉLEVÉ':
            return 'text-green-500 dark:text-green-400';
        case 'MODÉRÉ':
            return 'text-yellow-600 dark: text-yellow-400';
        case 'FAIBLE':
            return 'text-orange-600 dark:text-orange-400';
        case 'TRÈS FAIBLE':
            return 'text-red-600 dark:text-red-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
};

/**
 * Retourne l'icône associée à une action de prix
 */
export const getPriceActionIcon = (action:  string): string => {
    switch (action) {
        case 'AUGMENTER':
            return '↑';
        case 'DIMINUER':
            return '↓';
        case 'MAINTENIR':
            return '→';
        default:
            return '•';
    }
};

/**
 * Retourne la couleur associée à une action de prix
 */
export const getPriceActionColor = (action:  string): string => {
    switch (action) {
        case 'AUGMENTER':
            return 'text-green-500';
        case 'DIMINUER':
            return 'text-red-500';
        case 'MAINTENIR':
            return 'text-gray-500';
        default:
            return 'text-gray-500';
    }
};

/**
 * Formate la date de génération
 */
export const formatGeneratedAt = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } catch {
        return 'N/A';
    }
};

/**
 * Calcule le pourcentage de confiance moyen
 */
export const calculateAverageConfidence = (prediction: ProductPrediction): number => {
    const confidences = [
        prediction.rankingPrediction?.confidence || 0,
        prediction.bestsellerPrediction?.confidence || 0,
        prediction.pricePrediction?.confidence || 0
    ];
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
};

/**
 * Détermine si une prédiction nécessite une attention particulière
 */
export const needsAttention = (prediction: ProductPrediction): boolean => {
    return (
        prediction.bestsellerPrediction?.isPotentialBestseller ||
        (prediction.pricePrediction?.priceChangePercentage &&
            Math.abs(prediction.pricePrediction.priceChangePercentage) > 15) ||
        prediction.rankingPrediction?.trend === 'DÉCLIN'
    );
};

/**
 * Retourne un résumé textuel de la prédiction
 */
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

/**
 * Filtre les prédictions par niveau de priorité
 */
export const filterByPriority = (
    predictions: ProductPrediction[],
    priority: 'high' | 'medium' | 'low' | 'all'
): ProductPrediction[] => {
    if (priority === 'all') return predictions;

    return predictions.filter(pred => {
        const bestsellerProb = pred.bestsellerPrediction?.bestsellerProbability || 0;
        const priceChange = Math.abs(pred.pricePrediction?.priceChangePercentage || 0);
        const isImproving = pred.rankingPrediction?.trend === 'AMÉLIORATION';
        const isDeclining = pred.rankingPrediction?.trend === 'DÉCLIN';

        switch (priority) {
            case 'high':
                return bestsellerProb >= 0.7 || priceChange > 20 || isDeclining;
            case 'medium':
                return (bestsellerProb >= 0.5 && bestsellerProb < 0.7) ||
                    (priceChange > 10 && priceChange <= 20) ||
                    isImproving;
            case 'low':
                return bestsellerProb < 0.5 && priceChange <= 10 && !isDeclining && !isImproving;
            default:
                return true;
        }
    });
};

/**
 * Trie les prédictions par un critère donné
 */
export const sortPredictions = (
    predictions: ProductPrediction[],
    sortBy: 'bestseller' | 'price' | 'ranking' | 'date',
    order: 'asc' | 'desc' = 'desc'
): ProductPrediction[] => {
    const sorted = [...predictions].sort((a, b) => {
        let valueA:  number, valueB: number;

        switch (sortBy) {
            case 'bestseller':
                valueA = a.bestsellerPrediction?.bestsellerProbability || 0;
                valueB = b.bestsellerPrediction?.bestsellerProbability || 0;
                break;
            case 'price':
                valueA = Math.abs(a.pricePrediction?.priceChangePercentage || 0);
                valueB = Math.abs(b.pricePrediction?.priceChangePercentage || 0);
                break;
            case 'ranking':
                valueA = a.rankingPrediction?.rankingChange || 0;
                valueB = b.rankingPrediction?.rankingChange || 0;
                break;
            case 'date':
                valueA = new Date(a.generatedAt).getTime();
                valueB = new Date(b.generatedAt).getTime();
                break;
            default:
                return 0;
        }

        return order === 'desc' ? valueB - valueA :  valueA - valueB;
    });

    return sorted;
};

/**
 * Exporte les prédictions en CSV
 */
export const exportPredictionsToCSV = (predictions: ProductPrediction[]): string => {
    const headers = [
        'Product ID',
        'Product Name',
        'Category',
        'Current Ranking',
        'Predicted Ranking',
        'Ranking Change',
        'Trend',
        'Bestseller Probability',
        'Is Potential Bestseller',
        'Potential Level',
        'Current Price',
        'Recommended Price',
        'Price Change %',
        'Price Action',
        'Generated At'
    ];

    const rows = predictions.map(pred => [
        pred.productId,
        `"${pred.productName?.replace(/"/g, '""') || ''}"`,
        pred.category || '',
        pred.rankingPrediction?.currentRanking || '',
        pred.rankingPrediction?.predictedRanking || '',
        pred.rankingPrediction?.rankingChange || '',
        pred.rankingPrediction?.trend || '',
        pred.bestsellerPrediction?.bestsellerProbability?.toFixed(4) || '',
        pred.bestsellerPrediction?.isPotentialBestseller ?  'Yes' : 'No',
        pred.bestsellerPrediction?.potentialLevel || '',
        pred.pricePrediction?.currentPrice?.toFixed(2) || '',
        pred.pricePrediction?.recommendedPrice?.toFixed(2) || '',
        pred.pricePrediction?.priceChangePercentage?.toFixed(2) || '',
        pred.pricePrediction?.priceAction || '',
        pred.generatedAt || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

/**
 * Télécharge les prédictions en fichier CSV
 */
export const downloadPredictionsCSV = (predictions: ProductPrediction[], filename?:  string): void => {
    const csv = exportPredictionsToCSV(predictions);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename || `predictions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};