import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
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
    const [quantities, setQuantities] = useState<{ [key: string]: number }>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterAndSortProducts();
    }, [products, searchQuery, selectedCategory, priceRange, sortBy]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortProducts = () => {
        let result = [...products];

        if (searchQuery) {
            result = result.filter(p =>
                p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.asin.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            result = result.filter(p => p.categoryName === selectedCategory);
        }

        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter(p => {
                const price = p.price || 0;
                if (max) return price >= min && price <= max;
                return price >= min;
            });
        }

        result.sort((a, b) => {
            switch (sortBy) {
                case 'price-low':
                    return (a.price || 0) - (b.price || 0);
                case 'price-high':
                    return (b.price || 0) - (a.price || 0);
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                case 'reviews':
                    return (b.reviewsCount || 0) - (a.reviewsCount || 0);
                default:
                    return (a.ranking || 999) - (b.ranking || 999);
            }
        });

        setFilteredProducts(result);
    };

    const getQuantity = (asin: string) => quantities[asin] || 1;

    const setQuantity = (asin: string, qty: number) => {
        if (qty < 1) qty = 1;
        if (qty > 99) qty = 99;
        setQuantities(prev => ({ ...prev, [asin]: qty }));
    };

    const handleAddToCart = (product: Product) => {
        const qty = getQuantity(product.asin);
        addToCart(product, qty);
        setToast({ message: `Added ${qty} item(s) to cart! `, type: 'success' });
        setQuantities(prev => ({ ...prev, [product.asin]: 1 }));
    };

    const categories = ['all', ...new Set(products.map(p => p.categoryName).filter(Boolean))];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
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
                                {cat === 'all' ?   'All Categories' : cat}
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
                        <Link to={`/shop/product/${product.asin}`} className="block relative">
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
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="absolute top-2 left-2 flex flex-col gap-1">
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
                                {!product.sellerId ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" />
                                        </svg>
                                        MouadVision Store
                                    </span>
                                        ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-full">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        {product.sellerName || 'Third-party Seller'}
                                    </span>
                                )}
                            </div>

                            {/* FIXED: Changed from /product/ to /shop/product/ */}
                            <Link to={`/shop/product/${product.asin}`}>
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 mb-2">
                                    {product.productName}
                                </h3>
                            </Link>

                            <div className="flex items-center gap-2 mb-2">
                                <div className="flex items-center">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                                        {product.rating?.toFixed(1) || 'N/A'}
                                    </span>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    ({product.reviewsCount?.toLocaleString() || 0} reviews)
                                </span>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    ${product.price?.toFixed(2) || '0.00'}
                                </p>
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-sm text-gray-600 dark:text-gray-400">Qty:</span>
                                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                    <button
                                        onClick={() => setQuantity(product.asin, getQuantity(product.asin) - 1)}
                                        className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        -
                                    </button>
                                    <input
                                        type="number"
                                        min="1"
                                        max="99"
                                        value={getQuantity(product.asin)}
                                        onChange={(e) => setQuantity(product.asin, parseInt(e.target.value) || 1)}
                                        className="w-12 text-center border-x border-gray-300 dark:border-gray-600 bg-transparent text-gray-900 dark:text-white focus:outline-none"
                                    />
                                    <button
                                        onClick={() => setQuantity(product.asin, getQuantity(product.asin) + 1)}
                                        className="px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => handleAddToCart(product)}
                                className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Add to Cart
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {filteredProducts.length === 0 && (
                <div className="text-center py-16">
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