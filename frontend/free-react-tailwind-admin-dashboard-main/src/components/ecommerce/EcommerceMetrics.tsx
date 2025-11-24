import React, { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats } from '../../service/api';

const EcommerceMetrics: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getDashboardStats();
                setStats(data);
            } catch (err: any) {
                console.error('Error fetching dashboard stats:', err);
                setError(err.message || 'Failed to load statistics');
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const metrics = [
        {
            title: 'Total Products',
            value: stats?.totalProducts?.toLocaleString() || '0',
            icon: '📦',
            isPositive: true,
        },
        {
            title: 'Total Categories',
            value: stats?.totalCategories?.toString() || '0',
            icon: '📂',
            isPositive: true,
        },
        {
            title: 'Average Price',
            value: `$${stats?.avgPrice?.toFixed(2) || '0.00'}`,
            icon: '💰',
            isPositive: false,
        },
        {
            title: 'Average Rating',
            value: stats?.avgRating?.toFixed(1) || '0.0',
            icon: '⭐',
            isPositive: true,
        },
        {
            title: 'Total Reviews',
            value: stats?.totalReviews?.toLocaleString() || '0',
            icon: '💬',
            isPositive: true,
        },
        {
            title: 'Total Inventory Value',
            value: `${stats?.totalInventoryValue?.toLocaleString() || '0'}`,
            icon: '💵',
            isPositive: true,
        },
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="rounded-lg border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-gray-800 dark:bg-gray-900">
                        <div className="animate-pulse">
                            <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20 px-7.5 py-6">
                <p className="text-red-600 dark:text-red-400">⚠️ {error}</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
            {metrics.map((metric, index) => (
                <div
                    key={index}
                    className="rounded-lg border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-gray-800 dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">{metric.icon}</span>
                                <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {metric.title}
                                </h4>
                            </div>
                            <span className="text-2xl font-bold text-black dark:text-white">
                                {metric.value}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default EcommerceMetrics;