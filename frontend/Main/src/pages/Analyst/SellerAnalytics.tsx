import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import zoomPlugin from 'chartjs-plugin-zoom';
import { analystService, SellerRanking } from '../../service/analystService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    zoomPlugin
);

interface GrowthDataPoint {
    date: string;
    newSellers: number;
    cumulativeSellers: number;
}

const SellerAnalytics: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [sellersRanking, setSellersRanking] = useState<SellerRanking[]>([]);
    const [sellerGrowthRaw, setSellerGrowthRaw] = useState<any[]>([]);
    const [platformComparison, setPlatformComparison] = useState<any>(null);
    const [selectedSeller, setSelectedSeller] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [zoomLevel, setZoomLevel] = useState<'months' | 'weeks' | 'days'>('months');
    const growthChartRef = useRef<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewData, ranking, growth, comparison] = await Promise.all([
                analystService.getSellersOverview(),
                analystService.getSellersRanking(10),
                analystService.getSellerGrowth(),
                analystService.getPlatformComparison(),
            ]);
            setOverview(overviewData);
            setSellersRanking(ranking);
            setSellerGrowthRaw(growth);
            setPlatformComparison(comparison);
        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
        }
    };


    const generateDailyGrowthData = useCallback((): GrowthDataPoint[] => {
        const startDate = new Date('2025-09-01');
        const endDate = new Date('2025-12-15');
        const dataPoints: GrowthDataPoint[] = [];

        const monthlyNewSellers:  { [key: string]: number } = {};
        sellerGrowthRaw.forEach(g => {
            const monthNum = new Date(`${g.month} 1, ${g.year}`).getMonth();
            const key = `${g.year}-${String(monthNum + 1).padStart(2, '0')}`;
            monthlyNewSellers[key] = g.newSellers || 0;
        });

        let cumulativeCount = 0;
        const currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
            const dayOfMonth = currentDate.getDate();
            const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

            const monthlyTotal = monthlyNewSellers[monthKey] || 0;

            let newSellersThisDay = 0;
            if (monthlyTotal > 0) {
                const sellersPerDay = monthlyTotal / daysInMonth;
                if (Math.random() < sellersPerDay || (dayOfMonth === daysInMonth && cumulativeCount < monthlyTotal)) {
                    newSellersThisDay = Math.random() < 0.3 ? Math.ceil(sellersPerDay * 3) : 0;
                    if (newSellersThisDay > monthlyTotal) newSellersThisDay = monthlyTotal;
                }
            }

            if (dayOfMonth === 1) {
                newSellersThisDay = monthlyNewSellers[monthKey] || 0;
            } else {
                newSellersThisDay = 0;
            }

            cumulativeCount += newSellersThisDay;

            dataPoints.push({
                date: currentDate.toISOString().split('T')[0],
                newSellers: newSellersThisDay,
                cumulativeSellers: cumulativeCount,
            });

            currentDate.setDate(currentDate.getDate() + 1);
        }

        return dataPoints;
    }, [sellerGrowthRaw]);

    const getAggregatedData = useCallback(() => {
        const dailyData = generateDailyGrowthData();

        if (dailyData.length === 0) {
            return { labels: [], newSellers: [], cumulative: [] };
        }

        if (zoomLevel === 'days') {
            return {
                labels: dailyData.map(d => d.date),
                newSellers: dailyData.map(d => d.newSellers),
                cumulative: dailyData.map(d => d.cumulativeSellers),
            };
        } else if (zoomLevel === 'weeks') {
            const weeklyData:  { [key: string]: { newSellers: number; cumulative: number } } = {};

            dailyData.forEach(d => {
                const date = new Date(d.date);
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                const weekKey = weekStart.toISOString().split('T')[0];

                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = { newSellers: 0, cumulative: 0 };
                }
                weeklyData[weekKey].newSellers += d.newSellers;
                weeklyData[weekKey].cumulative = d.cumulativeSellers;
            });

            const sortedKeys = Object.keys(weeklyData).sort();
            return {
                labels: sortedKeys,
                newSellers: sortedKeys.map(k => weeklyData[k].newSellers),
                cumulative: sortedKeys.map(k => weeklyData[k].cumulative),
            };
        } else {
            const monthlyData:  { [key: string]: { newSellers: number; cumulative:  number } } = {};

            dailyData.forEach(d => {
                const date = new Date(d.date);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;

                if (!monthlyData[monthKey]) {
                    monthlyData[monthKey] = { newSellers: 0, cumulative: 0 };
                }
                monthlyData[monthKey].newSellers += d.newSellers;
                monthlyData[monthKey].cumulative = d.cumulativeSellers;
            });

            const sortedKeys = Object.keys(monthlyData).sort();
            return {
                labels: sortedKeys,
                newSellers: sortedKeys.map(k => monthlyData[k].newSellers),
                cumulative: sortedKeys.map(k => monthlyData[k].cumulative),
            };
        }
    }, [zoomLevel, generateDailyGrowthData]);

    const handleSellerClick = async (sellerId: number) => {
        try {
            const details = await analystService.getSellerDetails(sellerId);
            setSelectedSeller(details);
        } catch (error) {
            console.error('Error fetching seller details:', error);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const handleZoomIn = () => {
        if (zoomLevel === 'months') setZoomLevel('weeks');
        else if (zoomLevel === 'weeks') setZoomLevel('days');
    };

    const handleZoomOut = () => {
        if (zoomLevel === 'days') setZoomLevel('weeks');
        else if (zoomLevel === 'weeks') setZoomLevel('months');
    };

    const handleResetZoom = () => {
        setZoomLevel('months');
    };

    const revenueChartData = {
        labels: sellersRanking.map(s => s.storeName || s.sellerName),
        datasets: [
            {
                label: 'Revenue',
                data: sellersRanking.map(s => s.totalRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 6,
            },
        ],
    };

    const aggregatedData = getAggregatedData();

    const growthChartData = {
        labels:  aggregatedData.labels,
        datasets: [
            {
                type: 'bar' as const,
                label: 'New Sellers',
                data: aggregatedData.newSellers,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6,
                yAxisID: 'y',
                order: 2,
            },
            {
                type: 'line' as const,
                label:  'Total Sellers (Cumulative)',
                data:  aggregatedData.cumulative,
                borderColor: 'rgba(59, 130, 246, 1)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: zoomLevel === 'days' ?  0 : 4,
                pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                pointHoverRadius: 6,
                yAxisID: 'y1',
                order: 1,
            },
        ],
    };

    const formatDateLabel = (dateStr: string): string => {
        const date = new Date(dateStr);
        if (zoomLevel === 'days') {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (zoomLevel === 'weeks') {
            return `W${Math.ceil(date.getDate() / 7)} ${date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;
        }
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    };

    const growthChartOptions:  any = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    color: 'rgb(156, 163, 175)',
                    usePointStyle: true,
                    padding: 20,
                    font: { size: 12 },
                },
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                callbacks: {
                    title: (items:  any) => {
                        if (! items.length) return '';
                        const date = new Date(items[0].label);
                        if (zoomLevel === 'months') {
                            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        } else if (zoomLevel === 'weeks') {
                            const weekEnd = new Date(date);
                            weekEnd.setDate(date.getDate() + 6);
                            return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month:  'short', day: 'numeric', year: 'numeric' })}`;
                        }
                        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
                    },
                },
            },
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x',
                },
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true,
                    },
                    mode:  'x',
                },
            },
        },
        scales: {
            x: {
                type: 'category',
                grid: { display: false },
                ticks: {
                    color: 'rgb(156, 163, 175)',
                    maxRotation: 45,
                    minRotation:  0,
                    autoSkip: true,
                    maxTicksLimit: zoomLevel === 'days' ?  15 : zoomLevel === 'weeks' ?  20 : 14,
                    callback: function(_value: any, index: number) {
                        const label = aggregatedData.labels[index];
                        if (! label) return '';
                        return formatDateLabel(label);
                    },
                },
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: { color: 'rgba(156, 163, 175, 0.1)' },
                ticks: {
                    color: 'rgb(16, 185, 129)',
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: 'New Sellers',
                    color:  'rgb(16, 185, 129)',
                    font: { size: 12, weight: 'bold' },
                },
                min: 0,
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: { drawOnChartArea: false },
                ticks: {
                    color: 'rgb(59, 130, 246)',
                    stepSize: 1,
                },
                title: {
                    display: true,
                    text: 'Total Sellers',
                    color: 'rgb(59, 130, 246)',
                    font: { size: 12, weight: 'bold' },
                },
                min: 0,
            },
        },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    Seller Performance
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Analyze seller performance and marketplace health
                </p>
            </div>

            {overview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {overview.totalSellers}
                        </p>
                        <p className="text-xs text-gray-500">Total Sellers</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {overview.verifiedSellers}
                        </p>
                        <p className="text-xs text-gray-500">Verified</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {overview.activeSellers}
                        </p>
                        <p className="text-xs text-gray-500">Active</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(overview.totalSellerRevenue)}
                        </p>
                        <p className="text-xs text-gray-500">Total Revenue</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(overview.platformCommission)}
                        </p>
                        <p className="text-xs text-gray-500">Commission</p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {overview.sellerProducts}
                        </p>
                        <p className="text-xs text-gray-500">Products</p>
                    </div>
                </div>
            )}

            {platformComparison && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Platform vs Sellers Comparison
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">MouadVision (Platform)</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(platformComparison.platform?.revenue || 0)}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span>{platformComparison.platform?.products || 0} products</span>
                                <span>{platformComparison.platform?.sales || 0} sales</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">All Sellers</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(platformComparison.sellers?.revenue || 0)}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                                <span>{platformComparison.sellers?.products || 0} products</span>
                                <span>{platformComparison.sellers?.sales || 0} sales</span>
                            </div>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Revenue Share</p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">Platform</span>
                                        <span className="font-medium text-gray-900 dark: text-white">
                                            {platformComparison.platformShare?.toFixed(1) || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gray-500 dark:bg-gray-400 rounded-full transition-all"
                                            style={{ width:  `${platformComparison.platformShare || 0}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">Sellers</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            {platformComparison.sellersShare?.toFixed(1) || 0}%
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${platformComparison.sellersShare || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">
                        Top Sellers by Revenue
                    </h3>
                    <div className="h-80">
                        <Bar
                            data={revenueChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                indexAxis: 'y',
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: {
                                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                        ticks: {
                                            color: 'rgb(156, 163, 175)',
                                            callback: (value) => formatCurrency(value as number),
                                        },
                                    },
                                    y: {
                                        grid: { display: false },
                                        ticks: { color: 'rgb(156, 163, 175)' },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark: border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Seller Growth
                            </h3>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleZoomOut}
                                disabled={zoomLevel === 'months'}
                                className={`p-2 rounded-lg transition-colors ${
                                    zoomLevel === 'months'
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title="Zoom Out"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                                </svg>
                            </button>

                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setZoomLevel('months')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                        zoomLevel === 'months'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            :  'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    Months
                                </button>
                                <button
                                    onClick={() => setZoomLevel('weeks')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                        zoomLevel === 'weeks'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark: text-gray-400 hover: text-gray-900 dark: hover:text-white'
                                    }`}
                                >
                                    Weeks
                                </button>
                                <button
                                    onClick={() => setZoomLevel('days')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                        zoomLevel === 'days'
                                            ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                                >
                                    Days
                                </button>
                            </div>

                            <button
                                onClick={handleZoomIn}
                                disabled={zoomLevel === 'days'}
                                className={`p-2 rounded-lg transition-colors ${
                                    zoomLevel === 'days'
                                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                                title="Zoom In"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                                </svg>
                            </button>

                            <button
                                onClick={handleResetZoom}
                                className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                title="Reset Zoom"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-emerald-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">New Sellers (Bar)</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            <span className="text-gray-600 dark:text-gray-400">Cumulative Total (Line)</span>
                        </div>
                    </div>

                    <div className="h-72">
                        <Bar
                            ref={growthChartRef}
                            data={growthChartData as any}
                            options={growthChartOptions}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Sellers Ranking
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th className="pb-4 font-medium w-16">#</th>
                            <th className="pb-4 font-medium">Seller</th>
                            <th className="pb-4 font-medium text-right">Revenue</th>
                            <th className="pb-4 font-medium text-right">Products Sold</th>
                            <th className="pb-4 font-medium text-right">Orders</th>
                            <th className="pb-4 font-medium text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sellersRanking.map((seller) => (
                            <tr
                                key={seller.sellerId}
                                className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <td className="py-4">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium">
                                            {seller.rank}
                                        </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 font-semibold">
                                            {(seller.storeName || seller.sellerName)?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {seller.storeName || 'No Store Name'}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{seller.sellerName}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-bold text-green-600 dark:text-green-400">
                                    {formatCurrency(seller.totalRevenue)}
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {seller.productsSold.toLocaleString()}
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {seller.totalOrders}
                                </td>
                                <td className="py-4 text-right">
                                    <button
                                        onClick={() => handleSellerClick(seller.sellerId)}
                                        className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                                    >
                                        Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedSeller && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark: bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Seller Details
                                </h3>
                                <button
                                    onClick={() => setSelectedSeller(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 text-2xl font-bold">
                                        {selectedSeller.name?.charAt(0).toUpperCase() || 'S'}
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark: text-white">
                                            {selectedSeller.storeName || selectedSeller.name}
                                        </p>
                                        <p className="text-gray-500 dark:text-gray-400">{selectedSeller.email}</p>
                                        {selectedSeller.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs mt-1">
                                                ✓ Verified Seller
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                            {formatCurrency(selectedSeller.totalRevenue || 0)}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Products</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                            {selectedSeller.totalProducts || 0}
                                        </p>
                                    </div>
                                </div>

                                {selectedSeller.topProducts && selectedSeller.topProducts.length > 0 && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            Top Products
                                        </p>
                                        <div className="space-y-2">
                                            {selectedSeller.topProducts.map((product: any, index: number) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-gray-400 font-medium text-sm">{index + 1}</span>
                                                        <span className="text-sm text-gray-900 dark:text-white truncate max-w-[180px]">
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                        {product.sales} sold
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => setSelectedSeller(null)}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerAnalytics;