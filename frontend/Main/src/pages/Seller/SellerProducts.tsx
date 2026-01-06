import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sellerService } from '../../service/sellerService';
import { Product } from '../../types/product';
import Toast from '../../components/common/Toast';
import {useAuth} from "../../context/AuthContext.tsx";

const SellerProducts:  React.FC = () => {
    const navigate = useNavigate();
    const { user, isVerifiedSeller, refreshUserData } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [showAddModal, setShowAddModal] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [deletingAsin, setDeletingAsin] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);

    useEffect(() => {
        refreshUserData();
    }, []);

    useEffect(() => {
        fetchProducts();
    }, [currentPage, statusFilter]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let data;
            if (statusFilter === 'ALL') {
                data = await sellerService.getMyProducts(currentPage, 10);
            } else {
                data = await sellerService.getMyProductsByStatus(statusFilter, currentPage, 10);
            }
            setProducts(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const styles:  Record<string, string> = {
            APPROVED: 'bg-green-100 text-green-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            APPROVED: 'Approved',
            PENDING:  'Pending',
            REJECTED: 'Rejected',
        };
        return (
            <span className={`px-2. 5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const handleAddProductClick = () => {
        if (! isVerifiedSeller) {
            setToast({
                message: 'Your account must be verified by admin before you can add products.  Please wait for verification. ',
                type: 'error'
            });
            return;
        }
        setShowAddModal(true);
    };

    const handleNewProduct = () => {
        if (!isVerifiedSeller) {
            setToast({
                message: 'Your account must be verified by admin before you can add products. ',
                type: 'error'
            });
            return;
        }
        setShowAddModal(false);
        navigate('/seller/products/new');
    };

    const handleFromStock = () => {
        if (!isVerifiedSeller) {
            setToast({
                message:  'Your account must be verified by admin before you can add products.',
                type: 'error'
            });
            return;
        }
        setShowAddModal(false);
        navigate('/seller/stock');
    };

    const handleDeleteClick = (product: Product) => {
        setProductToDelete(product);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!productToDelete) return;

        try {
            setDeletingAsin(productToDelete.asin);
            await sellerService.deleteMyProduct(productToDelete.asin);
            setToast({ message: `"${productToDelete.productName}" has been deleted successfully! `, type: 'success' });
            setShowDeleteModal(false);
            setProductToDelete(null);
            fetchProducts();
        } catch (error:  any) {
            setToast({
                message: error.response?. data?.message || 'Failed to delete product',
                type: 'error'
            });
        } finally {
            setDeletingAsin(null);
        }
    };


    return (
        <div className="p-6">
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            {! isVerifiedSeller && user?.role === 'SELLER' && (
                <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-lg">
                    <div className="flex items-start">
                        <svg className="w-6 h-6 text-yellow-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <h4 className="text-yellow-800 font-semibold">Account Pending Verification</h4>
                            <p className="text-yellow-700 text-sm mt-1">
                                Your seller account is awaiting verification by our admin team. You cannot add new products until your account is verified.  This usually takes 1-2 business days.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Products</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your products for sale
                    </p>
                </div>
                <button
                    onClick={handleAddProductClick}
                    disabled={!isVerifiedSeller}
                    className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                        isVerifiedSeller
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                    title={! isVerifiedSeller ? 'Account verification required' : 'Add Product'}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
                <div className="flex gap-2">
                    {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setStatusFilter(status);
                                setCurrentPage(0);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                statusFilter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'ALL' ?  'All' :
                                status === 'APPROVED' ? 'Approved' :
                                    status === 'PENDING' ? 'Pending' : 'Rejected'}
                        </button>
                    ))}
                </div>
            </div>
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
                    <p className="text-gray-500 mt-2">Start by adding your first product.</p>
                    <button
                        onClick={handleAddProductClick}
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Product
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <div
                            key={product.asin}
                            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden hover:shadow-lg transition"
                        >
                            <div className="relative">
                                <img
                                    src={product.imageUrl || '/placeholder-product.png'}
                                    alt={product.productName}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="absolute top-2 right-2">
                                    {getStatusBadge(product.approvalStatus)}
                                </div>
                                {product.isBestseller && (
                                    <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-0.5 rounded text-xs font-bold">
                                        Bestseller
                                    </div>
                                )}
                            </div>
                            <div className="p-4">
                                <h3 className="font-semibold text-gray-800 dark:text-white line-clamp-2 mb-2">
                                    {product.productName}
                                </h3>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-lg font-bold text-blue-600">
                                        ${product.price?.toFixed(2) || '0.00'}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                        Stock: {product.stockQuantity}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                    <span className="flex items-center">
                                        <svg className="w-4 h-4 text-yellow-400 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                        {product.rating?.toFixed(1) || '0.0'}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span>{product.reviewsCount || 0} reviews</span>
                                    <span className="mx-2">•</span>
                                    <span>{product.salesCount || 0} sales</span>
                                </div>

                                <div className="flex gap-2">
                                    <Link
                                        to={`/seller/products/${product.asin}/edit`}
                                        className="flex-1 text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition text-sm"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        to={`/seller/products/${product.asin}/edit`}
                                        className="flex-1 text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        onClick={() => handleDeleteClick(product)}
                                        disabled={deletingAsin === product.asin}
                                        className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition text-sm disabled:opacity-50"
                                        title="Delete Product"
                                    >
                                        {deletingAsin === product.asin ?  (
                                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                    <button
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                        Page {currentPage + 1} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-bold text-white">Add New Product</h3>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="text-white/80 hover:text-white transition"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                            <p className="text-blue-100 mt-2">Choose how you want to add a product</p>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleNewProduct}
                                    className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg text-left"
                                >
                                    <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-500 transition-colors">
                                        <svg className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">New Product</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        Create a brand new product by entering all the details manually
                                    </p>
                                    <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                                        Get Started
                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>

                                <button
                                    onClick={handleFromStock}
                                    className="group p-6 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-green-500 dark:hover:border-green-500 transition-all hover:shadow-lg text-left"
                                >
                                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:bg-green-500 transition-colors">
                                        <svg className="w-7 h-7 text-green-600 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">From Stock</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        List a product from your existing stock inventory with custom pricing
                                    </p>
                                    <div className="mt-4 flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                                        View Stock
                                        <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-full py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteModal && productToDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white text-center mb-2">
                                Delete Product?
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-center mb-2">
                                Are you sure you want to delete:
                            </p>
                            <p className="text-gray-900 dark:text-white font-semibold text-center mb-4">
                                "{productToDelete.productName}"
                            </p>
                            <p className="text-sm text-red-500 text-center">
                                ⚠️ This action cannot be undone. All reviews and sales data will be lost.
                            </p>
                        </div>
                        <div className="flex gap-3 p-6 pt-0">
                            <button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                    setProductToDelete(null);
                                }}
                                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                disabled={deletingAsin === productToDelete.asin}
                                className="flex-1 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {deletingAsin === productToDelete.asin ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Deleting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Product
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SellerProducts;