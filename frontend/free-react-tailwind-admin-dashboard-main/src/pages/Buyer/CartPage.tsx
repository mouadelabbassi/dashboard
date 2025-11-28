import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, removeFromCart, updateQuantity, clearCart, getSubtotal } = useCart();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleQuantityChange = (asin: string, newQuantity: number) => {
        if (newQuantity < 1) {
            removeFromCart(asin);
            setToast({ message: 'Item removed from cart', type: 'success' });
        } else {
            updateQuantity(asin, newQuantity);
        }
    };

    const handleRemoveItem = (asin: string, productName: string) => {
        removeFromCart(asin);
        setToast({ message: `${productName. substring(0, 30)}... removed`, type: 'success' });
    };

    const handleClearCart = () => {
        if (window.confirm('Are you sure you want to clear your cart?')) {
            clearCart();
            setToast({ message: 'Cart cleared', type: 'success' });
        }
    };

    const subtotal = getSubtotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (items.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't added anything yet.</p>
                <Link
                    to="/shop"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    Shopping Cart
                    <span className="ml-2 text-lg font-normal text-gray-500">({items.length} items)</span>
                </h1>
                <button
                    onClick={handleClearCart}
                    className="text-red-500 hover:text-red-600 font-medium flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-. 867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Clear Cart
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.product.asin}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex gap-4"
                        >
                            {/* Product Image */}
                            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                {item.product.imageUrl ?  (
                                    <img
                                        src={item. product.imageUrl}
                                        alt={item.product. productName}
                                        className="w-full h-full object-contain"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4. 586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1. 586a2 2 0 012. 828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                                <Link
                                    to={`/product/${item.product. asin}`}
                                    className="text-lg font-semibold text-gray-900 dark:text-white hover:text-blue-600 line-clamp-2"
                                >
                                    {item.product.productName}
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">ASIN: {item.product.asin}</p>
                                <div className="flex items-center gap-1 mt-2">
                                    <span className="text-yellow-400">★</span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400">{item.product. rating || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Quantity & Price */}
                            <div className="flex flex-col items-end justify-between">
                                <p className="text-xl font-bold text-gray-900 dark:text-white">
                                    ${((item.product.price || 0) * item.quantity).toFixed(2)}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleQuantityChange(item. product.asin, item.quantity - 1)}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="w-12 text-center font-semibold text-gray-900 dark:text-white">{item.quantity}</span>
                                    <button
                                        onClick={() => handleQuantityChange(item. product. asin, item. quantity + 1)}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleRemoveItem(item.product.asin, item.product.productName)}
                                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal</span>
                                <span>${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Tax (10%)</span>
                                <span>${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Shipping</span>
                                <span className="text-green-500">Free</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>${total. toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            Proceed to Checkout
                        </button>

                        <Link
                            to="/shop"
                            className="w-full mt-3 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                            </svg>
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
