import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartPage: React.FC = () => {
    const { items, updateQuantity, removeFromCart, getTotal } = useCart();
    const navigate = useNavigate();
    const location = useLocation();

    const subtotal = getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    // Determine if we're in seller context or buyer context
    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ? '/seller/shop' : '/shop';

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <svg className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Looks like you haven't added any items yet</p>
                <Link
                    to={shopBasePath}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    Start Shopping
                </Link>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Shopping Cart</h1>
                <p className="text-gray-500 dark:text-gray-400">{items.length} item(s) in your cart</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <div
                            key={item.product.asin}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex gap-4"
                        >
                            <Link to={`${shopBasePath}/product/${item.product.asin}`} className="shrink-0">
                                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                    {item.product.imageUrl ? (
                                        <img
                                            src={item.product.imageUrl}
                                            alt={item.product.productName}
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="flex-1 min-w-0">
                                <Link to={`${shopBasePath}/product/${item.product.asin}`}>
                                    <h3 className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-2">
                                        {item.product.productName}
                                    </h3>
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    ${item.product.price.toFixed(2)} each
                                </p>

                                <div className="flex items-center gap-4 mt-3">
                                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                                        <button
                                            onClick={() => updateQuantity(item.product.asin, item.quantity - 1)}
                                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                                        >
                                            −
                                        </button>
                                        <span className="px-4 py-1 text-gray-900 dark:text-white font-medium">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.product.asin, item.quantity + 1)}
                                            className="px-3 py-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                                        >
                                            +
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => removeFromCart(item.product.asin)}
                                        className="text-red-500 hover:text-red-600 text-sm font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-bold text-lg text-gray-900 dark:text-white">
                                    ${(item.product.price * item.quantity).toFixed(2)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                        <div className="space-y-3 mb-6">
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
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate(`${shopBasePath}/checkout`)}
                            className="w-full mt-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            Proceed to Checkout
                        </button>

                        <Link
                            to={shopBasePath}
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