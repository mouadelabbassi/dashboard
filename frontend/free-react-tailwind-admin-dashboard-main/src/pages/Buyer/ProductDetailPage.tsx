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
            console.error('Error fetching product:', error);
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
            navigate('/shop/cart');
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
    const sellerName = product.sellerName || 'MouadVision';

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <img
                        src={product.imageUrl || '/placeholder-product.png'}
                        alt={product.productName}
                        className="w-full h-auto object-contain rounded-xl max-h-[500px]"
                    />
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {product.productName}
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sold by: <span className="text-blue-600 dark:text-blue-400">{sellerName}</span>
                        </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <svg
                                    key={i}
                                    className={`w-5 h-5 ${i < Math.floor(product.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            ))}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                            {product.rating?.toFixed(1)} ({product.reviewsCount?.toLocaleString()} reviews)
                        </span>
                    </div>

                    {/* Price */}
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.price.toFixed(2)}
                    </div>

                    {/* Quantity & Add to Cart */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                            >
                                -
                            </button>
                            <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {inCart && (
                        <p className="text-green-600 dark:text-green-400 text-sm">
                            ✓ {cartQuantity} item(s) already in cart
                        </p>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                            Buy Now
                        </button>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;