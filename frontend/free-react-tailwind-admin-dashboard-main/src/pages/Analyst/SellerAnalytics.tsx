import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { analystService, SellerRanking } from '../../service/analystService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const SellerAnalytics: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [sellersRanking, setSellersRanking] = useState<SellerRanking[]>([]);
    const [sellerGrowth, setSellerGrowth] = useState<any[]>([]);
    const [platformComparison, setPlatformComparison] = useState<any>(null);
    const [selectedSeller, setSelectedSeller] = useState<any>(null);
    const [loading, setLoading] = useState(true);

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
            setSellerGrowth(growth);
            setPlatformComparison(comparison);
        } catch (error) {
            console.error('Error fetching seller data:', error);
        } finally {
            setLoading(false);
        }
    };

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
            maximumFractionDigits:  0,
        }).format(value);
    };

    // Sellers Revenue Chart
    const revenueChartData = {
        labels:  sellersRanking.map(s => s.storeName || s.sellerName),
        datasets: [
            {
                label: 'Revenue',
                data: sellersRanking.map(s => s.totalRevenue),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderRadius: 6,
            },
        ],
    };

    // Seller Growth Chart
    const growthChartData = {
        labels: sellerGrowth.map(g => `${g.month} ${g.year}`),
        datasets: [
            {
                label: 'New Sellers',
                data: sellerGrowth.map(g => g.newSellers),
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6,
            },
        ],
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
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-3xl">🏪</span> Seller Performance
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Analyze seller performance and marketplace health
                </p>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.totalSellers}
                                </p>
                                <p className="text-xs text-gray-500">Total Sellers</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.verifiedSellers}
                                </p>
                                <p className="text-xs text-gray-500">Verified</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.activeSellers}
                                </p>
                                <p className="text-xs text-gray-500">Active</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(overview.totalSellerRevenue)}
                                </p>
                                <p className="text-xs text-gray-500">Total Revenue</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(overview.platformCommission)}
                                </p>
                                <p className="text-xs text-gray-500">Commission</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.sellerProducts}
                                </p>
                                <p className="text-xs text-gray-500">Products</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Platform vs Sellers Comparison - Clean Gray Design */}
            {platformComparison && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark: border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <span className="text-xl">🏢</span> Platform vs Sellers Comparison
                    </h3>
                    <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
                        {/* Platform Card */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-lg">🏪</span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">MouadVision (Platform)</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(platformComparison.platform?.revenue || 0)}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="text-gray-400">📦</span>
                                    {platformComparison.platform?.products || 0} products
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="text-gray-400">🛒</span>
                                    {platformComparison.platform?.sales || 0} sales
                                </span>
                            </div>
                        </div>

                        {/* Sellers Card */}
                        <div className="bg-gray-50 dark: bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark: border-gray-600">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                                    <span className="text-lg">👥</span>
                                </div>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">All Sellers</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(platformComparison.sellers?.revenue || 0)}
                            </p>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                    <span className="text-gray-400">📦</span>
                                    {platformComparison.sellers?.products || 0} products
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="text-gray-400">🛒</span>
                                    {platformComparison.sellers?.sales || 0} sales
                                </span>
                            </div>
                        </div>

                        {/* Revenue Share Card */}
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-5 border border-gray-200 dark:border-gray-600">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Revenue Share</p>
                            <div className="space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600 dark:text-gray-400">Platform</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
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

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sellers by Revenue */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4 flex items-center gap-2">
                        <span>💰</span> Top Sellers by Revenue
                    </h3>
                    <div className="h-80">
                        <Bar
                            data={revenueChartData}
                            options={{
                                responsive:  true,
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

                {/* Seller Growth */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <span>📈</span> Seller Growth (Last 6 Months)
                    </h3>
                    <div className="h-80">
                        <Bar
                            data={growthChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio:  false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    x: { grid: { display: false }, ticks: { color: 'rgb(156, 163, 175)' } },
                                    y: {
                                        grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                        ticks: { color: 'rgb(156, 163, 175)' },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Sellers Ranking Table - Clean Design with Simple Numbers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <span>🏆</span> Sellers Ranking
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-gray-500 dark: text-gray-400 border-b border-gray-200 dark:border-gray-700">
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
                                <td className="py-4 text-right text-gray-600 dark: text-gray-400">
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

            {/* Seller Details Modal - Clean Design */}
            {selectedSeller && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark: bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark: text-white">
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
                                {/* Seller Info */}
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

                                {/* Stats */}
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

                                {/* Top Products */}
                                {selectedSeller.topProducts && selectedSeller.topProducts.length > 0 && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                            🔥 Top Products
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

                                {/* Close Button */}
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