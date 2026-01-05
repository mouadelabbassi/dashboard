import { useState, useEffect, useCallback, useRef } from 'react';
import {
    getLatestPredictions,
    triggerBackgroundRefresh,
    getRefreshStatus,
    LatestPredictionsResponse,
    BestsellerPrediction,
    RankingTrendPrediction,
    PriceIntelligence,
    RefreshStatusResponse
} from '../service/predictionService';

export interface CombinedPrediction {
    productId: string;
    productName: string;
    category: string;
    bestseller: BestsellerPrediction | null;
    ranking: RankingTrendPrediction | null;
    price: PriceIntelligence | null;
    lastUpdated: string;
}

export interface UsePredictionsResult {
    predictions: CombinedPrediction[];
    bestsellers: BestsellerPrediction[];
    rankings: RankingTrendPrediction[];
    prices: PriceIntelligence[];
    totalCount: number;
    lastRefreshedAt: string | null;
    isRefreshing: boolean;
    isLoading: boolean;
    error: string | null;
    stats: PredictionStats;
    refresh: () => Promise<void>;
    reloadCache: () => Promise<void>;
}

export interface PredictionStats {
    totalProducts: number;
    potentialBestsellers: number;
    improvingRankings: number;
    priceRecommendations: number;
    avgBestsellerProbability: number;
}

const POLL_INTERVAL = 5000;
const MAX_POLL_DURATION = 300000;

export const usePredictions = (): UsePredictionsResult => {
    const [predictions, setPredictions] = useState<CombinedPrediction[]>([]);
    const [bestsellers, setBestsellers] = useState<BestsellerPrediction[]>([]);
    const [rankings, setRankings] = useState<RankingTrendPrediction[]>([]);
    const [prices, setPrices] = useState<PriceIntelligence[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [lastRefreshedAt, setLastRefreshedAt] = useState<string | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<PredictionStats>({
        totalProducts: 0,
        potentialBestsellers: 0,
        improvingRankings: 0,
        priceRecommendations: 0,
        avgBestsellerProbability: 0
    });

    const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const pollStartTimeRef = useRef<number | null>(null);
    const mountedRef = useRef(true);

    const processCacheResponse = useCallback((cached: LatestPredictionsResponse) => {
        const bs = cached.bestsellerPredictions || [];
        const rk = cached.rankingPredictions || [];
        const pr = cached.priceIntelligence || [];

        setBestsellers(bs);
        setRankings(rk);
        setPrices(pr);
        setTotalCount(cached.totalCount || 0);
        setLastRefreshedAt(cached.lastRefreshedAt);
        setIsRefreshing(cached.isRefreshing || false);

        const predictionMap = new Map<string, CombinedPrediction>();

        bs.forEach(b => {
            predictionMap.set(b.productId, {
                productId: b.productId,
                productName: b.productName || 'Unknown',
                category: 'General',
                bestseller: b,
                ranking: null,
                price: null,
                lastUpdated: b.predictedAt
            });
        });

        rk.forEach(r => {
            const existing = predictionMap.get(r.productId);
            if (existing) {
                existing.ranking = r;
            } else {
                predictionMap.set(r.productId, {
                    productId: r.productId,
                    productName: r.productName || 'Unknown',
                    category: 'General',
                    bestseller: null,
                    ranking: r,
                    price: null,
                    lastUpdated: r.predictedAt
                });
            }
        });

        pr.forEach(p => {
            const existing = predictionMap.get(p.productId);
            if (existing) {
                existing.price = p;
            } else {
                predictionMap.set(p.productId, {
                    productId: p.productId,
                    productName: p.productName || 'Unknown',
                    category: 'General',
                    bestseller: null,
                    ranking: null,
                    price: p,
                    lastUpdated: p.analyzedAt
                });
            }
        });

        const combined = Array.from(predictionMap.values());
        setPredictions(combined);

        setStats({
            totalProducts: combined.length,
            potentialBestsellers: bs.filter(b => b.isPotentialBestseller).length,
            improvingRankings: rk.filter(r =>
                r.predictedTrend === 'IMPROVING' || r.predictedTrend === 'AMÉLIORATION'
            ).length,
            priceRecommendations: pr.filter(p =>
                p.priceAction !== 'MAINTAIN' && p.priceAction !== 'MAINTENIR'
            ).length,
            avgBestsellerProbability: bs.length > 0
                ? (bs.reduce((s, b) => s + (b.bestsellerProbability || 0), 0) / bs.length) * 100
                : 0
        });
    }, []);

    const loadFromCache = useCallback(async () => {
        if (!mountedRef.current) return;

        try {
            const cached = await getLatestPredictions();
            if (mountedRef.current) {
                processCacheResponse(cached);
                setError(null);
            }
        } catch (err) {
            if (mountedRef.current) {
                setError('Failed to load predictions from cache');
            }
        }
    }, [processCacheResponse]);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
        pollStartTimeRef.current = null;
    }, []);

    const pollRefreshStatus = useCallback(async () => {
        if (!mountedRef.current) {
            stopPolling();
            return;
        }

        if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > MAX_POLL_DURATION) {
            stopPolling();
            setIsRefreshing(false);
            await loadFromCache();
            return;
        }

        try {
            const status: RefreshStatusResponse = await getRefreshStatus();

            if (!status.isRefreshing) {
                stopPolling();
                setIsRefreshing(false);
                await loadFromCache();
            }
        } catch (err) {
            stopPolling();
            setIsRefreshing(false);
        }
    }, [loadFromCache, stopPolling]);

    const startPolling = useCallback(() => {
        stopPolling();
        pollStartTimeRef.current = Date.now();
        pollIntervalRef.current = setInterval(pollRefreshStatus, POLL_INTERVAL);
    }, [pollRefreshStatus, stopPolling]);

    const refresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);

        try {
            await triggerBackgroundRefresh();
            startPolling();
        } catch (err) {
            setIsRefreshing(false);
            setError('Failed to trigger refresh');
        }
    }, [isRefreshing, startPolling]);

    const reloadCache = useCallback(async () => {
        setIsLoading(true);
        await loadFromCache();
        setIsLoading(false);
    }, [loadFromCache]);

    useEffect(() => {
        mountedRef.current = true;

        const initialLoad = async () => {
            setIsLoading(true);
            await loadFromCache();
            setIsLoading(false);
        };

        initialLoad();

        return () => {
            mountedRef.current = false;
            stopPolling();
        };
    }, [loadFromCache, stopPolling]);

    return {
        predictions,
        bestsellers,
        rankings,
        prices,
        totalCount,
        lastRefreshedAt,
        isRefreshing,
        isLoading,
        error,
        stats,
        refresh,
        reloadCache
    };
};

export default usePredictions;