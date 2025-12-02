import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Toast from '../../components/common/Toast';

interface StockItem {
    id: number;
    originalProductAsin: string;
    originalProductName: string;
    originalProductImage: string;
    originalPrice: number;
    purchasePrice: number;
    quantity: number;
    availableQuantity: number;
    status: string;
    statusDescription: string;
    orderNumber: string;
    categoryName: string;
    purchasedAt: string;
    suggestedResalePrice: number;
    potentialProfit: number;
}

interface StockDashboard {
    totalStockItems: number;
    availableStockItems: number;
    totalUnitsInStock: number;
    totalUnitsAvailable: number;
    totalInvestment: number;
    estimatedValue: number;
    potentialProfit: number;
}

const SellerStockManagement: React.FC = () => {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [dashboard, setDashboard] = useState<StockDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
    const [showListModal, setShowListModal] = useState(false);

    // List from stock form
    const [listForm, setListForm] = useState({
        quantity: 1,
        price: 0,
        customProductName: '',
        customDescription: ''
    });

    useEffect(() => {
        fetchDashboard();
        fetchStock();
    }, [currentPage]);

    const fetchDashboard = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/seller/stock/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDashboard(response.data?.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    };

    const fetchStock = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const url = searchQuery
                ? `http://localhost:8080/api/seller/stock/search?query=${searchQuery}&page=${currentPage}&size=12`
                : `http://localhost:8080/api/seller/stock? page=${currentPage}&size=12`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data?.data;
            setStockItems(data?.content || []);
            setTotalPages(data?.totalPages || 0);
        } catch (error) {
            console.error('Error fetching stock:', error);
            setToast({ message: 'Failed to load stock', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleListFromStock = async () => {
        if (!selectedItem) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:8080/api/seller/stock/list',
                {
                    stockId: selectedItem.id,
                    quantity: listForm.quantity,
                    price: listForm.price,
                    customProductName: listForm.customProductName || null,
                    customDescription: listForm.customDescription || null
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setToast({ message: 'Product submitted for approval! ', type: 'success' });
            setShowListModal(false);
            setSelectedItem(null);
            fetchStock();
            fetchDashboard();
        } catch (error: any) {
            setToast({
                message: error.response?.data?.message || 'Failed to list product',
                type: 'error'
            });
        }
    };

    const openListModal = (item: StockItem) => {
        setSelectedItem(item);
        setListForm({
            quantity: 1,
            price: item.suggestedResalePrice,
            customProductName: '',
            customDescription: ''
        });
        setShowListModal(true);
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            IN_STOCK: 'bg-green-100 text-green-800',
            PARTIALLY_LISTED: 'bg-yellow-100 text-yellow-800',
            FULLY_LISTED: 'bg-blue-100 text-blue-800',
            OUT_OF_STOCK: 'bg-red-100 text-red-800'
        };
        const labels: Record<string, string> = {
            IN_STOCK: '✓ In Stock',
            PARTIALLY_LISTED: '⏳ Partially Listed',
            FULLY_LISTED: '📦 Fully Listed',
            OUT_OF_STOCK: '✕ Out of Stock'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Stock Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage your purchased inventory and list products for sale
                </p>
            </div>

            {/* Dashboard Cards */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                        <p className="text-blue-100 text-sm">Total Stock Items</p>
                        <p className="text-3xl font-bold mt-2">{dashboard.totalStockItems}</p>
                        <p className="text-blue-200 text-xs mt-1">
                            {dashboard.availableStockItems} available to list
                        </p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                        <p className="text-green-100 text-sm">Units Available</p>
                        <p className="text-3xl font-bold mt-2">{dashboard.totalUnitsAvailable}</p>
                        <p className="text-green-200 text-xs mt-1">Ready to list</p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                        <p className="text-purple-100 text-sm">Total Investment</p>
                        <p className="text-3xl font-bold mt-2">${dashboard.totalInvestment?.toFixed(2)}</p>
                        <p className="text-purple-200 text-xs mt-1">Purchase cost</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                        <p className="text-orange-100 text-sm">Potential Profit</p>
                        <p className="text-3xl font-bold mt-2">${dashboard.potentialProfit?.toFixed(2)}</p>
                        <p className="text-orange-200 text-xs mt-1">At 25% markup</p>
                    </div>
                </div>
            )}

            {/* Search and Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search stock..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && fetchStock()}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>
                    <Link
                        to="/seller/shop"
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Buy More Stock
                    </Link>
                </div>
            </div>

            {/* Stock Grid */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : stockItems.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Stock Items</h3>
                    <p className="text-gray-500 mb-6">Purchase products from the shop to add them to your stock</p>
                    <Link
                        to="/seller/shop"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {stockItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden hover:shadow-lg transition">
                            <div className="relative">
                                <img
                                    src={item.originalProductImage || '/placeholder-product.png'}
                                    alt={item.originalProductName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(item.status)}
                                </div>
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-2 mb-2">
                                    {item.originalProductName}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Purchase Price:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                            ${item.purchasePrice?.toFixed(2)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Available:</span>
                                        <span className="font-medium text-green-600">
                                            {item.availableQuantity} / {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Suggested Price:</span>
                                        <span className="font-medium text-blue-600">
                                            ${item.suggestedResalePrice?.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {item.availableQuantity > 0 ?  (
                                        <button
                                            onClick={() => openListModal(item)}
                                            className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 text-sm"
                                        >
                                            List for Sale
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 py-2 bg-gray-300 dark:bg-gray-600 text-gray-500 rounded-lg font-medium text-sm cursor-not-allowed"
                                        >
                                            Fully Listed
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* List from Stock Modal */}
            {showListModal && selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                List Product for Sale
                            </h3>
                            <button
                                onClick={() => setShowListModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="flex gap-4 mb-6">
                            <img
                                src={selectedItem.originalProductImage}
                                alt={selectedItem.originalProductName}
                                className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div>
                                <h4 className="font-semibold text-gray-900 dark:text-white">
                                    {selectedItem.originalProductName}
                                </h4>
                                <p className="text-sm text-gray-500">
                                    Available: {selectedItem.availableQuantity} units
                                </p>
                                <p className="text-sm text-gray-500">
                                    Purchase Price: ${selectedItem.purchasePrice?.toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedItem.availableQuantity}
                                        value={listForm.quantity}
                                        onChange={(e) => setListForm({
                                            ...listForm,
                                            quantity: parseInt(e.target.value) || 1
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Your Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={listForm.price}
                                        onChange={(e) => setListForm({
                                            ...listForm,
                                            price: parseFloat(e.target.value) || 0
                                        })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Custom Product Name (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder={selectedItem.originalProductName}
                                    value={listForm.customProductName}
                                    onChange={(e) => setListForm({
                                        ...listForm,
                                        customProductName: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Custom Description (Optional)
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Add your own description..."
                                    value={listForm.customDescription}
                                    onChange={(e) => setListForm({
                                        ...listForm,
                                        customDescription: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            {/* Profit Preview */}
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    <strong>Profit per unit:</strong> ${(listForm.price - selectedItem.purchasePrice).toFixed(2)}
                                </p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    <strong>Total profit:</strong> ${((listForm.price - selectedItem.purchasePrice) * listForm.quantity).toFixed(2)}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowListModal(false)}
                                className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleListFromStock}
                                disabled={listForm.quantity <= 0 || listForm.price <= 0}
                                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                            >
                                Submit for Approval
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerStockManagement;