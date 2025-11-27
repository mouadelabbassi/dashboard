import React, { useEffect, useState } from 'react';
import { adminService } from '../../service/adminService';
import { PendingProduct } from '../../types/admin';

const ProductApprovals: React.FC = () => {
    const [pendingProducts, setPendingProducts] = useState<PendingProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState<PendingProduct | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');
    const [rejectionReason, setRejectionReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchPendingProducts();
    }, [currentPage]);

    const fetchPendingProducts = async () => {
        try {
            setLoading(true);
            const data = await adminService.getPendingProducts(currentPage, 10);
            setPendingProducts(data.content);
            setTotalPages(data.totalPages);
            setTotalElements(data. totalElements);
        } catch (error) {
            console. error('Error fetching pending products:', error);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (product: PendingProduct, action: 'approve' | 'reject') => {
        setSelectedProduct(product);
        setModalAction(action);
        setRejectionReason('');
        setAdminNotes('');
        setShowModal(true);
    };

    const handleAction = async () => {
        if (! selectedProduct) return;

        if (modalAction === 'reject' && ! rejectionReason. trim()) {
            alert('Veuillez indiquer une raison de rejet');
            return;
        }

        try {
            setActionLoading(true);
            if (modalAction === 'approve') {
                await adminService. approveProduct(selectedProduct.id, { adminNotes });
            } else {
                await adminService.rejectProduct(selectedProduct.id, {
                    rejectionReason,
                    adminNotes
                });
            }
            setShowModal(false);
            fetchPendingProducts();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Approbation des Produits
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {totalElements} produit(s) en attente d'approbation
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : pendingProducts.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        Aucun produit en attente
                    </h3>
                    <p className="text-gray-500 mt-2">
                        Tous les produits ont été traités.  Revenez plus tard.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {pendingProducts.map((product) => (
                        <div
                            key={product. id}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden"
                        >
                            <div className="p-6">
                                <div className="flex flex-col lg:flex-row gap-6">
                                    {/* Product Image */}
                                    <div className="lg:w-48 flex-shrink-0">
                                        <img
                                            src={product.imageUrl || '/placeholder-product.png'}
                                            alt={product. productName}
                                            className="w-full h-48 lg:h-full object-cover rounded-lg"
                                        />
                                    </div>

                                    {/* Product Details */}
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                                    {product.productName}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Catégorie: {product.categoryName}
                                                </p>
                                            </div>
                                            <span className="text-2xl font-bold text-blue-600">
                        {product.price. toLocaleString('fr-FR')} MAD
                      </span>
                                        </div>

                                        <p className="mt-4 text-gray-600 dark:text-gray-400 line-clamp-3">
                                            {product.description || 'Aucune description fournie'}
                                        </p>

                                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="text-gray-500">Stock:</span>
                                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {product. stockQuantity}
                        </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Soumis le:</span>
                                                <span className="ml-2 font-semibold text-gray-900 dark:text-white">
                          {new Date(product.submittedAt).toLocaleDateString('fr-FR')}
                        </span>
                                            </div>
                                        </div>

                                        {/* Seller Info */}
                                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                                Informations Vendeur
                                            </h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Nom:</span>
                                                    <span className="ml-2 text-gray-900 dark:text-white">{product.sellerName}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Boutique:</span>
                                                    <span className="ml-2 text-gray-900 dark:text-white">
                            {product.sellerStoreName || 'N/A'}
                          </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Email:</span>
                                                    <span className="ml-2 text-gray-900 dark:text-white">{product.sellerEmail}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="mt-6 flex gap-3">
                                            <button
                                                onClick={() => openModal(product, 'approve')}
                                                className="flex-1 md:flex-none px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Approuver
                                            </button>
                                            <button
                                                onClick={() => openModal(product, 'reject')}
                                                className="flex-1 md:flex-none px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center justify-center gap-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                Rejeter
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-6 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                            >
                                Précédent
                            </button>
                            <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                Page {currentPage + 1} sur {totalPages}
              </span>
                            <button
                                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= totalPages - 1}
                                className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 shadow disabled:opacity-50"
                            >
                                Suivant
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Approval/Rejection Modal */}
            {showModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
                        <div className={`p-4 ${modalAction === 'approve' ?  'bg-green-600' : 'bg-red-600'} rounded-t-xl`}>
                            <h3 className="text-xl font-bold text-white">
                                {modalAction === 'approve' ?  'Approuver le Produit' : 'Rejeter le Produit'}
                            </h3>
                        </div>
                        <div className="p-6">
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {modalAction === 'approve'
                                    ? `Êtes-vous sûr de vouloir approuver "${selectedProduct.productName}"?  Le produit sera immédiatement mis en vente. `
                                    : `Êtes-vous sûr de vouloir rejeter "${selectedProduct.productName}"?`}
                            </p>

                            {modalAction === 'reject' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Raison du rejet *
                                    </label>
                                    <textarea
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
                                        placeholder="Expliquez pourquoi le produit est rejeté..."
                                        required
                                    />
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notes administratives (optionnel)
                                </label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target. value)}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                                    placeholder="Notes internes..."
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                                    disabled={actionLoading}
                                >
                                    Annuler
                                </button>
                                <button
                                    onClick={handleAction}
                                    disabled={actionLoading}
                                    className={`px-4 py-2 text-white rounded-lg flex items-center gap-2 ${
                                        modalAction === 'approve'
                                            ? 'bg-green-600 hover:bg-green-700'
                                            : 'bg-red-600 hover:bg-red-700'
                                    } disabled:opacity-50`}
                                >
                                    {actionLoading && (
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                        </svg>
                                    )}
                                    Confirmer
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductApprovals;