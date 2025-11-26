import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { orderAPI, Order } from '../../service/api';

const OrderHistoryPage: React.FC = () => {
    const location = useLocation();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchOrders();
        
        // Show success message if redirected from checkout
        if (location.state?.showSuccess) {
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
        }
    }, [location.state]);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await orderAPI.getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Success Message */}
            {showSuccess && (
                <div className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                    <div className="flex items-center gap-2 text-green-800 dark:text-green-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">Order placed successfully! You can view it below.</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    Order History
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    View and track your orders
                </p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-900 rounded-full animate-spin border-t-purple-600"></div>
                    </div>
                    <p className="mt-4 text-gray-500 dark:text-gray-400">Loading orders...</p>
                </div>
            ) : orders.length === 0 ? (
                /* Empty State */
                <div className="text-center py-20 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
                    <div className="text-7xl mb-4">📦</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">You haven't placed any orders</p>
                </div>
            ) : (
                /* Orders List */
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800"
                        >
                            {/* Order Header */}
                            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        Order #{order.id}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(order.orderDate)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                        <p className="text-xl font-bold text-gray-900 dark:text-white">
                                            ${order.totalAmount?.toFixed(2) || '0.00'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items */}
                            <div className="space-y-3">
                                {order.items?.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-center">
                                        <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                            {item.productImageUrl && (
                                                <img
                                                    src={item.productImageUrl}
                                                    alt={item.productName}
                                                    className="w-full h-full object-contain p-2"
                                                />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                {item.productName}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Quantity: {item.quantity} × ${item.unitPrice?.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                ${item.subtotal?.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;
