import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMyOrders, OrderResponse } from '../../service/api';
import { useAuth } from '../../context/AuthContext';

const OrderHistoryPage:  React.FC = () => {
    const [orders, setOrders] = useState<OrderResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
    const [receiptOrder, setReceiptOrder] = useState<OrderResponse | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const { user } = useAuth();

    // Determine if we're in seller context or buyer context
    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ? '/seller/shop' : '/shop';

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
                return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark: text-emerald-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    // Receipt handlers
    const handleViewReceipt = (order: OrderResponse, e: React.MouseEvent) => {
        e.stopPropagation();
        setReceiptOrder(order);
    };

    const handlePrintReceipt = () => {
        const printContent = receiptRef.current;
        if (! printContent) return;

        const printWindow = window.open('', '_blank');
        if (! printWindow) return;

        printWindow.document.write(`
            <! DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${receiptOrder?.orderNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 20px;
                        color: #333;
                    }
                    .receipt { max-width: 400px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; padding-bottom: 20px; border-bottom: 2px dashed #ccc; }
                    .logo { font-size: 24px; font-weight: bold; color: #3b82f6; }
                    .order-info { margin-bottom: 20px; }
                    .order-info p { margin: 5px 0; font-size: 14px; }
                    .items { margin-bottom: 20px; }
                    .item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .item-name { font-weight: 500; }
                    .item-details { font-size: 12px; color: #666; }
                    .totals { border-top: 2px dashed #ccc; padding-top: 15px; margin-top: 15px; }
                    .total-row { display: flex; justify-content: space-between; margin: 8px 0; }
                    .grand-total { font-size: 18px; font-weight: bold; color: #16a34a; }
                    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px dashed #ccc; font-size: 12px; color: #666; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadReceipt = () => {
        if (!receiptOrder) return;

        const receiptText = `
═══════════════════════════════════════
           MOUADVISION STORE
              RECEIPT
═══════════════════════════════════════

Order #: ${receiptOrder.orderNumber}
Date: ${new Date(receiptOrder.orderDate).toLocaleString()}
Status: ${receiptOrder.statusDescription || receiptOrder.status}

───────────────────────────────────────
CUSTOMER INFORMATION
───────────────────────────────────────
Name: ${user?.fullName || receiptOrder.userName || 'Customer'}
Email: ${user?.email || receiptOrder.userEmail || ''}

───────────────────────────────────────
ORDER ITEMS
───────────────────────────────────────
${receiptOrder.items.map(item =>
            `${item.productName}
 ASIN: ${item.productAsin}
 Qty: ${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.subtotal.toFixed(2)}`
        ).join('\n\n')}

═══════════════════════════════════════
SUBTOTAL:                   $${receiptOrder.totalAmount.toFixed(2)}
TAX (0%):                 $0.00
───────────────────────────────────────
TOTAL:                    $${receiptOrder.totalAmount.toFixed(2)}
═══════════════════════════════════════

        Thank you for your purchase!
═══════════════════════════════════════
        `;

        const blob = new Blob([receiptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${receiptOrder.orderNumber}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
                    to={shopBasePath}
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
                            onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
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
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                        {order.statusDescription}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${order.totalAmount.toFixed(2)}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{order.totalItems} items</p>
                                    </div>
                                    {/* View Receipt Button */}
                                    <button
                                        onClick={(e) => handleViewReceipt(order, e)}
                                        className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                        title="View Receipt"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                    <svg
                                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedOrder === order.id ? 'rotate-180' :  ''}`}
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
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-medium text-gray-900 dark: text-white">Order Items</h4>
                                    <button
                                        onClick={(e) => handleViewReceipt(order, e)}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        View Receipt
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {order.items.map((item) => (
                                        <div key={item.id} className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-white dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.productImage ? (
                                                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-contain" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <Link
                                                    to={`${shopBasePath}/product/${item.productAsin}`}
                                                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 line-clamp-1"
                                                >
                                                    {item.productName}
                                                </Link>
                                                <p className="text-sm text-gray-500 dark: text-gray-400">
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

            {/* Receipt Modal */}
            {receiptOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Order Receipt
                            </h3>
                            <button
                                onClick={() => setReceiptOrder(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Receipt Content */}
                        <div className="overflow-y-auto max-h-[60vh] p-6" ref={receiptRef}>
                            {/* Header */}
                            <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-gray-300 dark:border-gray-600">
                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                                    MouadVision
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Online Store</p>
                            </div>

                            {/* Order Info */}
                            <div className="mb-6">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Order #:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">{receiptOrder.orderNumber}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark: text-gray-400">Date: </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {new Date(receiptOrder.orderDate).toLocaleDateString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Time:</span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        {new Date(receiptOrder.orderDate).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Status:</span>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(receiptOrder.status)}`}>
                                        {receiptOrder.statusDescription || receiptOrder.status}
                                    </span>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Customer</p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">{user?.fullName || receiptOrder.userName || 'Customer'}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || receiptOrder.userEmail || ''}</p>
                            </div>

                            {/* Items */}
                            <div className="mb-6">
                                <p className="text-sm font-medium text-gray-900 dark: text-white mb-3">Items</p>
                                <div className="space-y-3">
                                    {receiptOrder.items.map((item) => (
                                        <div key={item.id} className="flex justify-between text-sm pb-3 border-b border-gray-100 dark:border-gray-700">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {item.productName}
                                                </p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">
                                                    {item.quantity} × ${item.unitPrice.toFixed(2)}
                                                </p>
                                            </div>
                                            <p className="font-medium text-gray-900 dark:text-white ml-4">
                                                ${item.subtotal.toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-600 pt-4">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Subtotal</span>
                                    <span className="text-gray-900 dark:text-white">${receiptOrder.totalAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark: text-gray-400">Tax</span>
                                    <span className="text-gray-900 dark:text-white">$0.00</span>
                                </div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                                    <span className="text-green-600 dark:text-green-400">FREE</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold mt-4 pt-4 border-t dark:border-gray-700">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-green-600 dark:text-green-400">${receiptOrder.totalAmount.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300 dark:border-gray-600 text-center">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">Thank you for your purchase!</p>
                                <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                                    Questions? Contact elabbassimouaad0@gmail.com
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer - Actions */}
                        <div className="flex gap-3 p-4 border-t dark:border-gray-700 bg-gray-50 dark: bg-gray-900/50">
                            <button
                                onClick={handleDownloadReceipt}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white font-medium rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Download
                            </button>
                            <button
                                onClick={handlePrintReceipt}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderHistoryPage;