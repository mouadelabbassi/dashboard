import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllProducts, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/common/Toast';

const ShopPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('ranking');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const { addToCart, isInCart, getItemQuantity } = useCart();
    const { user } = useAuth();
    const location = useLocation();

    // Determine if we're in seller context or buyer context
    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ? '/seller/shop' : '/shop';

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts();

            // Filter out the current seller's own products when they're shopping
            let availableProducts = data;
            if (isSellerContext && user?.id) {
                availableProducts = data.filter((product: Product) => product.sellerId !== user.id);
            }

            setProducts(availableProducts);
            setFilteredProducts(availableProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            setToast({ message: 'Failed to load products', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = [...products];

        // Search filter
        if (searchQuery) {
            result = result.filter(p =>
                p.productName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Category filter
        if (selectedCategory !== 'all') {
            result = result.filter(p => p.categoryName === selectedCategory);
        }

        // Price filter
        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter(p => {
                if (max) {
                    return p.price >= min && p.price <= max;
                }
                return p.price >= min;
            });
        }

        // Sort
        switch (sortBy) {
            case 'price-low':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'reviews':
                result.sort((a, b) => (b.reviewsCount || 0) - (a.reviewsCount || 0));
                break;
            case 'ranking':
            default:
                result.sort((a, b) => (a.ranking || 999) - (b.ranking || 999));
                break;
        }

        setFilteredProducts(result);
    }, [searchQuery, selectedCategory, priceRange, sortBy, products]);

    const categories = ['all', ...new Set(products.map(p => p.categoryName).filter(Boolean))];

    const handleAddToCart = (product: Product) => {
        addToCart(product);
        setToast({ message: `${product.productName} added to cart! `, type: 'success' });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shop</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Discover our collection of {products.length} products
                    {isSellerContext && <span className="text-sm ml-2">(Your own products are hidden)</span>}
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="lg:col-span-2">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ?  'All Categories' : cat}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="all">All Prices</option>
                        <option value="0-25">Under $25</option>
                        <option value="25-50">$25 - $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100-">$100+</option>
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ranking">Best Ranking</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="rating">Highest Rated</option>
                        <option value="reviews">Most Reviews</option>
                    </select>
                </div>
            </div>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Showing {filteredProducts.length} of {products.length} products
            </p>

            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                    <div
                        key={product.asin}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow group"
                    >
                        <Link to={`${shopBasePath}/product/${product.asin}`} className="block relative">
                            <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                {product.imageUrl ?  (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                                {product.ranking && product.ranking <= 10 && (
                                    <span className="px-2 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full">
                                        🏆 Top {product.ranking}
                                    </span>
                                )}
                                {product.isBestseller && (
                                    <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                        Best Seller
                                    </span>
                                )}
                            </div>

                            {isInCart(product.asin) && (
                                <div className="absolute top-2 right-2 px-2 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                                    ✓ In Cart ({getItemQuantity(product.asin)})
                                </div>
                            )}
                        </Link>

                        <div className="p-4">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                {product.categoryName || 'Uncategorized'}
                            </p>
                            {/* Seller Badge */}
                            <div className="mb-2">
                                {! product.sellerId ?  (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        🏪 MouadVision
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        👤 {product.sellerName || 'Seller'}
                                    </span>
                                )}
                            </div>
                            <Link to={`${shopBasePath}/product/${product.asin}`}>
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 mb-2">
                                    {product.productName}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-3">
                                {product.rating && (
                                    <div className="flex items-center">
                                        <span className="text-yellow-500">★</span>
                                        <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                            {product.rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                                {product.reviewsCount && (
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        ({product.reviewsCount.toLocaleString()} reviews)
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-xl font-bold text-gray-900 dark:text-white">
                                    ${product.price.toFixed(2)}
                                </span>
                                <button
                                    onClick={() => handleAddToCart(product)}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                    <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No products found</h3>
                    <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
                </div>
            )}
        </div>
    );
};

export default ShopPage;