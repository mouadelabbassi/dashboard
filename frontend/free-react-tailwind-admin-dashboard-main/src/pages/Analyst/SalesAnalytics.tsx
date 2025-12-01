import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { analystService, SalesTrendPoint, CategorySales, TopProduct } from '../../service/analystService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SalesAnalytics: React.FC = () => {
    const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [salesOverview, setSalesOverview] = useState<any>(null);
    const [salesGrowth, setSalesGrowth] = useState<any>(null);
    const [peakTimes, setPeakTimes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<number>(30);
    const [chartType, setChartType] = useState<'line' | 'bar'>('line');

    useEffect(() => {
        fetchData();
    }, [period]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [trends, categories, products, overview, growth, peaks] = await Promise.all([
                analystService.getSalesTrends('daily', period),
                analystService.getSalesByCategory(),
                analystService.getTopSellingProducts(10),
                analystService.getSalesOverview(),
                analystService.getSalesGrowth(),
                analystService.getPeakSalesTimes(),
            ]);
            setSalesTrend(trends);
            setCategorySales(categories);
            setTopProducts(products);
            setSalesOverview(overview);
            setSalesGrowth(growth);
            setPeakTimes(peaks);
        } catch (error) {
            console.error('Error fetching sales data:', error);
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

    // Revenue Trend Chart
    const trendChartData = {
        labels: salesTrend.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Revenue',
                data: salesTrend.map(d => d.revenue),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: chartType === 'line' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.8)',
                fill: chartType === 'line',
                tension: 0.4,
                borderRadius: chartType === 'bar' ? 6 : 0,
            },
        ],
    };

    // Orders Trend Chart
    const ordersChartData = {
        labels: salesTrend.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Orders',
                data: salesTrend.map(d => d.orders),
                borderColor: 'rgb(16, 185, 129)',
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderRadius: 6,
            },
        ],
    };

    // Category Sales Chart
    const categorySalesChart = {
        labels: categorySales.slice(0, 8).map(c => c.categoryName),
        datasets: [
            {
                label: 'Revenue',
                data: categorySales.slice(0, 8).map(c => c.revenue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                    'rgba(20, 184, 166, 0.8)',
                    'rgba(251, 146, 60, 0.8)',
                ],
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📈 Sales Analytics
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Deep dive into your sales performance
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                    >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                    </select>
                    <div className="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600">
                        <button
                            onClick={() => setChartType('line')}
                            className={`px-3 py-2 text-sm ${
                                chartType === 'line'
                                    ?  'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            Line
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`px-3 py-2 text-sm ${
                                chartType === 'bar'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            Bar
                        </button>
                    </div>
                </div>
            </div>

            {/* Overview Cards */}
            {salesOverview && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Revenue</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {formatCurrency(salesOverview.totalRevenue)}
                        </p>
                        {salesGrowth && (
                            <p className={`text-sm mt-2 ${salesGrowth.weekly.growth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {salesGrowth.weekly.growth >= 0 ? '↑' : '↓'} {Math.abs(salesGrowth.weekly.growth).toFixed(1)}% vs last week
                            </p>
                        )}
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {salesOverview.totalOrders}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Items Sold</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {salesOverview.totalItems}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Avg Order Value</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                            {formatCurrency(salesOverview.avgOrderValue)}
                        </p>
                    </div>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Revenue Trend
                    </h3>
                    <div className="h-80">
                        {chartType === 'line' ? (
                            <Line
                                data={trendChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false }, ticks: { color: 'rgb(156, 163, 175)' } },
                                        y: {
                                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                            ticks: {
                                                color: 'rgb(156, 163, 175)',
                                                callback: (value) => formatCurrency(value as number),
                                            },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <Bar
                                data={trendChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        x: { grid: { display: false }, ticks: { color: 'rgb(156, 163, 175)' } },
                                        y: {
                                            grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                            ticks: {
                                                color: 'rgb(156, 163, 175)',
                                                callback: (value) => formatCurrency(value as number),
                                            },
                                        },
                                    },
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Orders Trend */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Orders Trend
                    </h3>
                    <div className="h-80">
                        <Bar
                            data={ordersChartData}
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

            {/* Category Sales */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Revenue by Category
                </h3>
                <div className="h-80">
                    <Bar
                        data={categorySalesChart}
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

            {/* Peak Sales Times */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📅 Peak Sales Days
                </h3>
                <div className="grid grid-cols-7 gap-2">
                    {peakTimes.map((day, index) => {
                        const maxOrders = Math.max(...peakTimes.map(d => d.orders));
                        const intensity = maxOrders > 0 ? (day.orders / maxOrders) : 0;
                        return (
                            <div
                                key={index}
                                className="text-center p-4 rounded-lg"
                                style={{
                                    backgroundColor: `rgba(59, 130, 246, ${0.1 + intensity * 0.7})`,
                                }}
                            >
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    {day.day.substring(0, 3)}
                                </p>
                                <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                                    {day.orders}
                                </p>
                                <p className="text-xs text-gray-500">orders</p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Top Selling Products */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    🏆 Top Selling Products
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                            <th className="pb-4 font-medium">Rank</th>
                            <th className="pb-4 font-medium">Product</th>
                            <th className="pb-4 font-medium">Category</th>
                            <th className="pb-4 font-medium text-right">Price</th>
                            <th className="pb-4 font-medium text-right">Units Sold</th>
                            <th className="pb-4 font-medium text-right">Revenue</th>
                        </tr>
                        </thead>
                        <tbody>
                        {topProducts.map((product, index) => (
                            <tr key={product.asin} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="py-4">
                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                                            index === 0 ?  'bg-yellow-100 text-yellow-700' :
                                                index === 1 ?  'bg-gray-100 text-gray-700' :
                                                    index === 2 ?  'bg-orange-100 text-orange-700' :
                                                        'bg-gray-50 text-gray-600'
                                        }`}>
                                            {index + 1}
                                        </span>
                                </td>
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={product.imageUrl || 'https://via.placeholder.com/40'}
                                            alt={product.productName}
                                            className="w-10 h-10 rounded-lg object-cover"
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                                {product.productName}
                                            </p>
                                            <p className="text-xs text-gray-500">{product.asin}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                                            {product.categoryName}
                                                                                </span>
                                </td>
                                <td className="py-4 text-right font-medium text-gray-900 dark:text-white">
                                    {formatCurrency(product.price)}
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {product.salesCount.toLocaleString()}
                                </td>
                                <td className="py-4 text-right font-bold text-green-600">
                                    {formatCurrency(product.revenue)}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalytics;
                                