import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder } from '../../service/api';
import Toast from '../../components/common/Toast';
import jsPDF from 'jspdf';

interface OrderResult {
    id: number;
    orderNumber: string;
    totalAmount: number;
    totalItems: number;
    status: string;
    orderDate: string;
    items: Array<{
        productName: string;
        quantity: number;
        unitPrice: number;
        subtotal: number;
    }>;
}

const CheckoutPage: React.FC = () => {
    useNavigate();
    const { user } = useAuth();
    const { items, getSubtotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
    const [notes, setNotes] = useState('');

    const subtotal = getSubtotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const handlePlaceOrder = async () => {
        if (items.length === 0) {
            setToast({ message: 'Your cart is empty', type: 'error' });
            return;
        }

        setLoading(true);

        try {
            const orderRequest = {
                items: items.map(item => ({
                    productAsin: item.product.asin,
                    quantity: item.quantity
                })),
                notes: notes || undefined
            };

            const response = await createOrder(orderRequest);
            const confirmedOrder = await confirmOrder(response.id);

            setOrderResult(confirmedOrder);
            setOrderComplete(true);
            clearCart();
            setToast({ message: 'Order placed successfully!', type: 'success' });
        } catch (error: any) {
            console.error('Order error:', error);
            setToast({ message: error.message || 'Failed to place order', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const confirmOrder = async (orderId: number) => {
        const response = await fetch(`http://localhost:8080/api/orders/${orderId}/confirm`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response. json();
        return data. data;
    };

    // PDF Receipt Generation
    const generatePDFReceipt = () => {
        if (!orderResult) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Colors
        const darkColor: [number, number, number] = [31, 41, 55];
        const grayColor: [number, number, number] = [107, 114, 128];
        const greenColor: [number, number, number] = [34, 197, 94];

        // Header with gradient effect

        // Order Info Box
        doc.setFillColor(249, 250, 251);
        doc.roundedRect(15, 55, pageWidth - 30, 35, 3, 3, 'F');

        doc.setTextColor(... darkColor);
        doc.setFontSize(10);
        doc. setFont('helvetica', 'bold');
        doc. text('Order Number:', 25, 67);
        doc. text('Date:', 25, 77);
        doc. text('Status:', 25, 87);

        doc.setFont('helvetica', 'normal');
        doc.text(orderResult.orderNumber, 75, 67);
        doc. text(new Date(orderResult. orderDate).toLocaleString(), 75, 77);

        // Status badge
        doc.setFillColor(...greenColor);
        doc.roundedRect(75, 82, 30, 7, 2, 2, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc. text('CONFIRMED', 78, 87);

        // Customer Info
        doc.setTextColor(...darkColor);
        doc.setFontSize(14);
        doc. setFont('helvetica', 'bold');
        doc. text('Customer Information', 20, 105);

        doc.setDrawColor(229, 231, 235);
        doc.line(20, 108, pageWidth - 20, 108);

        doc.setFontSize(10);
        doc. setFont('helvetica', 'normal');
        doc.setTextColor(...grayColor);
        doc.text('Name:', 20, 118);
        doc. text('Email:', 20, 128);

        doc.setTextColor(...darkColor);
        doc.text(user?.fullName || 'N/A', 50, 118);
        doc.text(user?.email || 'N/A', 50, 128);

        // Order Items
        doc.setFontSize(14);
        doc. setFont('helvetica', 'bold');
        doc. setTextColor(...darkColor);
        doc.text('Order Items', 20, 145);

        doc.line(20, 148, pageWidth - 20, 148);

        // Table Header
        doc.setFillColor(249, 250, 251);
        doc.rect(15, 152, pageWidth - 30, 10, 'F');

        doc.setFontSize(9);
        doc. setFont('helvetica', 'bold');
        doc. setTextColor(...grayColor);
        doc.text('PRODUCT', 20, 159);
        doc. text('QTY', 130, 159);
        doc.text('PRICE', 150, 159);
        doc.text('SUBTOTAL', 175, 159);

        // Table Items
        let yPos = 170;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkColor);

        orderResult.items.forEach((item, index) => {
            if (yPos > 250) {
                doc.addPage();
                yPos = 30;
            }

            // Alternate row background
            if (index % 2 === 0) {
                doc. setFillColor(249, 250, 251);
                doc.rect(15, yPos - 5, pageWidth - 30, 12, 'F');
            }

            const productName = item. productName. length > 45
                ? item.productName.substring(0, 45) + '...'
                : item.productName;

            doc. setFontSize(9);
            doc. text(productName, 20, yPos);
            doc.text(item.quantity. toString(), 133, yPos);
            doc.text('$' + item. unitPrice.toFixed(2), 150, yPos);
            doc.text('$' + item.subtotal.toFixed(2), 175, yPos);

            yPos += 12;
        });

        // Totals
        yPos += 10;
        doc. line(120, yPos, pageWidth - 20, yPos);
        yPos += 10;

        doc.setFontSize(10);
        doc.setTextColor(...grayColor);
        doc.text('Subtotal:', 130, yPos);
        doc.setTextColor(...darkColor);
        doc.text('$' + (orderResult.totalAmount / 1.1).toFixed(2), 175, yPos);

        yPos += 8;
        doc. setTextColor(...grayColor);
        doc.text('Tax (10%):', 130, yPos);
        doc.setTextColor(...darkColor);
        doc. text('$' + (orderResult.totalAmount - orderResult.totalAmount / 1.1).toFixed(2), 175, yPos);

        yPos += 12;
        doc. setFillColor(... greenColor);
        doc.roundedRect(120, yPos - 6, 75, 14, 2, 2, 'F');
        doc. setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc. setFont('helvetica', 'bold');
        doc. text('TOTAL: $' + orderResult.totalAmount. toFixed(2), 130, yPos + 2);

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 25;
        doc. setDrawColor(229, 231, 235);
        doc.line(20, footerY - 10, pageWidth - 20, footerY - 10);

        doc.setTextColor(...grayColor);
        doc.setFontSize(10);
        doc. setFont('helvetica', 'normal');
        doc.text('Thank you for your purchase! ', pageWidth / 2, footerY, { align: 'center' });
        doc.setFontSize(8);
        doc. text('MouadVision | elabbassimouaad0@gmail.com', pageWidth / 2, footerY + 8, { align: 'center' });

        // Save the PDF
        doc. save(`MouadVision-Receipt-${orderResult.orderNumber}. pdf`);
        setToast({ message: 'PDF Receipt downloaded! ', type: 'success' });
    };

    // Order Complete View
    if (orderComplete && orderResult) {
        return (
            <div className="max-w-2xl mx-auto">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
                    {/* Success Animation */}
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-bounce">
                        <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed!  🎉</h1>
                    <p className="text-gray-500 dark:text-gray-400 mb-8">Thank you for shopping with MouadVision</p>

                    {/* Order Details Card */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 text-left mb-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                                <p className="font-bold text-gray-900 dark:text-white">{orderResult.orderNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                                <p className="font-medium text-gray-900 dark:text-white">
                                    {new Date(orderResult. orderDate).toLocaleDateString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Items</p>
                                <p className="font-medium text-gray-900 dark:text-white">{orderResult.totalItems}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                                <p className="text-2xl font-bold text-green-500">${orderResult.totalAmount.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Items Summary */}
                    <div className="text-left mb-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Items Purchased</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                            {orderResult.items.map((item, index) => (
                                <div key={index} className="flex justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[70%]">
                                        {item.productName} × {item.quantity}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">${item.subtotal.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button
                            onClick={generatePDFReceipt}
                            className="flex-1 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF Receipt
                        </button>
                        <Link
                            to="/my-orders"
                            className="flex-1 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            View My Orders
                        </Link>
                    </div>

                    <Link to="/shop" className="inline-block mt-6 text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    // Checkout View (rest of the component remains the same as before)
    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Your cart is empty</h2>
                <Link to="/shop" className="text-blue-600 hover:underline">Go to Shop</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            👤 Customer Information
                        </h2>
                        <div className="space-y-2 text-gray-600 dark:text-gray-400">
                            <p><span className="font-medium">Name:</span> {user?.fullName}</p>
                            <p><span className="font-medium">Email:</span> {user?.email}</p>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            🛒 Order Items ({items.length})
                        </h2>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                            {items.map((item) => (
                                <div key={item.product. asin} className="flex items-center gap-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                        {item.product.imageUrl && (
                                            <img src={item.product. imageUrl} alt="" className="w-full h-full object-contain" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.product.productName}</p>
                                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                    </div>
                                    <p className="font-semibold text-gray-900 dark:text-white">
                                        ${((item.product.price || 0) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">📝 Order Notes (Optional)</h2>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any special instructions..."
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                {/* Right Column - Order Summary */}
                <div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 sticky top-4">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                                <span className="text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Tax (10%)</span>
                                <span className="text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                                <span className="text-green-500 font-medium">FREE</span>
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex justify-between text-xl font-bold">
                                    <span className="text-gray-900 dark:text-white">Total</span>
                                    <span className="text-green-500">${total.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handlePlaceOrder}
                            disabled={loading}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-500/25"
                        >
                            {loading ?  (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5. 373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    ✓ Place Order - ${total.toFixed(2)}
                                </>
                            )}
                        </button>

                        <Link to="/cart" className="block text-center mt-4 text-blue-600 dark:text-blue-400 hover:underline">
                            ← Back to Cart
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;