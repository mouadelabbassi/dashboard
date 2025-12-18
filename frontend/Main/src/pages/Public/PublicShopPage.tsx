import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

interface Product {
    asin: string;
    productName: string;
    price:  number;
    rating: number;
    reviewsCount: number;
    imageUrl: string;
    categoryName: string;
    stockQuantity: number;
    sellerName: string;
}

const PublicShopPage:  React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await axios.get('http://localhost:8080/api/public/products', {
                params: { page: 0, size: 50 }
            });
            const data = response.data?.data?.content || response.data?.data || [];
            setProducts(data);
            const cats = [...new Set(data.map((p: Product) => p.categoryName).filter(Boolean))];
            setCategories(cats as string[]);
        } catch (error) {
            console.error('Error fetching products:', error);
            try {
                const fallbackResponse = await axios.get('http://localhost:8080/api/products', {
                    params: { page: 0, size: 50 }
                });
                const data = fallbackResponse.data?.data?.content || [];
                setProducts(data);
            } catch (e) {
                console.error('Fallback also failed:', e);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBuyClick = (product: Product) => {
        if (isAuthenticated) {
            if (user?.role === 'BUYER') {
                navigate(`/shop/product/${product.asin}`);
            } else if (user?.role === 'SELLER') {
                navigate(`/seller/shop/product/${product.asin}`);
            } else {
                navigate(`/shop/product/${product.asin}`);
            }
        } else {
            setShowLoginModal(true);
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.asin?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="min-h-screen bg-[#050508]">
            {/* Navbar */}
            <nav className="sticky top-0 z-50 bg-[#0a0a12]/95 backdrop-blur-xl border-b border-blue-500/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-3">
                            <img src="/images/logo/logo.png" alt="MouadVision" className="h-10 w-auto" />
                            <span className="text-xl font-bold text-white">
                                Mouad<span className="text-blue-400">Vision</span>
                            </span>
                        </Link>

                        <div className="hidden md:flex items-center gap-6">
                            <Link to="/" className="text-blue-100/60 hover:text-white transition-colors">Home</Link>
                            <Link to="/explore" className="text-white font-medium">Shop</Link>
                            <Link to="/about" className="text-blue-100/60 hover:text-white transition-colors">About</Link>
                        </div>

                        <div className="flex items-center gap-4">
                            {isAuthenticated ? (
                                <button
                                    onClick={() => {
                                        if (user?.role === 'ADMIN') navigate('/admin');
                                        else if (user?.role === 'SELLER') navigate('/seller/dashboard');
                                        else navigate('/shop');
                                    }}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                                >
                                    My Dashboard
                                </button>
                            ) : (
                                <>
                                    <Link to="/signin" className="text-blue-100/60 hover:text-white transition-colors">
                                        Sign In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <div className="bg-gradient-to-b from-blue-600/10 to-transparent border-b border-blue-500/10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Explore Our Products
                    </h1>
                    <p className="text-blue-100/50 text-lg">
                        Browse our collection of premium products. Sign in to add to cart and make purchases.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#0a0a12] rounded-2xl p-4 border border-blue-500/10">
                    <div className="relative flex-1 max-w-md">
                        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-[#050508] border border-blue-500/20 rounded-xl text-white placeholder-blue-100/30 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-[#050508] border border-blue-500/20 rounded-xl text-white focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <p className="text-blue-100/40">
                        Showing <span className="text-white font-semibold">{filteredProducts.length}</span> products
                    </p>
                </div>
            </div>

            {/* Products Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
                        <p className="text-blue-100/40">Try adjusting your search or filters</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.asin}
                                className="group bg-[#0a0a12] rounded-2xl border border-blue-500/10 overflow-hidden hover:border-blue-500/30 transition-all"
                            >
                                {/* Image */}
                                <div className="relative aspect-square overflow-hidden bg-[#050508]">
                                    {product.imageUrl ?  (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-cover group-hover: scale-110 transition-transform duration-500"
                                            onError={(e) => {
                                                e.currentTarget.src = 'https://via.placeholder.com/300? text=No+Image';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-blue-100/20">
                                            <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    {product.categoryName && (
                                        <span className="absolute top-3 left-3 px-3 py-1 bg-blue-600/90 text-white text-xs font-medium rounded-full">
                                            {product.categoryName}
                                        </span>
                                    )}
                                    {product.stockQuantity === 0 && (
                                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                            <span className="px-4 py-2 bg-red-500 text-white font-bold rounded-lg">OUT OF STOCK</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-5">
                                    <h3 className="text-white font-semibold mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                                        {product.productName}
                                    </h3>

                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-400">⭐</span>
                                            <span className="text-white font-medium">{product.rating?.toFixed(1) || '0.0'}</span>
                                        </div>
                                        <span className="text-blue-100/30">•</span>
                                        <span className="text-blue-100/40 text-sm">{product.reviewsCount || 0} reviews</span>
                                    </div>

                                    {product.sellerName && (
                                        <p className="text-blue-100/30 text-sm mb-3">
                                            Sold by: <span className="text-blue-100/50">{product.sellerName}</span>
                                        </p>
                                    )}

                                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-blue-500/10">
                                        <span className="text-2xl font-bold text-green-400">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                        <button
                                            onClick={() => handleBuyClick(product)}
                                            disabled={product.stockQuantity === 0}
                                            className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                                product.stockQuantity === 0
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-500 text-white'
                                            }`}
                                        >
                                            {product.stockQuantity === 0 ? 'Sold Out' : 'Buy Now'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* 🆕 Browse More Products Card */}
                        <Link
                            to="/signup"
                            className="group bg-gradient-to-br from-blue-600/20 to-blue-500/5 rounded-2xl border-2 border-dashed border-blue-500/30 overflow-hidden hover:border-blue-400 hover:from-blue-600/30 hover:to-blue-500/10 transition-all flex flex-col items-center justify-center min-h-[400px] cursor-pointer"
                        >
                            <div className="text-center p-8">
                                {/* Cart Icon */}
                                <div className="w-24 h-24 mx-auto mb-6 bg-blue-600/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600/30 transition-all">
                                    <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>

                                {/* Text */}
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    Want to Browse More?
                                </h3>
                                <p className="text-blue-100/50 mb-6 max-w-[200px] mx-auto">
                                    Create a free account to unlock full access and start shopping!
                                </p>

                                {/* CTA Button */}
                                <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all group-hover:shadow-lg group-hover:shadow-blue-500/25">
                                    <span>Sign Up Now</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </div>

                                {/* Features */}
                                <div className="mt-6 flex flex-col gap-2 text-sm text-blue-100/40">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Free account</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Secure checkout</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-green-400">✓</span>
                                        <span>Order tracking</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>
                )}
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-[#0a0a12] rounded-3xl p-8 max-w-md w-full mx-4 border border-blue-500/20 shadow-2xl">
                        <div className="text-center">
                            <h3 className="text-2xl font-bold text-white mb-3">
                                Sign In Required
                            </h3>
                            <p className="text-blue-100/50 mb-8">
                                Please sign in to your account to add items to cart and make purchases.
                            </p>
                            <div className="flex flex-col gap-3">
                                <Link
                                    to="/signin"
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    to="/signup"
                                    className="w-full py-3 bg-blue-500/10 border border-blue-500/30 text-white font-semibold rounded-xl hover: bg-blue-500/20 transition-all"
                                >
                                    Create Account
                                </Link>
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="w-full py-3 text-blue-100/50 hover:text-white transition-colors"
                                >
                                    Continue Browsing
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="border-t border-blue-500/10 py-8 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg: px-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <img src="/images/logo/logo.png" alt="MouadVision" className="h-8 w-auto" />
                        <span className="font-bold text-white">Mouad<span className="text-blue-400">Vision</span></span>
                    </div>
                    <p className="text-blue-100/30 text-sm">© 2025 MouadVision. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default PublicShopPage;