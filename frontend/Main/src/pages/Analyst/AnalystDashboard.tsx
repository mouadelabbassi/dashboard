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
    Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { analystService, SalesTrendPoint, CategorySales } from '../../service/analystService';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface KPIData {
    totalRevenue: { value: number; growth: number; trend: string };
    totalOrders: { value: number; growth: number; trend: string };
    totalProducts: { value: number; growth: number; trend: string };
    totalSellers: { value: number; growth: number; trend: string };
    avgOrderValue: { value: number; growth: number; trend: string };
    totalBuyers: { value: number; growth: number; trend: string };
}

const AnalystDashboard: React.FC = () => {
    const [kpis, setKPIs] = useState<KPIData | null>(null);
    const [salesTrend, setSalesTrend] = useState<SalesTrendPoint[]>([]);
    const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [kpiData, trends, categories] = await Promise.all([
                analystService.getKPIs(),
                analystService.getSalesTrends('daily', 30),
                analystService.getSalesByCategory(),
            ]);
            setKPIs(kpiData);
            setSalesTrend(trends);
            setCategorySales(categories.slice(0, 6));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
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

    const formatNumber = (value: number) => {
        if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
        if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
        return value.toString();
    };

    // Sales Trend Chart
    const salesTrendChart = {
        labels: salesTrend.map(d => {
            const date = new Date(d.date);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }),
        datasets: [
            {
                label: 'Revenue',
                data: salesTrend.map(d => d.revenue),
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const categoryChart = {
        labels: categorySales.map(c => c.categoryName),
        datasets: [
            {
                data: categorySales.map(c => c.revenue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    'rgba(236, 72, 153, 0.8)',
                ],
                borderWidth: 0,
            },
        ],
    };

    const KPICard = ({
                         title,
                         value,
                         growth,
                         trend,
                         icon,
                         color
                     }: {
        title: string;
        value: string;
        growth: number;
        trend: string;
        icon: React.ReactNode;
        color: string;
    }) => (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
                    {icon}
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${
                    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                }`}>
                    {trend === 'up' && '↑'}
                    {trend === 'down' && '↓'}
                    {Math.abs(growth).toFixed(1)}%
                </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
        </div>
    );

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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Analytics Overview
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Real-time insights into your business performance
                    </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Live Data
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {kpis && (
                    <>
                        <KPICard
                            title="Total Revenue"
                            value={formatCurrency(kpis.totalRevenue.value)}
                            growth={kpis.totalRevenue.growth}
                            trend={kpis.totalRevenue.trend}
                            icon={<span className="text-2xl">💰</span>}
                            color="bg-green-100 dark:bg-green-900/30"
                        />
                        <KPICard
                            title="Total Orders"
                            value={formatNumber(kpis.totalOrders.value)}
                            growth={kpis.totalOrders.growth}
                            trend={kpis.totalOrders.trend}
                            icon={<span className="text-2xl">📦</span>}
                            color="bg-blue-100 dark:bg-blue-900/30"
                        />
                        <KPICard
                            title="Products"
                            value={formatNumber(kpis.totalProducts.value)}
                            growth={kpis.totalProducts.growth}
                            trend={kpis.totalProducts.trend}
                            icon={<span className="text-2xl">🏷️</span>}
                            color="bg-purple-100 dark:bg-purple-900/30"
                        />
                        <KPICard
                            title="Sellers"
                            value={formatNumber(kpis.totalSellers.value)}
                            growth={kpis.totalSellers.growth}
                            trend={kpis.totalSellers.trend}
                            icon={<span className="text-2xl">🏪</span>}
                            color="bg-orange-100 dark:bg-orange-900/30"
                        />
                        <KPICard
                            title="Avg Order Value"
                            value={formatCurrency(kpis.avgOrderValue.value)}
                            growth={kpis.avgOrderValue.growth}
                            trend={kpis.avgOrderValue.trend}
                            icon={<span className="text-2xl">📈</span>}
                            color="bg-pink-100 dark:bg-pink-900/30"
                        />
                        <KPICard
                            title="Buyers"
                            value={formatNumber(kpis.totalBuyers.value)}
                            growth={kpis.totalBuyers.growth}
                            trend={kpis.totalBuyers.trend}
                            icon={<span className="text-2xl">👥</span>}
                            color="bg-cyan-100 dark:bg-cyan-900/30"
                        />
                    </>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Revenue Trend
                            </h3>
                            <p className="text-sm text-gray-500">Last 30 days</p>
                        </div>
                    </div>
                    <div className="h-80">
                        <Line
                            data={salesTrendChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: { display: false },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => `Revenue: ${formatCurrency(context. parsed.y ??  0)}`,
                                        },
                                    },
                                },
                                scales: {
                                    x: {
                                        grid: { display: false },
                                        ticks: { color: 'rgb(156, 163, 175)' },
                                    },
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
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Revenue by Category
                        </h3>
                        <p className="text-sm text-gray-500">Top 6 categories</p>
                    </div>
                    <div className="h-64">
                        <Doughnut
                            data={categoryChart}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: {
                                            color: 'rgb(156, 163, 175)',
                                            padding: 10,
                                            usePointStyle: true,
                                        },
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                                return `${context.label}: ${formatCurrency(context.parsed)} (${percentage}%)`;
                                            },
                                        },
                                    },
                                },
                                cutout: '60%',
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm">Today's Orders</p>
                            <p className="text-3xl font-bold mt-1">
                                {salesTrend.length > 0 ?  salesTrend[salesTrend.length - 1].orders : 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm">Today's Revenue</p>
                            <p className="text-3xl font-bold mt-1">
                                {salesTrend.length > 0 ?  formatCurrency(salesTrend[salesTrend.length - 1].revenue) : '$0'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm">Top Category</p>
                            <p className="text-xl font-bold mt-1 truncate">
                                {categorySales.length > 0 ? categorySales[0].categoryName : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm">Items Sold Today</p>
                            <p className="text-3xl font-bold mt-1">
                                {salesTrend.length > 0 ? salesTrend[salesTrend.length - 1].items : 0}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalystDashboard;