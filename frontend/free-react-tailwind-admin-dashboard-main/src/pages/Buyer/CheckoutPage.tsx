import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderAPI, OrderRequest } from '../../service/api';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { items, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect if cart is empty
    useEffect(() => {
        if (items.length === 0) {
            navigate('/cart');
        }
    }, [items.length, navigate]);

    const handleConfirmOrder = async () => {
        try {
            setLoading(true);
            setError('');

            const orderRequest: OrderRequest = {
                items: items.map(item => ({
                    productAsin: item.product.asin,
                    quantity: item.quantity
                }))
            };

            const order = await orderAPI.createOrder(orderRequest);
            
            // Clear cart after successful order
            clearCart();

            // Navigate to order confirmation/history
            navigate('/order-history', { 
                state: { 
                    orderId: order.id,
                    showSuccess: true 
                } 
            });
        } catch (err: any) {
            console.error('Error creating order:', err);
            setError(err.response?.data?.message || 'Failed to create order. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Checkout
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Review your order before confirming
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Order Details */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Customer Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.fullName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                                <p className="text-gray-900 dark:text-white font-medium">{user?.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Order Items
                        </h2>
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div key={item.product.asin} className="flex gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                                    <div className="w-20 h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                        {item.product.imageUrl && (
                                            <img
                                                src={item.product.imageUrl}
                                                alt={item.product.productName}
                                                className="w-full h-full object-contain p-2"
                                            />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                                            {item.product.productName}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Quantity: {item.quantity} × ${item.product.price?.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            ${((item.product.price || 0) * item.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                            Order Summary
                        </h2>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Subtotal ({items.length} items)</span>
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
                            onClick={handleConfirmOrder}
                            disabled={loading}
                            className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg hover:shadow-green-500/30 transition-all font-medium mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                'Confirm Order'
                            )}
                        </button>

                        <button
                            onClick={() => navigate('/cart')}
                            className="w-full text-center text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
