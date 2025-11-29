import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface SellerPerformance {
    sellerId: number;
    sellerName: string;
    storeName: string;
    totalRevenue: number;
    totalProductsSold: number;
    totalOrders: number;
}

const TopSellersChart: React.FC = () => {
    const [data, setData] = useState<SellerPerformance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTopSellers();
    }, []);

    const fetchTopSellers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/admin/sellers/top-performers', {
                headers: { Authorization: `Bearer ${token}` },
                params: { limit: 10 }
            });

            if (response.data?.success) {
                setData(response.data.data);
            }
        } catch (err: any) {
            console.error('Error fetching top sellers:', err);
            setError('Failed to load top sellers data');
        } finally {
            setLoading(false);
        }
    };

    const chartData = {
        labels: data.map(seller => seller.storeName || seller.sellerName),
        datasets: [
            {
                label: 'Revenue ($)',
                data: data.map(seller => seller.totalRevenue),
                backgroundColor: 'rgba(34, 197, 94, 0.8)',
                borderColor: 'rgba(34, 197, 94, 1)',
                borderWidth: 1,
                borderRadius: 6,
                yAxisID: 'y',
            },
            {
                label: 'Products Sold',
                data: data.map(seller => seller.totalProductsSold),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
                borderRadius: 6,
                yAxisID: 'y1',
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index' as const,
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    color: 'rgb(156, 163, 175)',
                    usePointStyle: true,
                    padding: 20,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                titleColor: '#fff',
                bodyColor: '#fff',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: function(context: any) {
                        const label = context.dataset.label || '';
                        const value = context.parsed.y;
                        if (label.includes('Revenue')) {
                            return `${label}: $${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
                        }
                        return `${label}: ${value.toLocaleString()}`;
                    }
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: 'rgb(156, 163, 175)',
                    maxRotation: 45,
                    minRotation: 45,
                },
            },
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Revenue ($)',
                    color: 'rgba(34, 197, 94, 1)',
                },
                grid: {
                    color: 'rgba(156, 163, 175, 0.1)',
                },
                ticks: {
                    color: 'rgba(34, 197, 94, 1)',
                    callback: function(value: number | string) {
                        return '$' + Number(value).toLocaleString();
                    },
                },
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Products Sold',
                    color: 'rgba(59, 130, 246, 1)',
                },
                grid: {
                    drawOnChartArea: false,
                },
                ticks: {
                    color: 'rgba(59, 130, 246, 1)',
                },
            },
        },
    };

    if (loading) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <span>🏆</span> Top Sellers Performance
                </h3>
                <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                    <svg className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>No seller data available yet</p>
                    <p className="text-sm">Sales data will appear once orders are confirmed</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                    <span>🏆</span> Top Sellers Performance
                </h3>
                <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Products Sold</span>
                    </div>
                </div>
            </div>

            <div className="h-80">
                <Bar data={chartData} options={options} />
            </div>

            {/* Top 3 Sellers Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                {data.slice(0, 3).map((seller, index) => (
                    <div
                        key={seller.sellerId}
                        className={`p-4 rounded-lg ${
                            index === 0
                                ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-500/30'
                                : index === 1
                                    ? 'bg-gradient-to-r from-gray-300/20 to-gray-400/20 border border-gray-400/30'
                                    : 'bg-gradient-to-r from-orange-400/20 to-orange-500/20 border border-orange-500/30'
                        }`}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">
                                {index === 0 ?  '🥇' : index === 1 ? '🥈' : '🥉'}
                            </span>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white truncate">
                                    {seller.storeName || seller.sellerName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {seller.totalOrders} orders
                                </p>
                            </div>
                        </div>
                        <div className="flex justify-between text-sm">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400">Revenue</p>
                                <p className="font-bold text-green-600 dark:text-green-400">
                                    ${seller.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-gray-500 dark:text-gray-400">Sold</p>
                                <p className="font-bold text-blue-600 dark:text-blue-400">
                                    {seller.totalProductsSold} items
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TopSellersChart;