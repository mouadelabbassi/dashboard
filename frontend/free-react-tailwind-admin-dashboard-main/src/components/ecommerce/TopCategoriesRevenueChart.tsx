import React, { useEffect, useState } from 'react';
import { dashboardAPI, CategoryRevenue } from '../../service/api';

const TopCategoriesRevenueChart: React.FC = () => {
    const [data, setData] = useState<CategoryRevenue[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await dashboardAPI.getCategoryRevenue();
                if (response.data.success) {
                    const categories = response.data.data;
                    setData(categories);
                    const total = categories.reduce((sum, cat) => sum + (cat.estimatedRevenue || 0), 0);
                    setTotalRevenue(total);
                }
            } catch (error) {
                console.error('Error fetching category revenue:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const colors = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-green-500 to-emerald-500',
        'from-orange-500 to-red-500',
        'from-yellow-500 to-amber-500',
        'from-indigo-500 to-violet-500',
        'from-teal-500 to-green-500',
    ];

    const formatCurrency = (value: number) => {
        if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
        if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
        return `$${value.toFixed(0)}`;
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const maxRevenue = Math.max(...data.map(d => d.estimatedRevenue || 0), 1);

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                        📊 Revenue by Category
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Estimated revenue based on engagement
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {formatCurrency(totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Est. Revenue</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.slice(0, 6).map((category, index) => {
                    const percentage = totalRevenue > 0 ? (category.estimatedRevenue / totalRevenue) * 100 : 0;
                    const barWidth = maxRevenue > 0 ? (category.estimatedRevenue / maxRevenue) * 100 : 0;

                    return (
                        <div key={category.name} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${colors[index % colors.length]}`} />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {category.name}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                                        {formatCurrency(category.estimatedRevenue)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                                        ({percentage.toFixed(1)}%)
                                    </span>
                                </div>
                            </div>
                            <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                <div
                                    className={`absolute left-0 top-0 h-full bg-gradient-to-r ${colors[index % colors.length]} rounded-lg transition-all duration-700`}
                                    style={{ width: `${barWidth}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-3">
                                    <span className="text-xs font-medium text-white drop-shadow-md">
                                        {category.productCount} products
                                    </span>
                                    <span className="text-xs font-medium text-white drop-shadow-md">
                                        Avg: ${category.avgPrice?.toFixed(0) || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TopCategoriesRevenueChart;