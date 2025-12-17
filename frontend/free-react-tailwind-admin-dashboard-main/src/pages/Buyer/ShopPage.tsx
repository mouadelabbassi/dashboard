import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getAllProducts, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/common/Toast';

interface Store {
    id:number | null;
    name:string;
}

const ShopPage:React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedStore, setSelectedStore] = useState<string>('all');
    const [priceRange, setPriceRange] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('ranking');
    const [toast, setToast] = useState<{ message:string; type:'success' | 'error' } | null>(null);

    const { addToCart, isInCart, getItemQuantity } = useCart();
    const { user } = useAuth();
    const location = useLocation();

    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ?  '/seller/shop' :'/shop';

    const calculateProductScore = (product:Product):number => {
        const ratingScore = (product.rating || 0) * 1000;
        const salesScore = (product.salesCount || 0) * 100;

        let rankingBonus = 0;
        if (product.ranking && product.ranking > 0 && product.ranking <= 100) {
            rankingBonus = Math.max(0, 100 - product.ranking);
        }

        return ratingScore + salesScore + rankingBonus;
    };

    const getProductsRankedByScore = (productList:Product[]):Product[] => {
        return [...productList].sort((a, b) => calculateProductScore(b) - calculateProductScore(a));
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts();

            let availableProducts = data;
            if (isSellerContext && user?.id) {
                availableProducts = data.filter((product: Product) => product.sellerId !== user.id);
            }

            setProducts(availableProducts);
            setFilteredProducts(availableProducts);
        } catch (error) {
            console.error('Error fetching products:', error);
            setToast({ message:'Failed to load products', type:'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = [...products];

        if (searchQuery) {
            result = result.filter(p =>
                p.productName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            result = result.filter(p => p.categoryName === selectedCategory);
        }

        if (selectedStore !== 'all') {
            if (selectedStore === 'mouadvision') {
                result = result.filter(p => ! p.sellerId);
            } else {
                result = result.filter(p => p.sellerName === selectedStore);
            }
        }

        if (priceRange !== 'all') {
            const [min, max] = priceRange.split('-').map(Number);
            result = result.filter(p => {
                if (max) {
                    return p.price >= min && p.price <= max;
                }
                return p.price >= min;
            });
        }

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
                result = getProductsRankedByScore(result);
                break;
        }

        setFilteredProducts(result);
    }, [searchQuery, selectedCategory, selectedStore, priceRange, sortBy, products]);

    const categories = ['all', ...new Set(products.map(p => p.categoryName).filter(Boolean))];

    const stores:  Store[] = [
        { id: null, name: 'all' },
        { id: null, name: 'mouadvision' },
        ...products
            .filter((p): p is Product & { sellerId: number; sellerName: string } =>
                p.sellerId !== null && p.sellerId !== undefined &&
                p.sellerName !== null && p.sellerName !== undefined
            )
            .reduce<Store[]>((acc, p) => {
                if (! acc.find(s => s.name === p.sellerName)) {
                    acc.push({ id: p.sellerId, name: p.sellerName });
                }
                return acc;
            }, [])
    ];

    const handleAddToCart = (product: Product) => {
        const stockQuantity = product.stockQuantity || 0;
        const currentInCart = getItemQuantity(product.asin);

        if (stockQuantity <= 0) {
            setToast({ message: `${product.productName} is out of stock! `, type: 'error' });
            return;
        }

        if (currentInCart >= stockQuantity) {
            setToast({
                message: `Maximum quantity reached!  Only ${stockQuantity} available.`,
                type: 'error'
            });
            return;
        }

        const added = addToCart(product);
        if (added) {
            setToast({ message: `${product.productName} added to cart!`, type: 'success' });
        } else {
            setToast({ message: 'Could not add to cart', type: 'error' });
        }
    };

    // Common select styles to ensure consistency
    const selectClassName = "px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all cursor-pointer appearance-none";

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Shop
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Discover our collection of {products.length} products
                    {isSellerContext && <span className="text-gray-500 text-sm ml-2">(Your own products are hidden)</span>}
                </p>
            </div>

            {/* Filters Section */}
            <div className="mb-6">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search products..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Category Select */}
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={selectClassName}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    {cat === 'all' ? 'All Categories' :cat}
                                </option>
                            ))}
                        </select>

                        {/* Store Select */}
                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className={selectClassName}
                        >
                            {stores.map((store, index) => (
                                <option key={index} value={store.name} className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    {store.name === 'all'
                                        ? '🏪 All Stores'
                                        :store.name === 'mouadvision'
                                            ? '🏢 MouadVision Official'
                                            :`👤 ${store.name}`}
                                </option>
                            ))}
                        </select>

                        {/* Price Range Select */}
                        <select
                            value={priceRange}
                            onChange={(e) => setPriceRange(e.target.value)}
                            className={selectClassName}
                        >
                            <option value="all" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">All Prices</option>
                            <option value="0-25" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Under $25</option>
                            <option value="25-50" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">$25 - $50</option>
                            <option value="50-100" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">$50 - $100</option>
                            <option value="100-500" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">$100 - $500</option>
                            <option value="500-1000" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">$500 - $1000</option>
                            <option value="1000-" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">$1000+</option>
                        </select>

                        {/* Sort By Select */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className={selectClassName}
                        >
                            <option value="ranking" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Best Ranking</option>
                            <option value="price-low" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Price: Low to High</option>
                            <option value="price-high" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Price: High to Low</option>
                            <option value="rating" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Highest Rated</option>
                            <option value="reviews" className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">Most Reviews</option>
                        </select>
                    </div>

                    {/* Active Filters */}
                    {(selectedCategory !== 'all' || selectedStore !== 'all' || priceRange !== 'all') && (
                        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
                            {selectedCategory !== 'all' && (
                                <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full text-sm flex items-center gap-2">
                                    {selectedCategory}
                                    <button onClick={() => setSelectedCategory('all')} className="hover:text-blue-900 dark:hover:text-white transition-colors">×</button>
                                </span>
                            )}
                            {selectedStore !== 'all' && (
                                <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full text-sm flex items-center gap-2">
                                    {selectedStore === 'mouadvision' ? 'MouadVision' :  selectedStore}
                                    <button onClick={() => setSelectedStore('all')} className="hover:text-green-900 dark:hover:text-white transition-colors">×</button>
                                </span>
                            )}
                            {priceRange !== 'all' && (
                                <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-2">
                                    ${priceRange.replace('-', ' - $')}
                                    <button onClick={() => setPriceRange('all')} className="hover:text-purple-900 dark:hover:text-white transition-colors">×</button>
                                </span>
                            )}
                            <button
                                onClick={() => {
                                    setSelectedCategory('all');
                                    setSelectedStore('all');
                                    setPriceRange('all');
                                    setSearchQuery('');
                                }}
                                className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 ml-2 transition-colors"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Product Count */}
                <p className="text-gray-500 dark:text-gray-400 mt-4">
                    Showing <span className="text-gray-900 dark:text-white font-semibold">{filteredProducts.length}</span> of <span className="text-gray-900 dark:text-white font-semibold">{products.length}</span> products
                </p>
            </div>

            {/* Products Grid */}
            <div>
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No products found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => {
                            const stockQuantity = product.stockQuantity || 0;
                            const isOutOfStock = stockQuantity <= 0;
                            const isLowStock = stockQuantity > 0 && stockQuantity <= 5;
                            const inCartQuantity = getItemQuantity(product.asin);
                            const canAddMore = stockQuantity > inCartQuantity;

                            // Calculate dynamic ranking
                            const rankedProducts = getProductsRankedByScore(products);
                            const dynamicRank = rankedProducts.findIndex(p => p.asin === product.asin) + 1;

                            return (
                                <div
                                    key={product.asin}
                                    className={`group bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-lg transition-all duration-300 ${
                                        isOutOfStock ? 'opacity-75' :''
                                    }`}
                                >
                                    {/* Image Section */}
                                    <Link to={`${shopBasePath}/product/${product.asin}`} className="block relative">
                                        <div className="aspect-square overflow-hidden bg-white relative">
                                            {product.imageUrl ?  (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 ${
                                                        isOutOfStock ? 'grayscale' :''
                                                    }`}
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/300? text=No+Image';
                                                    }}
                                                />
                                            ) :(
                                                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                                                    <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}

                                            {/* Out of Stock Overlay */}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                                    <span className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg shadow-lg">
                                                        OUT OF STOCK
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Badges - Top Left */}
                                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                            {dynamicRank <= 10 && (
                                                <span className="px-2.5 py-1 bg-yellow-500 text-white text-xs font-bold rounded-full shadow-lg">
                                                    Top {dynamicRank}
                                                </span>
                                            )}
                                            {product.isBestseller && (
                                                <span className="px-2.5 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg">
                                                    Best Seller
                                                </span>
                                            )}
                                            {isLowStock && ! isOutOfStock && (
                                                <span className="px-2.5 py-1 bg-red-500/90 text-white text-xs font-bold rounded-full shadow-lg">
                                                    ⚠️ {stockQuantity} left
                                                </span>
                                            )}
                                        </div>

                                        {/* In Cart Badge - Top Right */}
                                        {isInCart(product.asin) && (
                                            <div className="absolute top-3 right-3 px-2.5 py-1 bg-green-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                {inCartQuantity}
                                            </div>
                                        )}
                                    </Link>
                                    <div className="p-4">
                                        {/* Category */}
                                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                            {product.categoryName || 'Uncategorized'}
                                        </p>
                                        <div className="mb-2">
                                            <button
                                                onClick={() => setSelectedStore(! product.sellerId ? 'mouadvision' :(product.sellerName || 'all'))}
                                                className="inline-flex items-center hover:opacity-80 transition-opacity"
                                            >
                                                {! product.sellerId ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                                                        🏢 MouadVision
                                                    </span>
                                                ) :(
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">
                                                        👤 {product.sellerName || 'Seller'}
                                                    </span>
                                                )}
                                            </button>
                                        </div>
                                        <Link to={`${shopBasePath}/product/${product.asin}`}>
                                            <h3 className="text-gray-900 dark:text-white font-semibold line-clamp-2 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
                                                {product.productName}
                                            </h3>
                                        </Link>

                                        {/* Rating & Reviews */}
                                        <div className="flex items-center gap-2 mb-3">
                                            {product.rating && (
                                                <div className="flex items-center gap-1">
                                                    <span className="text-yellow-500">★</span>
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">{product.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                            {product.reviewsCount && (
                                                <span className="text-sm text-gray-500">
                                                    ({product.reviewsCount.toLocaleString()} reviews)
                                                </span>
                                            )}
                                        </div>

                                        {/* Price & Stock */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-xl font-bold text-gray-900 dark:text-white">
                                                ${product.price.toFixed(2)}
                                            </span>
                                            {! isOutOfStock && stockQuantity <= 10 && (
                                                <span className={`text-xs font-medium ${
                                                    isLowStock ? 'text-orange-500' :'text-gray-500'
                                                }`}>
                                                    {stockQuantity} in stock
                                                </span>
                                            )}
                                        </div>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={() => handleAddToCart(product)}
                                            disabled={isOutOfStock || ! canAddMore}
                                            className={`w-full px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${
                                                isOutOfStock
                                                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                    :! canAddMore
                                                        ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 cursor-not-allowed'
                                                        :'bg-blue-600 hover:bg-blue-700 text-white'
                                            }`}
                                        >
                                            {isOutOfStock
                                                ? '❌ Out of Stock'
                                                :! canAddMore
                                                    ? `✓ Max in Cart (${inCartQuantity}/${stockQuantity})`
                                                    :isInCart(product.asin)
                                                        ? `+ Add More (${inCartQuantity} in cart)`
                                                        :'🛒 Add to Cart'
                                            }
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ShopPage;