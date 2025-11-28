import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductByAsin, Product } from '../../service/api';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const { addToCart, isInCart, getItemQuantity } = useCart();

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
            console. error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (newQty: number) => {
        if (newQty < 1) newQty = 1;
        if (newQty > 99) newQty = 99;
        setQuantity(newQty);
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product, quantity);
            setToast({ message: `Added ${quantity} item(s) to cart!`, type: 'success' });
            setQuantity(1);
        }
    };

    const handleBuyNow = () => {
        if (product) {
            addToCart(product, quantity);
            navigate('/cart');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Product not found</h2>
                <Link to="/shop" className="text-blue-600 hover:underline">Back to Shop</Link>
            </div>
        );
    }

    const inCart = isInCart(product.asin);
    const cartQuantity = getItemQuantity(product.asin);

    // NEW: Determine seller info
    const sellerName = product.sellerName || 'MouadVision';
    const isMouadVisionProduct = ! product.sellerId;

    return (
        <div className="max-w-6xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><Link to="/shop" className="hover:text-blue-600">Shop</Link></li>
                    <li>/</li>
                    <li className="text-gray-900 dark:text-white truncate max-w-xs">{product.productName}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden relative">
                        {product.imageUrl ?  (
                            <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4. 586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {product.ranking && product.ranking <= 10 && (
                                <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full shadow-lg">
                                    🏆 Top {product.ranking}
                                </span>
                            )}
                            {product.isBestseller && (
                                <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full shadow-lg">
                                    🔥 Best Seller
                                </span>
                            )}
                        </div>

                        {inCart && (
                            <div className="absolute top-4 right-4 px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full shadow-lg">
                                ✓ In Cart ({cartQuantity})
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Details */}
                <div className="space-y-6">
                    {/* Category */}
                    <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm font-medium rounded-full">
                        {product. categoryName || 'Uncategorized'}
                    </span>

                    {/* Title */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                        {product.productName}
                    </h1>

                    {/* NEW: Seller Info Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">Sold by:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            isMouadVisionProduct
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                            {sellerName}
                            {isMouadVisionProduct && (
                                <span className="ml-1">✓</span>
                            )}
                        </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <svg
                                    key={star}
                                    className={`w-5 h-5 ${
                                        star <= Math.round(product.rating || 0)
                                            ?  'text-yellow-400'
                                            : 'text-gray-300 dark:text-gray-600'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9. 049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1. 371 1.24. 588 1.81l-2. 8 2.034a1 1 0 00-. 364 1.118l1.07 3. 292c. 3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1. 175 0l-2.8 2. 034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-. 364-1.118L2.98 8.72c-.783-.57-. 38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3. 292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                            {product.rating?. toFixed(1) || 'N/A'}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            ({product.reviewsCount?. toLocaleString() || 0} reviews)
                        </span>
                    </div>

                    {/* Price */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">Price</p>
                        <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                            {product.price?. toLocaleString('fr-FR')} MAD
                        </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium mb-3">Quantity</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center border-2 border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                                <button
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-lg"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    min="1"
                                    max="99"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target. value) || 1)}
                                    className="w-16 text-center py-3 bg-transparent text-gray-900 dark:text-white font-semibold text-lg focus:outline-none"
                                />
                                <button
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-bold text-lg"
                                >
                                    +
                                </button>
                            </div>
                            <span className="text-gray-500 dark:text-gray-400">
                                Total: <span className="font-bold text-gray-900 dark:text-white">{((product.price || 0) * quantity).toLocaleString('fr-FR')} MAD</span>
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-. 184 1.707.707 1. 707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Buy Now
                        </button>
                    </div>

                    {/* Product Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">ASIN</span>
                            <span className="font-medium text-gray-900 dark:text-white">{product.asin}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">Ranking</span>
                            <span className="font-medium text-gray-900 dark:text-white">#{product.ranking || 'N/A'}</span>
                        </div>
                        {/* NEW: Seller info in details */}
                        <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                            <span className="text-gray-500 dark:text-gray-400">Seller</span>
                            <span className="font-medium text-gray-900 dark:text-white">{sellerName}</span>
                        </div>
                        <div className="flex justify-between py-2">
                            <span className="text-gray-500 dark:text-gray-400">Stock</span>
                            <span className={`font-medium ${product.stockQuantity && product.stockQuantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {product.stockQuantity && product.stockQuantity > 0 ?  `${product.stockQuantity} available` : 'Out of Stock'}
                            </span>
                        </div>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {product. description}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;
