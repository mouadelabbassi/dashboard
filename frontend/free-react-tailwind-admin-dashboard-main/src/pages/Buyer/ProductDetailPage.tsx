import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { getProductByAsin, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const { addToCart, isInCart, getItemQuantity } = useCart();
    const location = useLocation();

    // Determine if we're in seller context or buyer context
    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ? '/seller/shop' : '/shop';

    useEffect(() => {
        if (asin) {
            fetchProduct();
        }
    }, [asin]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const data = await getProductByAsin(asin! );
            setProduct(data);
        } catch (error) {
            console.error('Error fetching product:', error);
            setToast({ message: 'Failed to load product', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            for (let i = 0; i < quantity; i++) {
                addToCart(product);
            }
            setToast({ message: `Added ${quantity} item(s) to cart! `, type: 'success' });
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Product not found</h2>
                <Link to={shopBasePath} className="text-blue-600 hover:underline">Back to Shop</Link>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><Link to={shopBasePath} className="hover:text-blue-600">Shop</Link></li>
                    <li>/</li>
                    <li className="text-gray-900 dark:text-white truncate max-w-xs">{product.productName}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {product.imageUrl ?  (
                            <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {product.ranking && product.ranking <= 10 && (
                            <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                                🏆 Top {product.ranking}
                            </span>
                        )}
                        {product.isBestseller && (
                            <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
                                Best Seller
                            </span>
                        )}
                        {isInCart(product.asin) && (
                            <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                                ✓ In Cart ({getItemQuantity(product.asin)})
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {product.categoryName || 'Uncategorized'}
                    </p>

                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {product.productName}
                    </h1>

                    {/* Seller Info */}
                    <div className="mb-4">
                        {!product.sellerId ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                🏪 Sold by MouadVision
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                👤 Sold by {product.sellerName || 'Verified Seller'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        {product.rating && (
                            <div className="flex items-center">
                                <div className="flex">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i} className={i < Math.round(product.rating!) ? 'text-yellow-500' : 'text-gray-300'}>
                                            ★
                                        </span>
                                    ))}
                                </div>
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {product.rating.toFixed(1)}
                                </span>
                            </div>
                        )}
                        {product.reviewsCount && (
                            <span className="text-gray-500 dark:text-gray-400">
                                {product.reviewsCount.toLocaleString()} reviews
                            </span>
                        )}
                    </div>

                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        ${product.price.toFixed(2)}
                    </div>

                    {product.description && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                            >
                                −
                            </button>
                            <span className="px-6 py-2 text-gray-900 dark:text-white font-medium">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={handleAddToCart}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </button>
                    </div>

                    <Link
                        to={`${shopBasePath}/cart`}
                        className="block w-full py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 transition-all text-center"
                    >
                        View Cart
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;