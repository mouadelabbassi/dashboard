import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ProductCard {
    asin: string;
    productName: string;
    description: string;
    imageUrl: string;
    categoryName: string;
    currentPrice: number;
    recommendedPrice: number;
    priceDifference: number;
    priceChangePercentage: number;
    priceAction: string;
    rating: number;
    reviewsCount: number;
    salesCount: number;
    stockQuantity: number;
    bestsellerProbability: number;
    isPotentialBestseller: boolean;
    currentRank: number;
    predictedRank: number;
    rankingTrend: string;
    rankingChange: number;
    positioning: string;
    sellerName: string;
}

const PredictiveDashboard: React.FC = () => {
    const [products, setProducts] = useState<ProductCard[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<ProductCard[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [products, searchQuery, selectedCategory]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:8080/api/predictions/products-with-recommendations',
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 0, size: 500 }
                }
            );
            setProducts(response.data);

            const uniqueCategories = [...new Set(response.data.map((p: ProductCard) => p.categoryName))].filter(Boolean);
            setCategories(uniqueCategories as string[]);

            setError(null);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to load predictions');
        } finally {
            setLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;

        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.asin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.categoryName === selectedCategory);
        }

        setFilteredProducts(filtered);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading predictions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Predictive Analysis</h1>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">AI-powered insights and price recommendations</p>
                        </div>
                        <button
                            onClick={fetchProducts}
                            disabled={loading}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Products</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{filteredProducts.length}</div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">Potential Bestsellers</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                            {filteredProducts.filter(p => p.isPotentialBestseller).length}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Avg Probability</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                            {filteredProducts.length > 0
                                ? (filteredProducts.reduce((sum, p) => sum + (p.bestsellerProbability || 0), 0) / filteredProducts.length * 100).toFixed(1)
                                : 0}%
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">Categories</div>
                        <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{categories.length}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 transition-all min-w-[200px]"
                        >
                            <option value="all">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <div className="flex items-center px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            <span className="font-semibold text-gray-900 dark:text-white mr-2">{filteredProducts.length}</span>
                            products
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <p className="text-red-800 dark:text-red-400 font-medium">{error}</p>
                        <button onClick={fetchProducts} className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                            Retry
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {filteredProducts.length === 0 && !loading && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-12 text-center">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No products found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">Try adjusting your filters or refresh the data</p>
                    </div>
                </div>
            )}

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProducts.map((product) => (
                        <div
                            key={product.asin}
                            className="group bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-lg hover:border-blue-500 dark:hover:border-blue-500 transition-all duration-300"
                        >
                            {/* Image */}
                            <div className="relative h-64 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                {product.imageUrl ? (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        className="w-full h-full object-contain p-4"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/e5e7eb/6b7280?text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                {product.isPotentialBestseller && (
                                    <div className="absolute top-3 right-3 px-3 py-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                                        Bestseller
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5 space-y-4">
                                {/* Category & Seller */}
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-blue-600 dark:text-blue-400 font-medium">{product.categoryName}</span>
                                    <span className="text-gray-500 dark:text-gray-400">{product.sellerName}</span>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug">
                                    {product.productName}
                                </h3>

                                {/* Rating */}
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center">
                                        <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                        <span className="ml-1 text-sm font-semibold text-gray-900 dark:text-white">{product.rating?.toFixed(1) || 'N/A'}</span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({product.reviewsCount || 0})</span>
                                </div>

                                {/* Pricing */}
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current</div>
                                            <div className="text-xl font-bold text-gray-900 dark:text-white">
                                                ${product.currentPrice?.toFixed(2)}
                                            </div>
                                        </div>
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Recommended</div>
                                            <div className={`text-xl font-bold ${
                                                product.priceAction === 'INCREASE' ? 'text-green-600 dark:text-green-400' :
                                                    product.priceAction === 'DECREASE' ? 'text-red-600 dark:text-red-400' :
                                                        'text-gray-900 dark:text-white'
                                            }`}>
                                                ${product.recommendedPrice?.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${
                                        product.priceAction === 'INCREASE'
                                            ? 'bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                                            product.priceAction === 'DECREASE'
                                                ? 'bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
                                                'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    }`}>
                                        <svg className={`w-4 h-4 ${
                                            product.priceAction === 'INCREASE' ? 'text-green-600 dark:text-green-400' :
                                                product.priceAction === 'DECREASE' ? 'text-red-600 dark:text-red-400' :
                                                    'text-blue-600 dark:text-blue-400'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {product.priceAction === 'INCREASE' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                            ) : product.priceAction === 'DECREASE' ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            )}
                                        </svg>
                                        <span className={`text-sm font-semibold ${
                                            product.priceAction === 'INCREASE' ? 'text-green-700 dark:text-green-400' :
                                                product.priceAction === 'DECREASE' ? 'text-red-700 dark:text-red-400' :
                                                    'text-blue-700 dark:text-blue-400'
                                        }`}>
                                            {product.priceAction === 'INCREASE' ? 'Increase' : 'Decrease'} by {Math.abs(product.priceChangePercentage || 0).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Predictions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Bestseller</div>
                                        <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {((product.bestsellerProbability || 0) * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                                        <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Rank Trend</div>
                                        <div className={`flex items-center justify-center gap-1 text-lg font-bold ${
                                            product.rankingTrend === 'IMPROVING' ? 'text-green-600 dark:text-green-400' :
                                                product.rankingTrend === 'DECLINING' ? 'text-red-600 dark:text-red-400' :
                                                    'text-gray-600 dark:text-gray-400'
                                        }`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                {product.rankingTrend === 'IMPROVING' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                                ) : product.rankingTrend === 'DECLINING' ? (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                                ) : (
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                )}
                                            </svg>
                                            <span>{product.rankingChange > 0 ? '+' : ''}{product.rankingChange || 0}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">Positioning</span>
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                        product.positioning === 'PREMIUM'
                                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                                            product.positioning === 'VALUE'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                                'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                                    }`}>
                                        {product.positioning}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PredictiveDashboard;