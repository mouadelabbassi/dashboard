import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { createOrder, confirmOrder } from '../../service/api';
import Toast from '../../components/common/Toast';
import jsPDF from 'jspdf';

const CheckoutPage: React.FC = () => {
    const { items, getTotal, clearCart } = useCart();
    const { user } = useAuth();
    const location = useLocation();
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);
    const [orderDetails, setOrderDetails] = useState<any>(null);

    // Determine if we're in seller context or buyer context
    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ?  '/seller/shop' : '/shop';

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        paymentMethod: 'cod'
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || ''
            }));
        }
    }, [user]);

    const subtotal = getTotal();
    const tax = subtotal * 0.1;
    const total = subtotal + tax;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const generatePDFReceipt = () => {
        if (!orderDetails) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(59, 130, 246);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MouadVision', 20, 25);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Order Receipt', pageWidth - 20, 25, { align: 'right' });

        // Order Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Order #${orderDetails.orderNumber}`, 20, 55);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 63);

        // Customer Info
        let yPos = 80;
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Bill To:', 20, yPos);

        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(orderDetails.shippingAddress.fullName, 20, yPos);
        yPos += 6;
        doc.text(orderDetails.shippingAddress.email, 20, yPos);
        yPos += 6;
        doc.text(orderDetails.shippingAddress.phone, 20, yPos);
        yPos += 6;
        doc.text(`${orderDetails.shippingAddress.address}, ${orderDetails.shippingAddress.city}`, 20, yPos);
        yPos += 6;
        doc.text(orderDetails.shippingAddress.postalCode, 20, yPos);

        // Items Table Header
        yPos += 20;
        doc.setFillColor(243, 244, 246);
        doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('Item', 25, yPos);
        doc.text('Qty', 120, yPos);
        doc.text('Price', 145, yPos);
        doc.text('Total', 170, yPos);

        // Items
        yPos += 10;
        doc.setFont('helvetica', 'normal');
        orderDetails.items.forEach((item: any) => {
            const itemName = item.productName.length > 35 ? item.productName.substring(0, 35) + '...' : item.productName;
            doc.text(itemName, 25, yPos);
            doc.text(item.quantity.toString(), 125, yPos);
            doc.text(`$${item.price.toFixed(2)}`, 145, yPos);
            doc.text(`$${(item.price * item.quantity).toFixed(2)}`, 170, yPos);
            yPos += 8;
        });

        // Totals
        yPos += 10;
        doc.setDrawColor(200, 200, 200);
        doc.line(120, yPos - 5, pageWidth - 20, yPos - 5);

        doc.text('Subtotal:', 130, yPos);
        doc.text(`$${orderDetails.subtotal.toFixed(2)}`, 165, yPos, { align: 'right' });

        yPos += 8;
        doc.text('Tax (10%):', 130, yPos);
        doc.text(`$${orderDetails.tax.toFixed(2)}`, 165, yPos, { align: 'right' });

        yPos += 8;
        doc.text('Shipping:', 130, yPos);
        doc.setTextColor(34, 197, 94);
        doc.text('Free', 165, yPos, { align: 'right' });

        yPos += 12;
        doc.setDrawColor(200, 200, 200);
        doc.line(120, yPos - 5, pageWidth - 20, yPos - 5);

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Total:', 130, yPos + 3);
        doc.text(`$${orderDetails.total.toFixed(2)}`, 165, yPos + 3, { align: 'right' });

        yPos += 25;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(`Payment Method: ${orderDetails.shippingAddress.paymentMethod === 'cod' ?  'Cash on Delivery' : 'Credit/Debit Card'}`, 20, yPos);

        const footerY = doc.internal.pageSize.getHeight() - 20;
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for shopping with MouadVision!', pageWidth / 2, footerY, { align: 'center' });
        doc.text('For support, contact: support@mouadvision.com', pageWidth / 2, footerY + 7, { align: 'center' });

        doc.save(`MouadVision-Receipt-${orderDetails.orderNumber}.pdf`);
        setToast({ message: 'Receipt downloaded successfully!', type: 'success' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        try {
            const orderRequest = {
                items: items.map(item => ({
                    productAsin: item.product.asin,
                    quantity: item.quantity
                })),
                notes: `Shipping: ${formData.address}, ${formData.city}, ${formData.postalCode}`
            };

            console.log('Creating order...', orderRequest);
            const createdOrder = await createOrder(orderRequest);
            console.log('Order created:', createdOrder);

            console.log('Confirming order...', createdOrder.id);
            const confirmedOrder = await confirmOrder(createdOrder.id);
            console.log('Order confirmed:', confirmedOrder);

            const order = {
                orderNumber: confirmedOrder.orderNumber,
                items: confirmedOrder.items.map((item: any) => ({
                    productName: item.productName,
                    quantity: item.quantity,
                    price: item.unitPrice
                })),
                subtotal: subtotal,
                tax: tax,
                total: total,
                shippingAddress: formData
            };

            setOrderDetails(order);
            setOrderComplete(true);
            clearCart();
            setToast({ message: 'Order placed successfully! ', type: 'success' });

        } catch (error: any) {
            console.error('Order error:', error);
            setToast({
                message: error.response?.data?.message || 'Failed to place order. Please try again.',
                type: 'error'
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Order Complete View
    if (orderComplete && orderDetails) {
        return (
            <div className="max-w-2xl mx-auto text-center py-12">
                {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

                <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Order Confirmed! </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Thank you for your purchase.Your order number is:
                </p>

                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4 mb-8 inline-block">
                    <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                        {orderDetails.orderNumber}
                    </span>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 text-left mb-8">
                    <h3 className="font-bold text-gray-900 dark:text-white mb-4">Order Summary</h3>
                    {orderDetails.items.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <span className="text-gray-600 dark:text-gray-400">{item.productName} × {item.quantity}</span>
                            <span className="font-medium text-gray-900 dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>${orderDetails.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Tax (10%)</span>
                            <span>${orderDetails.tax.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>Shipping</span>
                            <span className="text-green-500">Free</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 dark:text-white mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <span>Total</span>
                            <span>${orderDetails.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={generatePDFReceipt}
                    className="w-full mb-4 py-4 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl font-bold hover:from-red-600 hover:to-pink-600 transition-all shadow-lg shadow-red-500/25 flex items-center justify-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF Receipt
                </button>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                        to={`${shopBasePath}/orders`}
                        className="flex-1 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        View My Orders
                    </Link>
                    <Link
                        to={shopBasePath}
                        className="flex-1 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                        </svg>
                        Continue Shopping
                    </Link>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Your cart is empty</h2>
                <Link to={shopBasePath} className="text-blue-600 hover:underline">Go to Shop</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>

            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Shipping Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Postal Code</label>
                                    <input
                                        type="text"
                                        name="postalCode"
                                        value={formData.postalCode}
                                        onChange={handleInputChange}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.product.asin} className="flex justify-between text-sm">
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {item.product.productName} × {item.quantity}
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                        ${(item.product.price * item.quantity).toFixed(2)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
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
                            <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProcessing}
                            className="w-full mt-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:from-green-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Place Order
                                </>
                            )}
                        </button>

                        <Link
                            to={`${shopBasePath}/cart`}
                            className="block text-center mt-4 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                            ← Back to Cart
                        </Link>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;