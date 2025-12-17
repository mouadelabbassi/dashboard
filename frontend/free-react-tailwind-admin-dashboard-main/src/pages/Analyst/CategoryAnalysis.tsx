import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { analystService, CategoryOverview } from '../../service/analystService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    RadialLinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const CategoryAnalysis: React.FC = () => {
    const [categories, setCategories] = useState<CategoryOverview[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<any>(null);
    const [revenueContribution, setRevenueContribution] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [categoriesData, contribution] = await Promise.all([
                analystService.getCategoriesOverview(),
                analystService.getCategoryRevenueContribution(),
            ]);
            setCategories(categoriesData);
            setRevenueContribution(contribution);
        } catch (error) {
            console.error('Error fetching category data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCategorySelect = async (categoryId: number) => {
        try {
            setDetailsLoading(true);
            const metrics = await analystService.getCategoryMetrics(categoryId);
            setSelectedCategory(metrics);
        } catch (error) {
            console.error('Error fetching category metrics:', error);
        } finally {
            setDetailsLoading(false);
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

    // Revenue Contribution Chart
    const contributionChartData = {
        labels: revenueContribution.slice(0, 8).map(c => c.name),
        datasets: [
            {
                data: revenueContribution.slice(0, 8).map(c => c.revenue),
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
                borderWidth: 0,
            },
        ],
    };

    const radarChartData = {
        labels: ['Products', 'Avg Price', 'Avg Rating', 'Sales', 'Revenue'],
        datasets: categories.slice(0, 5).map((cat, index) => {
            const colors = [
                'rgba(59, 130, 246, 0.5)',
                'rgba(16, 185, 129, 0.5)',
                'rgba(245, 158, 11, 0.5)',
                'rgba(239, 68, 68, 0.5)',
                'rgba(139, 92, 246, 0.5)',
            ];
            const borderColors = [
                'rgb(59, 130, 246)',
                'rgb(16, 185, 129)',
                'rgb(245, 158, 11)',
                'rgb(239, 68, 68)',
                'rgb(139, 92, 246)',
            ];

            const maxProducts = Math.max(...categories.map(c => c.productCount));
            const maxPrice = Math.max(...categories.map(c => c.avgPrice));
            const maxSales = Math.max(...categories.map(c => c.totalSales));
            const maxRevenue = Math.max(...categories.map(c => c.revenue));

            return {
                label: cat.name,
                data: [
                    (cat.productCount / maxProducts) * 100,
                    (cat.avgPrice / maxPrice) * 100,
                    (cat.avgRating / 5) * 100,
                    (cat.totalSales / maxSales) * 100,
                    (cat.revenue / maxRevenue) * 100,
                ],
                backgroundColor: colors[index],
                borderColor: borderColors[index],
                borderWidth: 2,
            };
        }),
    };

    const productsChartData = {
        labels: categories.map(c => c.name),
        datasets: [
            {
                label: 'Products',
                data: categories.map(c => c.productCount),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
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
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Category Analysis
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Deep dive into category performance and metrics
                </p>
            </div>


            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📊 Select Category for Detailed Analysis
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategorySelect(category.id)}
                            className={`p-4 rounded-xl border-2 transition-all text-left ${
                                selectedCategory?.id === category.id
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                            }`}
                        >
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {category.name}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">{category.productCount} products</p>
                        </button>
                    ))}
                </div>
            </div>


            {selectedCategory && (
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark: border-gray-700">
                    {detailsLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 dark:border-gray-400"></div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold mb-4 text-gray-900 dark: text-white">{selectedCategory.name} - Detailed Metrics</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark: border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Products</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900 dark: text-white">{selectedCategory. productCount}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Price</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatCurrency(selectedCategory. avgPrice || 0)}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Price Range</p>
                                    <p className="text-lg font-bold mt-1 text-gray-900 dark:text-white">
                                        {formatCurrency(selectedCategory.minPrice || 0)} - {formatCurrency(selectedCategory.maxPrice || 0)}
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark: border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Avg Rating</p>
                                    <p className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">⭐ {selectedCategory. avgRating || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {selectedCategory.bestRated && (
                                    <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Best Rated</p>
                                        <p className="font-medium truncate text-gray-900 dark:text-white">{selectedCategory.bestRated.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">⭐ {selectedCategory.bestRated.rating}</p>
                                    </div>
                                )}
                                {selectedCategory. bestSelling && (
                                    <div className="bg-white dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Best Selling</p>
                                        <p className="font-medium truncate text-gray-900 dark:text-white">{selectedCategory.bestSelling.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{selectedCategory.bestSelling. sales} sold</p>
                                    </div>
                                )}
                            </div>

                            {selectedCategory.ratingDistribution && (
                                <div className="mt-4">
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Rating Distribution</p>
                                    <div className="grid grid-cols-5 gap-2">
                                        {Object.entries(selectedCategory. ratingDistribution).map(([rating, count]) => (
                                            <div key={rating} className="bg-white dark:bg-gray-700 rounded-lg p-2 text-center border border-gray-200 dark: border-gray-600">
                                                <p className="text-xs text-gray-500 dark: text-gray-400">{rating}</p>
                                                <p className="font-bold text-gray-900 dark:text-white">{count as number}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Revenue by Category
                    </h3>
                    <div className="h-80">
                        <Doughnut
                            data={contributionChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: { color: 'rgb(156, 163, 175)', padding: 10 },
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const cat = revenueContribution[context.dataIndex];
                                                return `${context.label}: ${formatCurrency(cat.revenue)} (${cat.percentage}%)`;
                                            },
                                        },
                                    },
                                },
                                cutout: '50%',
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        Top 5 Categories Comparison
                    </h3>
                    <div className="h-80">
                        <Radar
                            data={radarChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'bottom',
                                        labels: { color: 'rgb(156, 163, 175)', padding: 10 },
                                    },
                                },
                                scales: {
                                    r: {
                                        ticks: { display: false },
                                        grid: { color: 'rgba(156, 163, 175, 0.2)' },
                                        pointLabels: { color: 'rgb(156, 163, 175)' },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Products by Category
                </h3>
                <div className="h-80">
                    <Bar
                        data={productsChartData}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { legend: { display: false } },
                            scales: {
                                x: {
                                    grid: { display: false },
                                    ticks: { color: 'rgb(156, 163, 175)', maxRotation: 45, minRotation: 45 },
                                },
                                y: {
                                    grid: { color: 'rgba(156, 163, 175, 0.1)' },
                                    ticks: { color: 'rgb(156, 163, 175)' },
                                },
                            },
                        }}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    All Categories Overview
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                            <th className="pb-4 font-medium">Category</th>
                            <th className="pb-4 font-medium text-right">Products</th>
                            <th className="pb-4 font-medium text-right">Avg Price</th>
                            <th className="pb-4 font-medium text-right">Avg Rating</th>
                            <th className="pb-4 font-medium text-right">Total Sales</th>
                            <th className="pb-4 font-medium text-right">Revenue</th>
                        </tr>
                        </thead>
                        <tbody>
                        {categories.map((category, index) => (
                            <tr key={category.id} className="border-t border-gray-100 dark:border-gray-700">
                                <td className="py-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-500 dark:text-gray-400 font-medium w-6 text-center">
                                            {index + 1}
                                        </span>
                                        <span className="font-medium text-gray-900 dark:text-white">
            {                               category.name}
                                        </span>
                                    </div>
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {category.productCount}
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {formatCurrency(category. avgPrice)}
                                </td>
                                <td className="py-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-yellow-600">
                                            ⭐ {category.avgRating}
                                        </span>
                                </td>
                                <td className="py-4 text-right text-gray-600 dark:text-gray-400">
                                    {category.totalSales. toLocaleString()}
                                </td>
                                <td className="py-4 text-right font-bold text-green-600">
                                    {formatCurrency(category.revenue)}
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

export default CategoryAnalysis;