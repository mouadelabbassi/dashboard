import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Toast from '../../components/common/Toast';

interface Seller {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    storeName: string;
    storeDescription: string;
    businessAddress: string;
    isVerifiedSeller: boolean;
    isActive: boolean;
    profileImage: string;
    createdAt: string;
}

const SellerManagement: React.FC = () => {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'verified' | 'unverified'>('all');
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchSellers();
    }, [filter, currentPage]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            let url = `http://localhost:8080/api/admin/sellers? page=${currentPage}&size=10`;
            if (filter === 'verified') {
                url += '&verified=true';
            } else if (filter === 'unverified') {
                url += '&verified=false';
            }

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data?. data;
            setSellers(data?. content || []);
            setTotalPages(data?.totalPages || 0);
        } catch (error) {
            console. error('Error fetching sellers:', error);
            setToast({ message: 'Failed to load sellers', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifySeller = async (sellerId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8080/api/admin/sellers/${sellerId}/verify`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setToast({ message: 'Seller verified successfully! ', type: 'success' });
            fetchSellers();
        } catch (error) {
            setToast({ message: 'Failed to verify seller', type: 'error' });
        }
    };

    const handleUnverifySeller = async (sellerId: number) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `http://localhost:8080/api/admin/sellers/${sellerId}/unverify`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setToast({ message: 'Seller unverified successfully!', type: 'success' });
            fetchSellers();
        } catch (error) {
            setToast({ message: 'Failed to unverify seller', type: 'error' });
        }
    };

    const handleDeactivateSeller = async (sellerId: number) => {
        if (! confirm('Are you sure you want to deactivate this seller?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:8080/api/admin/sellers/${sellerId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setToast({ message: 'Seller deactivated successfully!', type: 'success' });
            fetchSellers();
        } catch (error) {
            setToast({ message: 'Failed to deactivate seller', type: 'error' });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="p-6">
            {toast && <Toast message={toast. message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Seller Management</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Manage and verify sellers on the platform
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
                <div className="flex gap-2">
                    {(['all', 'verified', 'unverified'] as const). map((status) => (
                        <button
                            key={status}
                            onClick={() => {
                                setFilter(status);
                                setCurrentPage(0);
                            }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                filter === status
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                            {status === 'all' ?  'All Sellers' :
                                status === 'verified' ?  'Verified' : 'Pending Verification'}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : sellers.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No sellers found</h3>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Seller
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Store
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Joined
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {sellers.map((seller) => (
                            <tr key={seller.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            {seller.profileImage ?  (
                                                <img
                                                    className="h-10 w-10 rounded-full object-cover"
                                                    src={seller.profileImage}
                                                    alt={seller.fullName}
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                                    {seller.fullName?. charAt(0). toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {seller. fullName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {seller.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900 dark:text-white">
                                        {seller.storeName || 'No store name'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {seller.phone || 'No phone'}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {seller.isVerifiedSeller ? (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            Verified
                                            </span>
                                    ) : (
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                            Pending
                                            </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {formatDate(seller.createdAt)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-2">
                                        {seller.isVerifiedSeller ?  (
                                            <button
                                                onClick={() => handleUnverifySeller(seller.id)}
                                                className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition text-xs"
                                            >
                                                Unverify
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleVerifySeller(seller.id)}
                                                className="px-3 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-xs"
                                            >
                                                Verify
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDeactivateSeller(seller.id)}
                                            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-xs"
                                        >
                                            Deactivate
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-2">
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
        </div>
    );
};

export default SellerManagement;