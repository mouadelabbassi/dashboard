import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart, getTotal, clearCart } = useCart();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    const handleQuantityChange = (asin: string, newQuantity: number) => {
        if (newQuantity < 1) return;
        if (newQuantity > 99) return;
        updateQuantity(asin, newQuantity);
    };

    const handleRemoveItem = (asin: string, productName: string) => {
        removeFromCart(asin);
        setToast({ message: `${productName} removed from cart`, type: 'success' });
    };

    const subtotal = getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    if (items.length === 0) {
        return (
            <div className="text-center py-16">
                <div className="text-6xl mb-4">🛒</div>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">
                    Your cart is empty
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                    Looks like you haven't added any items to your cart yet.
                </p>
                <Link
                    to="/shop"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                    </svg>
                    Continue Shopping
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shopping Cart</h1>
                <button
                    onClick={() => {
                        clearCart();
                        setToast({ message: 'Cart cleared', type: 'success' });
                    }}
                    className="text-red-500 hover:text-red-600 text-sm font-medium"
                >
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
                            <img
                                src={item.product.imageUrl || '/placeholder-product.png'}
                                alt={item.product.productName}
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                                <Link
                                    to={`/shop/product/${item.product.asin}`}
                                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2"
                                >
                                    {item.product.productName}
                                </Link>
                                <p className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                                    ${item.product.price.toFixed(2)}
                                </p>
                                <div className="flex items-center gap-4 mt-2">
                                    <button
                                        onClick={() => handleQuantityChange(item.product.asin, item.quantity - 1)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                        </svg>
                                    </button>
                                    <span className="font-semibold text-gray-900 dark:text-white w-8 text-center">
                                        {item.quantity}
                                    </span>
                                    <button
                                        onClick={() => handleQuantityChange(item.product.asin, item.quantity + 1)}
                                        className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </button>
                                </div>

                                <button
                                    onClick={() => handleRemoveItem(item.product.asin, item.product.productName)}
                                    className="text-red-500 hover:text-red-600 text-sm font-medium mt-2"
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
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/shop/checkout')}
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