import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Toast from '../../components/common/Toast';

interface ProductStock {
    asin:string;
    productName:string;
    imageUrl:string;
    price:number;
    stockQuantity:number;
    categoryName:string;
    sellerName:string;
    sellerId:number | null;
    sellerEmail:string | null;
    isMouadVisionProduct:boolean;
    canAdminEdit:boolean;
    salesCount:number;
    stockStatus:'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface StockDashboard {
    totalProducts:number;
    mouadVisionProducts:number;
    sellerProducts:number;
    lowStockCount:number;
    outOfStockCount:number;
    healthyStockCount:number;
    totalUnitsInStock:number;
}

const AdminStockManagement:React.FC = () => {
    const [products, setProducts] = useState<ProductStock[]>([]);
    const [dashboard, setDashboard] = useState<StockDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [filter, setFilter] = useState<string>('all');
    const [ownerFilter, setOwnerFilter] = useState<string>('all');
    const [toast, setToast] = useState<{ message:string; type:'success' | 'error' } | null>(null);

    const [editingProduct, setEditingProduct] = useState<ProductStock | null>(null);
    const [newQuantity, setNewQuantity] = useState<number>(0);
    const [showEditModal, setShowEditModal] = useState(false);

    const [showNotifyModal, setShowNotifyModal] = useState(false);
    const [notifyingProduct, setNotifyingProduct] = useState<ProductStock | null>(null);
    const [notifyMessage, setNotifyMessage] = useState('');

    const pageSize = 20;

    const fetchDashboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/admin/stock/dashboard', {
                headers:{ Authorization:`Bearer ${token}` }
            });
            setDashboard(response.data?.data);
        } catch (error) {
            console.error('Error fetching dashboard:', error);
        }
    }, []);

    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            let url = `http://localhost:8080/api/admin/stock/products? page=${currentPage}&size=${pageSize}`;
            if (filter !== 'all') {
                url += `&filter=${filter}`;
            }
            if (ownerFilter !== 'all') {
                url += `&owner=${ownerFilter}`;
            }

            const response = await axios.get(url, {
                headers:{ Authorization:`Bearer ${token}` }
            });

            const data = response.data?.data;
            setProducts(data?.content || []);
            setTotalPages(data?.totalPages || 0);
            setTotalElements(data?.totalElements || 0);
        } catch (error) {
            console.error('Error fetching products:', error);
            setToast({ message:'Failed to load products', type:'error' });
        } finally {
            setLoading(false);
        }
    }, [currentPage, filter, ownerFilter, pageSize]);

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleFilterChange = (newFilter:string) => {
        setFilter(newFilter);
        setCurrentPage(0);
    };

    const handleOwnerFilterChange = (newOwner:string) => {
        setOwnerFilter(newOwner);
        setCurrentPage(0);
    };

    const openEditModal = (product:ProductStock) => {
        if (! product.canAdminEdit) {
            setToast({ message:'Cannot edit seller products. Send a notification instead.', type:'error' });
            return;
        }
        setEditingProduct(product);
        setNewQuantity(product.stockQuantity);
        setShowEditModal(true);
    };

    const openNotifyModal = (product:ProductStock) => {
        setNotifyingProduct(product);
        setNotifyMessage('');
        setShowNotifyModal(true);
    };

    const handleUpdateStock = async () => {
        if (! editingProduct) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/admin/stock/products/${editingProduct.asin}`,
                { quantity:newQuantity },
                { headers:{ Authorization:`Bearer ${token}` } }
            );

            setToast({ message:'Stock updated successfully! ', type:'success' });
            setShowEditModal(false);
            setEditingProduct(null);
            fetchProducts();
            fetchDashboard();
        } catch (error:any) {
            setToast({
                message:error.response?.data?.message || 'Failed to update stock',
                type:'error'
            });
        }
    };
    const handleNotifySeller = async () => {
        if (!notifyingProduct) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8080/api/admin/stock/products/${notifyingProduct.asin}/notify-seller`,
                { message:notifyMessage || null },
                { headers:{ Authorization:`Bearer ${token}` } }
            );

            setToast({ message:`Notification sent to ${notifyingProduct.sellerName}!`, type:'success' });
            setShowNotifyModal(false);
            setNotifyingProduct(null);
        } catch (error:any) {
            setToast({
                message:error.response?.data?.message || 'Failed to send notification',
                type:'error'
            });
        }
    };

    const handleNotifyAllLowStockSellers = async () => {
        if (!confirm('Send notifications to all sellers with low stock products?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                'http://localhost:8080/api/admin/stock/notify-low-stock-sellers',
                {},
                { headers:{ Authorization:`Bearer ${token}` } }
            );

            const data = response.data?.data;
            setToast({
                message:`Notified ${data?.sellersNotified} sellers about ${data?.productsAffected} products! `,
                type:'success'
            });
        } catch (error:any) {
            setToast({ message:'Failed to send notifications', type:'error' });
        }
    };

    const getStatusBadge = (status:string) => {
        switch (status) {
            case 'OUT_OF_STOCK':
                return (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 rounded-full text-xs font-medium">
                        ✕ Out of Stock
                    </span>
                );
            case 'LOW_STOCK':
                return (
                    <span className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300 rounded-full text-xs font-medium">
                        ⚠ Low Stock
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 rounded-full text-xs font-medium">
                        ✓ In Stock
                    </span>
                );
        }
    };

    return (
        <div className="space-y-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Stock Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor inventory and notify sellers about low stock
                    </p>
                </div>
                <button
                    onClick={handleNotifyAllLowStockSellers}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-sm flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    Notify All Low Stock Sellers
                </button>
            </div>

            {dashboard && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-blue-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{dashboard.totalProducts}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-purple-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">MouadVision</p>
                        <p className="text-xl font-bold text-purple-600">{dashboard.mouadVisionProducts}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-cyan-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Seller Products</p>
                        <p className="text-xl font-bold text-cyan-600">{dashboard.sellerProducts}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-indigo-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Total Units</p>
                        <p className="text-xl font-bold text-indigo-600">{dashboard.totalUnitsInStock?.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-green-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Healthy</p>
                        <p className="text-xl font-bold text-green-600">{dashboard.healthyStockCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-yellow-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Low Stock</p>
                        <p className="text-xl font-bold text-yellow-600">{dashboard.lowStockCount}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border-l-4 border-red-500">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">Out of Stock</p>
                        <p className="text-xl font-bold text-red-600">{dashboard.outOfStockCount}</p>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 space-y-4">
                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">Owner:</span>
                    {[
                        { value:'all', label:'All Products' },
                        { value:'mouadvision', label:'🏢 MouadVision' },
                        { value:'sellers', label:'👤 Sellers' }
                    ].map((o) => (
                        <button
                            key={o.value}
                            onClick={() => handleOwnerFilterChange(o.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                ownerFilter === o.value
                                    ? 'bg-dark-600 text-white'
                                    :'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            {o.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">Status:</span>
                    {[
                        { value:'all', label:'All', color:'blue' },
                        { value:'healthy', label:'✓ In Stock', color:'green' },
                        { value:'low', label:'⚠ Low', color:'yellow' },
                        { value:'out', label:'✕ Out', color:'red' }
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => handleFilterChange(f.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                                filter === f.value
                                    ? f.value === 'all' ? 'bg-blue-600 text-white'
                                        :f.value === 'healthy' ? 'bg-green-600 text-white'
                                            :f.value === 'low' ? 'bg-yellow-500 text-white'
                                                :'bg-red-600 text-white'
                                    :'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400">
                Showing {products.length} of {totalElements} products
                {ownerFilter === 'mouadvision' && <span className="ml-2 text-purple-600">(MouadVision - Editable)</span>}
                {ownerFilter === 'sellers' && <span className="ml-2 text-cyan-600">(Seller Products - Notify Only)</span>}
            </div>

            {loading ?  (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) :products.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                </div>
            ) :(
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Owner</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Stock</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map((product) => (
                                <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <img
                                                className="h-10 w-10 rounded-lg object-cover"
                                                src={product.imageUrl || '/placeholder-product.png'}
                                                alt={product.productName}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[250px]">
                                                    {product.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">{product.asin}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        {product.isMouadVisionProduct ? (
                                            <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 rounded text-xs font-medium">
                                                    🏢 MouadVision
                                                </span>
                                        ) :(
                                            <span className="inline-flex items-center px-2 py-1 bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300 rounded text-xs font-medium">
                                                    👤 {product.sellerName}
                                                </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                            <span className={`text-lg font-bold ${
                                                product.stockQuantity === 0 ? 'text-red-600'
                                                    :product.stockQuantity < 10 ? 'text-yellow-600'
                                                        :'text-green-600'
                                            }`}>
                                                {product.stockQuantity}
                                            </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {getStatusBadge(product.stockStatus)}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {product.canAdminEdit ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(product)}
                                                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700"
                                                    >
                                                        Edit
                                                    </button>
                                                </>
                                            ) :(
                                                <button
                                                    onClick={() => openNotifyModal(product)}
                                                    className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-medium hover:bg-orange-600 flex items-center gap-1"
                                                >
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                    Notify Seller
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50 text-sm"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400 text-sm">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50 text-sm"
                    >
                        Next
                    </button>
                </div>
            )}

            {showEditModal && editingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Update Stock</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="flex gap-3 mb-4">
                            <img src={editingProduct.imageUrl || '/placeholder-product.png'} alt="" className="w-14 h-14 rounded-lg object-cover" />
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2">{editingProduct.productName}</p>
                                <p className="text-xs text-gray-500">Current:{editingProduct.stockQuantity}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setNewQuantity(Math.max(0, newQuantity - 10))} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">-10</button>
                                <input
                                    type="number"
                                    min="0"
                                    value={newQuantity}
                                    onChange={(e) => setNewQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                                    className="flex-1 px-4 py-2 text-center text-xl font-bold border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                                />
                                <button onClick={() => setNewQuantity(newQuantity + 10)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">+10</button>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[0, 10, 25, 50, 100, 200].map((qty) => (
                                    <button
                                        key={qty}
                                        onClick={() => setNewQuantity(qty)}
                                        className={`px-3 py-1 rounded-lg text-sm ${newQuantity === qty ?  'bg-blue-600 text-white' :'bg-gray-100 dark:bg-gray-700'}`}
                                    >
                                        {qty}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleUpdateStock} className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">Update</button>
                        </div>
                    </div>
                </div>
            )}

            {showNotifyModal && notifyingProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notify Seller</h3>
                            <button onClick={() => setShowNotifyModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{notifyingProduct.productName}</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Seller:<span className="font-medium">{notifyingProduct.sellerName}</span>
                            </p>
                            <p className="text-xs text-gray-500">
                                Current Stock:<span className={`font-bold ${notifyingProduct.stockQuantity === 0 ? 'text-red-600' :'text-yellow-600'}`}>
                                    {notifyingProduct.stockQuantity}
                                </span>
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Custom Message (Optional)
                            </label>
                            <textarea
                                rows={3}
                                value={notifyMessage}
                                onChange={(e) => setNotifyMessage(e.target.value)}
                                placeholder="Leave empty for default message..."
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowNotifyModal(false)} className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm">Cancel</button>
                            <button onClick={handleNotifySeller} className="flex-1 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600 flex items-center justify-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Send Notification
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStockManagement;