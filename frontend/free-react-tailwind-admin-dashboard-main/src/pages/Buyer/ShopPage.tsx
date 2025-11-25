import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router';
import { searchProducts, getCategories, Product, Category, SearchFilters } from '../../service/api';
import { useAuth } from '../../context/AuthContext';

const ShopPage: React.FC = () => {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [sortBy, setSortBy] = useState('ranking');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        fetchCategories();
    }, []);

    useEffect(() => {
        const timeout = setTimeout(() => {
            handleSearch();
        }, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, selectedCategory, sortBy]);

    const fetchCategories = async () => {
        const cats = await getCategories();
        setCategories(cats);
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const filters: SearchFilters = {
                query: searchQuery || undefined,
                category: selectedCategory || undefined,
            };

            // Fetch ALL products (size = 10000 to get everything)
            const data = await searchProducts(filters, 0, 10000);

            // Sort products
            let sorted = [...data];
            switch (sortBy) {
                case 'price-low':
                    sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                    break;
                case 'price-high':
                    sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                    break;
                case 'rating':
                    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                    break;
                case 'reviews':
                    sorted.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
                    break;
                case 'newest':
                    sorted.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
                    break;
                default:
                    sorted.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
            }
            setProducts(sorted);
        } catch (error) {
            console.error('Error searching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <span key={i} className={`text-sm ${i < Math.round(rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                ★
            </span>
        ));
    };

    const getRankBadge = (ranking: number | undefined) => {
        if (!ranking) return null;
        if (ranking === 1) return { text: '🥇 #1 Best Seller', color: 'from-yellow-400 to-orange-500' };
        if (ranking === 2) return { text: '🥈 #2 Best Seller', color: 'from-gray-300 to-gray-400' };
        if (ranking === 3) return { text: '🥉 #3 Best Seller', color: 'from-orange-400 to-red-500' };
        if (ranking <= 10) return { text: `🔥 #${ranking} Top Seller`, color: 'from-red-500 to-pink-500' };
        if (ranking <= 50) return { text: `⭐ Top 50`, color: 'from-blue-500 to-purple-500' };
        return null;
    };

    return (
        <div>
            {/* Hero Section with User Welcome */}
            <div className="relative mb-8 p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                <div className="relative">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-1">
                        Welcome back, <span className="font-semibold text-gray-900 dark:text-white">{user?.fullName}</span> 👋
                    </p>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                        Discover Amazing Products
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl">
                        Your feedback helps others make better choices!
                    </p>

                    {/* Quick Stats */}
                    <div className="flex flex-wrap gap-4 mt-6">
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
                            <span className="text-2xl">📦</span>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{products.length}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Products</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
                            <span className="text-2xl">🏷️ </span>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Categories</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3">
                            <span className="text-2xl">🔥</span>
                            <div>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{products.filter(p => p.ranking && p.ranking <= 10).length}</p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Top Sellers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-gray-800 p-6 mb-8">
                <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                    <div className="flex flex-wrap gap-4 flex-1">
                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[200px]">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500"
                            />
                        </div>

                        {/* Category Select */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-w-[180px]"
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name} ({cat.productCount})</option>
                            ))}
                        </select>

                        {/* Sort Select */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 min-w-[180px]"
                        >
                            <option value="ranking">🏆 Best Sellers</option>
                            <option value="rating">⭐ Highest Rated</option>
                            <option value="reviews">💬 Most Reviews</option>
                            <option value="price-low">💰 Price: Low → High</option>
                            <option value="price-high">💎 Price: High → Low</option>
                            <option value="newest">🆕 Newest First</option>
                        </select>
                    </div>

                    {/* View Toggle & Count */}
                    <div className="flex items-center gap-4">
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                            >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm' : ''}`}
                            >
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                            <span className="text-white font-medium">{products.length} products</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Grid/List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full animate-spin border-t-purple-600"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-2xl">🛍️</span>
                        </div>
                    </div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Loading amazing products...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="text-7xl mb-4">🔍</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">Try adjusting your search or filters</p>
                    <button
                        onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
                        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all"
                    >
                        Clear All Filters
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                    : 'flex flex-col gap-4'
                }>
                    {products.map(product => {
                        const badge = getRankBadge(product.ranking);

                        return viewMode === 'grid' ? (
                            // Grid View Card
                            <Link
                                key={product.asin}
                                to={`/product/${product.asin}`}
                                className="group bg-white dark:bg-gray-900 rounded-2xl shadow-lg shadow-gray-200/50 dark:shadow-black/20 border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-purple-500/10 hover:border-purple-300 dark:hover:border-purple-700 hover:-translate-y-1 transition-all duration-300"
                            >
                                {/* Image Container */}
                                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800 overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/300?text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}

                                    {/* Rank Badge */}
                                    {badge && (
                                        <div className={`absolute top-3 left-3 px-3 py-1.5 bg-gradient-to-r ${badge.color} text-white text-xs font-bold rounded-full shadow-lg`}>
                                            {badge.text}
                                        </div>
                                    )}

                                    {/* Quick View Overlay */}
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="px-4 py-2 bg-white text-gray-900 rounded-full font-medium text-sm">
                                            View Details →
                                        </span>
                                    </div>
                                </div>

                                {/* Product Info */}
                                <div className="p-4">
                                    {/* Category */}
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                        {product.categoryName || 'Uncategorized'}
                                    </p>

                                    {/* Name */}
                                    <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors min-h-[48px]">
                                        {product.productName}
                                    </h3>

                                    {/* Rating */}
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex">{renderStars(product.rating || 0)}</div>
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                                            {product.rating?.toFixed(1) || 'N/A'}
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ({(product.reviewsCount || 0).toLocaleString()})
                                        </span>
                                    </div>

                                    {/* Price & Rank */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                            Rank #{product.ranking || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ) : (
                            // List View Card
                            <Link
                                key={product.asin}
                                to={`/product/${product.asin}`}
                                className="group flex bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                            >
                                {/* Image */}
                                <div className="relative w-48 h-48 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                    <img
                                        src={product.imageUrl || 'https://via.placeholder.com/200'}
                                        alt={product.productName}
                                        className="w-full h-full object-contain p-4"
                                    />
                                    {badge && (
                                        <div className={`absolute top-2 left-2 px-2 py-1 bg-gradient-to-r ${badge.color} text-white text-xs font-bold rounded-full`}>
                                            {badge.text}
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 p-6">
                                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                                        {product.categoryName}
                                    </p>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 transition-colors">
                                        {product.productName}
                                    </h3>
                                    <div className="flex items-center gap-4 mb-3">
                                        <div className="flex items-center gap-1">
                                            {renderStars(product.rating || 0)}
                                            <span className="font-medium ml-1">{product.rating?.toFixed(1)}</span>
                                        </div>
                                        <span className="text-gray-500">({(product.reviewsCount || 0).toLocaleString()} reviews)</span>
                                        <span className="text-gray-500">Rank #{product.ranking}</span>
                                    </div>
                                    <p className="text-2xl font-bold text-green-600">${product.price?.toFixed(2)}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ShopPage;