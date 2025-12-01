import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut, Scatter } from 'react-chartjs-2';
import { analystService, ProductPerformance } from '../../service/analystService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ProductAnalytics: React.FC = () => {
    const [overview, setOverview] = useState<any>(null);
    const [productPerformance, setProductPerformance] = useState<ProductPerformance[]>([]);
    const [priceDistribution, setPriceDistribution] = useState<Record<string, number>>({});
    const [ratingDistribution, setRatingDistribution] = useState<Record<string, number>>({});
    const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
    const [bestsellerTrends, setBestsellerTrends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [overviewData, performance, priceDist, ratingDist, lowStock, bestsellers] = await Promise.all([
                analystService.getProductsOverview(),
                analystService.getProductPerformance(50),
                analystService.getPriceDistribution(),
                analystService.getRatingDistribution(),
                analystService.getLowStockProducts(10),
                analystService.getBestsellerTrends(),
            ]);
            setOverview(overviewData);
            setProductPerformance(performance);
            setPriceDistribution(priceDist);
            setRatingDistribution(ratingDist);
            setLowStockProducts(lowStock);
            setBestsellerTrends(bestsellers);
        } catch (error) {
            console.error('Error fetching product data:', error);
        } finally {
            setLoading(false);
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

    // Price Distribution Chart
    const priceChartData = {
        labels: Object.keys(priceDistribution),
        datasets: [
            {
                label: 'Products',
                data: Object.values(priceDistribution),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
                borderRadius: 6,
            },
        ],
    };

    // Rating Distribution Chart
    const ratingChartData = {
        labels: Object.keys(ratingDistribution),
        datasets: [
            {
                data: Object.values(ratingDistribution),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    };

    // Performance Scatter Chart (Price vs Rating)
    const scatterChartData = {
        datasets: [
            {
                label: 'Products',
                data: productPerformance.map(p => ({
                    x: p.price,
                    y: p.rating,
                    r: Math.min(Math.max(p.sales / 10, 5), 20),
                })),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    📦 Product Analytics
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Comprehensive analysis of your product catalog
                </p>
            </div>

            {/* Overview Cards */}
            {overview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <span className="text-xl">📦</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.totalProducts}
                                </p>
                                <p className="text-xs text-gray-500">Total Products</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <span className="text-xl">💰</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(overview.avgPrice)}
                                </p>
                                <p className="text-xs text-gray-500">Avg Price</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <span className="text-xl">⭐</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.avgRating}
                                </p>
                                <p className="text-xs text-gray-500">Avg Rating</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <span className="text-xl">💬</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {overview.totalReviews.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-500">Total Reviews</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                                <span className="text-xl">🏭</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatCurrency(overview.inventoryValue)}
                                </p>
                                <p className="text-xs text-gray-500">Inventory Value</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="text-xl">⚠️</span>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-red-600">
                                    {overview.lowStockCount}
                                </p>
                                <p className="text-xs text-gray-500">Low Stock</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Price Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        💵 Price Distribution
                    </h3>
                    <div className="h-72">
                        <Bar
                            data={priceChartData}
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

                {/* Rating Distribution */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        ⭐ Rating Distribution
                    </h3>
                    <div className="h-72">
                        <Doughnut
                            data={ratingChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: 'rgb(156, 163, 175)', padding: 15 },
                                    },
                                },
                                cutout: '50%',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Product Performance Matrix */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        📊 Product Performance Matrix
                    </h3>
                    <p className="text-sm text-gray-500">Price vs Rating (bubble size = sales volume)</p>
                </div>
                <div className="h-96">
                    <Scatter
                        data={scatterChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                tooltip: {
                                    callbacks: {
                                        label: (context) => {
                                            const product = productPerformance[context.dataIndex];
                                            return [
                                                `Product: ${product.name}`,
                                                `Price: ${formatCurrency(product.price)}`,
                                                `Rating: ${product.rating}`,
                                                `Sales: ${product.sales}`,
                                            ];
                                        },
                                    },
                                },
                            },
                            scales: {
                                x: {
                                    title: { display: true, text: 'Price ($)', color: 'rgb(156, 163, 175)' },
                                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                    ticks: { color: 'rgb(156, 163, 175)' },
                                },
                                y: {
                                    title: { display: true, text: 'Rating', color: 'rgb(156, 163, 175)' },
                                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                    ticks: { color: 'rgb(156, 163, 175)' },
                                    min: 0,
                                    max: 5,
                                },
                            },
                        }}
                    />
                </div>
            </div>

            {/* Low Stock Alert & Bestsellers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Products */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            ⚠️ Low Stock Alert
                        </h3>
                        <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                            {lowStockProducts.length} items
                        </span>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {lowStockProducts.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No low stock items 🎉</p>
                        ) : (
                            lowStockProducts.map((product) => (
                                <div
                                    key={product.asin}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <img
                                        src={product.imageUrl || 'https://via.placeholder.com/40'}
                                        alt={product.productName}
                                        className="w-10 h-10 rounded-lg object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {product.productName}
                                        </p>
                                        <p className="text-xs text-gray-500">{product.asin}</p>
                                    </div>
                                    <div className="text-right">
                                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                                            product.stockQuantity === 0
                                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        }`}>
                                            {product.stockQuantity === 0 ? 'OUT OF STOCK' : `${product.stockQuantity} left`}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Bestseller Trends */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        🏆 Bestseller Rankings
                    </h3>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {bestsellerTrends.length === 0 ?  (
                            <p className="text-gray-500 text-center py-8">No bestsellers data</p>
                        ) : (
                            bestsellerTrends.map((product, index) => (
                                <div
                                    key={product.asin}
                                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                            index === 1 ? 'bg-gray-300 text-gray-700' :
                                                index === 2 ? 'bg-orange-400 text-orange-900' :
                                                    'bg-gray-100 text-gray-600'
                                    }`}>
                                        {index + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                            {product.productName}
                                        </p>
                                        <p className="text-xs text-gray-500">{product.category}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-green-600">{product.salesCount} sold</p>
                                        <p className="text-xs text-gray-500">⭐ {product.rating}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductAnalytics;