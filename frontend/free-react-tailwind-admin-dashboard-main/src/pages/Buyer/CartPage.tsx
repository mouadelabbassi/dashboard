import React from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../../context/CartContext';
import CartItemComponent from '../../components/cart/CartItem';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, updateQuantity, removeFromCart, getTotal, getItemCount } = useCart();

    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <div className="text-8xl mb-6">🛒</div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        Your Cart is Empty
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">
                        Looks like you haven't added any products yet
                    </p>
                    <Link
                        to="/shop"
                        className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium"
                    >
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Shopping Cart
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    {getItemCount()} {getItemCount() === 1 ? 'item' : 'items'} in your cart
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {items.map((item) => (
                        <CartItemComponent
                            key={item.product.asin}
                            item={item}
                            onUpdateQuantity={(quantity) => updateQuantity(item.product.asin, quantity)}
                            onRemove={() => removeFromCart(item.product.asin)}
                        />
                    ))}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Order Summary
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal ({getItemCount()} items)</span>
                                <span>${getTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Shipping</span>
                                <span className="text-green-600">FREE</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                    <span>Total</span>
                                    <span>${getTotal().toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/checkout')}
                            className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all font-medium mb-3"
                        >
                            Proceed to Checkout
                        </button>

                        <Link
                            to="/shop"
                            className="block text-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;
