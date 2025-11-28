import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerService } from '../../service/sellerService';
import { Product } from '../../types/product';

const SellerProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');

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
        const styles: Record<string, string> = {
            APPROVED: 'bg-green-100 text-green-800',
            PENDING: 'bg-yellow-100 text-yellow-800',
            REJECTED: 'bg-red-100 text-red-800',
        };
        const labels: Record<string, string> = {
            APPROVED: 'Approved',
            PENDING: 'Pending',
            REJECTED: 'Rejected',
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Products</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your products for sale
                    </p>
                </div>
                <Link
                    to="/seller/products/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </Link>
            </div>

            {/* Filters */}
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

            {/* Products Grid */}
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
                    <Link
                        to="/seller/products/new"
                        className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Add Product
                    </Link>
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
                                    {/* CHANGED: MAD to Dollar */}
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
                                    {/* FIXED: Changed link to edit page since there's no detail view route */}
                                    <Link
                                        to={`/seller/products/${product.asin}/edit`}
                                        className="flex-1 text-center py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 transition text-sm"
                                    >
                                        View Details
                                    </Link>
                                    <Link
                                        to={`/seller/products/${product.asin}/edit`}
                                        className="flex-1 text-center py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
                                    >
                                        Edit
                                    </Link>
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
        </div>
    );
};

export default SellerProducts;