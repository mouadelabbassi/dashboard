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
            maximumFractionDigits: 0,
        }).format(value);
    };

    // Sellers Revenue Chart
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

    // Platform vs Sellers Chart
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    🏪 Seller Performance
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
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-xl">🏪</span>
                            </div>
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
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="text-xl">✅</span>
                            </div>
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
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="text-xl">🟢</span>
                            </div>
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
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <span className="text-xl">💰</span>
                            </div>
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
                            <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                                <span className="text-xl">🎫</span>
                            </div>
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
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <span className="text-xl">📦</span>
                            </div>
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

            {/* Platform vs Sellers Comparison */}
            {platformComparison && (
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                    <h3 className="text-lg font-semibold mb-4">🏢 Platform vs Sellers Comparison</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/10 rounded-xl p-4">
                            <p className="text-purple-200 text-sm">MouadVision (Platform)</p>
                            <p className="text-3xl font-bold mt-1">{formatCurrency(platformComparison.platform?.revenue || 0)}</p>
                            <p className="text-sm mt-2">{platformComparison.platform?.products || 0} products • {platformComparison.platform?.sales || 0} sales</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <p className="text-blue-200 text-sm">All Sellers</p>
                            <p className="text-3xl font-bold mt-1">{formatCurrency(platformComparison.sellers?.revenue || 0)}</p>
                            <p className="text-sm mt-2">{platformComparison.sellers?.products || 0} products • {platformComparison.sellers?.sales || 0} sales</p>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4">
                            <p className="text-gray-200 text-sm">Revenue Share</p>
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                                    <span>Platform: {platformComparison.platformShare?.toFixed(1) || 0}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                                    <span>Sellers: {platformComparison.sellersShare?.toFixed(1) || 0}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Sellers by Revenue */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        💰 Top Sellers by Revenue
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

                {/* Seller Growth */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        📈 Seller Growth (Last 6 Months)
                    </h3>
                    <div className="h-80">
                        <Bar
                            data={growthChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
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

            {/* Sellers Ranking Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🏆 Sellers Ranking
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                            <th className="pb-4 font-medium">Rank</th>
                            <th className="pb-4 font-medium">Seller</th>
                            <th className="pb-4 font-medium text-right">Revenue</th>
                            <th className="pb-4 font-medium text-right">Products Sold</th>
                            <th className="pb-4 font-medium text-right">Orders</th>
                            <th className="pb-4 font-medium text-right">Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {sellersRanking.map((seller) => (
                            <tr key={seller.sellerId} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="py-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                            seller.rank === 1 ?  'bg-yellow-100 text-yellow-700' :
                                                seller.rank === 2 ? 'bg-gray-100 text-gray-700' :
                                                    seller.rank === 3 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'
                                        }`}>
                                            {seller.rank}
                                        </span>
                                </td>
                                <td className="py-4">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {seller.storeName || 'No Store Name'}
                                        </p>
                                        <p className="text-sm text-gray-500">{seller.sellerName}</p>
                                    </div>
                                </td>
                                <td className="py-4 text-right font-bold text-green-600">
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
                                        className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
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

            {/* Seller Details Modal */}
            {selectedSeller && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    Seller Details
                                </h3>
                                <button
                                    onClick={() => setSelectedSeller(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                                        {selectedSeller.name?.charAt(0) || 'S'}
                                    </div>
                                    <div>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            {selectedSeller.storeName || selectedSeller.name}
                                        </p>
                                        <p className="text-gray-500">{selectedSeller.email}</p>
                                        {selectedSeller.isVerified && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs mt-1">
                                                ✓ Verified
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500">Total Revenue</p>
                                        <p className="text-xl font-bold text-green-600">{formatCurrency(selectedSeller.totalRevenue)}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                        <p className="text-sm text-gray-500">Products</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedSeller.totalProducts}</p>
                                    </div>
                                </div>

                                {selectedSeller.topProducts && selectedSeller.topProducts.length > 0 && (
                                    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Products</p>
                                        <div className="space-y-2">
                                            {selectedSeller.topProducts.map((product: any, index: number) => (
                                                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                                                    <span className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">
                                                        {product.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-green-600">
                                                        {product.sales} sold
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerAnalytics;