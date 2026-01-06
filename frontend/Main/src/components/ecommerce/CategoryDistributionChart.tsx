import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface CategoryData {
    name: string;
    count: number;
}

const CategoryDistributionChart: React.FC = () => {
    const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCategoryDistribution = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await axios.get('http://localhost:8080/api/dashboard/category-distribution');

                if (response.data.success) {
                    const data = response.data.data;
                    const formattedData: CategoryData[] = Object.entries(data)
                        .map(([name, count]) => ({
                            name,
                            count: count as number
                        }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 8);

                    setCategoryData(formattedData);
                }
            } catch (err: any) {
                console.error('Error fetching category distribution:', err);
                setError(err.message || 'Failed to load category data');
            } finally {
                setLoading(false);
            }
        };

        fetchCategoryDistribution();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">⚠️ {error}</p>
                </div>
            </div>
        );
    }

    const maxCount = Math.max(...categoryData.map(c => c.count), 1);
    const colors = [
        '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
        '#10b981', '#06b6d4', '#6366f1', '#84cc16'
    ];

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-black dark:text-white">
                    Products by Category
                </h4>
                <div className="relative">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Total: {categoryData.reduce((sum, cat) => sum + cat.count, 0)} products
                    </span>
                </div>
            </div>

            {categoryData.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                    <p className="text-gray-500 dark:text-gray-400">No category data available</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {categoryData.map((category, index) => {
                        const percentage = (category.count / maxCount) * 100;
                        const color = colors[index % colors.length];

                        return (
                            <div key={category.name} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                                            {category.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            {category.count} products
                                        </span>
                                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 min-w-[45px] text-right">
                                            {Math.round((category.count / categoryData.reduce((sum, c) => sum + c.count, 0)) * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500 ease-out"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: color
                                        }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {categoryData.length}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Total Categories
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {Math.max(...categoryData.map(c => c.count))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Highest Count
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {Math.min(...categoryData.map(c => c.count))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Lowest Count
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white">
                            {Math.round(categoryData.reduce((sum, c) => sum + c.count, 0) / categoryData.length)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Average per Category
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryDistributionChart;
