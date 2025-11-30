import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    userId: number;
    userName: string;
    userEmail: string;
    status: string;
    statusDescription: string;
    totalAmount: number;
    totalItems: number;
    orderDate: string;
    confirmedAt: string | null;
    items: OrderItem[];
}

const AdminOrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/orders', {
                headers: { Authorization: `Bearer ${token}` },
                params: { page: 0, size: 50 }
            });
            setOrders(response.data.data.content || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
            case 'CANCELLED': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
            case 'DELIVERED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">All Orders</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Manage and view all customer orders
                </p>
            </div>

            {orders.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center">
                    <span className="text-6xl">📭</span>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">
                        No orders yet
                    </h3>
                    <p className="text-gray-500 mt-2">
                        Orders will appear here when customers make purchases.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                        >
                            <div
                                className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                            <span className="text-xl">🛒</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {order.orderNumber}
                                            </p>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {order.userName} • {order.userEmail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                            {order.statusDescription || order.status}
                                        </span>
                                        <div className="text-right">
                                            <p className="font-bold text-green-600 dark:text-green-400">
                                                ${order.totalAmount.toFixed(2)}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {order.totalItems} item(s)
                                            </p>
                                        </div>
                                        <svg
                                            className={`w-5 h-5 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {expandedOrder === order.id && (
                                <div className="border-t dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/50">
                                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Items</h4>
                                    <div className="space-y-3">
                                        {order.items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-3 rounded-lg">
                                                <img
                                                    src={item.productImage || 'https://via.placeholder.com/60'}
                                                    alt={item.productName}
                                                    className="w-16 h-16 object-contain rounded-lg"
                                                />
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {item.productName}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        ASIN: {item.productAsin}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        ${item.unitPrice.toFixed(2)} × {item.quantity}
                                                    </p>
                                                    <p className="text-green-600 font-bold">
                                                        ${item.subtotal.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700 text-sm text-gray-500">
                                        <p>Order Date: {new Date(order.orderDate).toLocaleString()}</p>
                                        {order.confirmedAt && (
                                            <p>Confirmed: {new Date(order.confirmedAt).toLocaleString()}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminOrdersPage;