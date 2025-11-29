import React, { useEffect, useState } from 'react';
import { sellerService } from '../../service/sellerService';
import { SellerDashboard as SellerDashboardType } from '../../types/seller';
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

const SellerDashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<SellerDashboardType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await sellerService.getDashboard();
            setDashboard(data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?.message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold">{error}</p>
                    <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboard) return null;

    // Revenue Trend Chart
    const revenueChartData = {
        labels: dashboard.revenueTrend && dashboard.revenueTrend.length > 0
            ? dashboard.revenueTrend.map((point) =>
                new Date(point.date).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
            )
            : ['No data'],
        datasets: [
            {
                label: 'Revenue ($)',
                data: dashboard.revenueTrend && dashboard.revenueTrend.length > 0
                    ? dashboard.revenueTrend.map((point) => point.revenue)
                    : [0],
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: 'rgb(59, 130, 246)',
                tension: 0.4,
            },
        ],
    };

    // Top Products Chart - FIXED
    const hasTopProducts = dashboard.topProducts && dashboard.topProducts.length > 0;
    const topProductsChartData = {
        labels: hasTopProducts
            ? dashboard.topProducts.map((p) =>
                p.productName.length > 15 ? p.productName.substring(0, 15) + '...' : p.productName
            )
            : ['No products yet'],
        datasets: [
            {
                label: 'Revenue ($)',
                data: hasTopProducts
                    ? dashboard.topProducts.map((p) => p.revenue)
                    : [0],
                backgroundColor: hasTopProducts
                    ? [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                    ]
                    : ['rgba(156, 163, 175, 0.5)'],
                borderColor: hasTopProducts
                    ? [
                        'rgb(59, 130, 246)',
                        'rgb(16, 185, 129)',
                        'rgb(245, 158, 11)',
                        'rgb(239, 68, 68)',
                        'rgb(139, 92, 246)',
                    ]
                    : ['rgb(156, 163, 175)'],
                borderWidth: 1,
                borderRadius: 8,
            },
        ],
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                        Seller Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Welcome, {dashboard.storeName || 'Seller'}
                        {dashboard.isVerifiedSeller && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ✓ Verified
                            </span>
                        )}
                    </p>
                </div>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-3xl font-bold mt-2">
                        ${dashboard.totalRevenue?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-blue-200 text-xs mt-2">
                        This month: ${dashboard.monthlyRevenue?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-green-100 text-sm font-medium">Today</p>
                    <p className="text-3xl font-bold mt-2">
                        ${dashboard.todayRevenue?.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-green-200 text-xs mt-2">
                        This week: ${dashboard.weeklyRevenue?.toFixed(2) || '0.00'}
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-purple-100 text-sm font-medium">Products</p>
                    <p className="text-3xl font-bold mt-2">{dashboard.totalProducts || 0}</p>
                    <p className="text-purple-200 text-xs mt-2">
                        ✓ {dashboard.approvedProducts || 0} approved | ⏳ {dashboard.pendingProducts || 0} pending
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-orange-100 text-sm font-medium">Sales</p>
                    <p className="text-3xl font-bold mt-2">{dashboard.totalUnitsSold || 0}</p>
                    <p className="text-orange-200 text-xs mt-2">
                        Units sold
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Revenue Trend
                    </h3>
                    <div className="h-80">
                        <Line
                            data={revenueChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        grid: {
                                            color: 'rgba(156, 163, 175, 0.2)',
                                        },
                                        ticks: {
                                            callback: (value: number | string) => `$${value}`,
                                            color: 'rgb(156, 163, 175)',
                                        },
                                    },
                                    x: {
                                        grid: {
                                            display: false,
                                        },
                                        ticks: {
                                            color: 'rgb(156, 163, 175)',
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Top Products
                    </h3>
                    <div className="h-80">
                        {hasTopProducts ? (
                            <Bar
                                data={topProductsChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: 'rgba(156, 163, 175, 0.2)',
                                            },
                                            ticks: {
                                                callback: (value: number | string) => `$${value}`,
                                                color: 'rgb(156, 163, 175)',
                                            },
                                        },
                                        x: {
                                            grid: {
                                                display: false,
                                            },
                                            ticks: {
                                                color: 'rgb(156, 163, 175)',
                                            },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                                <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <p className="text-lg font-medium">No sales yet</p>
                                <p className="text-sm mt-1">Your top products will appear here once you make sales</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;