import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../../service/api';

interface OrderItem {
    id: number;
    productAsin: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

interface Order {
    id: number;
    orderNumber: string;
    status: string;
    statusDescription: string;
    totalAmount: number;
    totalItems: number;
    orderDate: string;
    items: OrderItem[];
}

const OrderHistoryPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getMyOrders();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'CANCELLED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
            case 'SHIPPED':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
            case 'DELIVERED':
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="text-center py-16">
                <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">No orders yet</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">Start shopping to see your orders here! </p>
                <Link
                    to="/shop"
                    className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    Browse Products
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">My Orders</h1>

            <div className="space-y-4">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                    >
                        {/* Order Header */}
                        <div
                            className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => setExpandedOrder(expandedOrder === order.id ?  null : order.id)}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{order.orderNumber}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(order.orderDate).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order. status)}`}>
                                        {order.statusDescription}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${order. totalAmount.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.totalItems} items</p>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order. id ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Order Items (Expandable) */}
                        {expandedOrder === order.id && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30">
                                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                                <div className="space-y-3">
                                    {order.items. map((item) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.productImage ?  (
                                                    <img src={item.productImage} alt={item. productName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4. 586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1. 586a2 2 0 012. 828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`/product/${item.productAsin}`}
                                                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 line-clamp-1"
                                                >
                                                    {item.productName}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    ${item.unitPrice.toFixed(2)} × {item.quantity}
                                                </p>
                                            </div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                ${item.subtotal.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderHistoryPage;
