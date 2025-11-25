import React, { useEffect, useState } from 'react';
import api from '../../service/api';

interface CategoryStats {
    id: number;
    name: string;
    description: string;
    productCount: number;
}

const CategoryProductsChart: React.FC = () => {
    const [categories, setCategories] = useState<CategoryStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/categories');

                if (response.data.success) {
                    setCategories(response.data.data);
                }
            } catch (err: any) {
                console.error('Error fetching categories:', err);
                setError(err.message || 'Failed to load category data');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    const maxCount = Math.max(...categories.map(c => c.productCount || 0), 1);

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 px-5 py-6 shadow-default">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 px-5 py-6 shadow-default">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                        Products by Category
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Distribution of products across categories
                    </p>
                </div>
            </div>

            {error && (
                <div className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        {error}
                    </p>
                </div>
            )}

            <div className="h-80">
                <div className="flex h-full items-end justify-between gap-3">
                    {categories.map((category, index) => {
                        const height = maxCount > 0 ? (category.productCount / maxCount) * 100 : 0;
                        const colors = [
                            'from-brand-500 to-brand-400',
                            'from-success-500 to-success-400',
                            'from-warning-500 to-warning-400',
                            'from-error-500 to-error-400',
                            'from-purple-500 to-purple-400',
                            'from-cyan-500 to-cyan-400',
                            'from-pink-500 to-pink-400',
                        ];
                        const colorClass = colors[index % colors.length];

                        return (
                            <div key={category.id} className="flex flex-col items-center flex-1 group">
                                <div className="relative w-full flex items-end justify-center h-64">
                                    <div
                                        className={`w-full bg-gradient-to-t ${colorClass} rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative min-h-[4px]`}
                                        style={{ height: `${Math.max(height, 2)}%` }}
                                    >
                                        {/* Tooltip */}
                                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                                            {category.productCount} products
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium text-center truncate w-full" title={category.name}>
                                    {category.name.length > 10 ? `${category.name.substring(0, 10)}...` : category.name}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-4 flex-wrap">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total: <span className="font-semibold text-gray-800 dark:text-white">{categories.reduce((acc, c) => acc + c.productCount, 0)} products</span>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Categories: <span className="font-semibold text-gray-800 dark:text-white">{categories.length}</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CategoryProductsChart;