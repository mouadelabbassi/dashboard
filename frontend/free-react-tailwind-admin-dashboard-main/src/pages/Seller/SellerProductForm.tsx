import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sellerService } from '../../service/sellerService';
import { ProductSubmission } from '../../types/seller';
import axios from 'axios';

interface Category {
    id: number;
    name: string;
}

const SellerProductForm: React.FC = () => {
    const navigate = useNavigate();
    const { asin } = useParams<{ asin: string }>();
    const isEditing = !!asin;

    const [formData, setFormData] = useState<ProductSubmission>({
        productName: '',
        description: '',
        price: 0,
        stockQuantity: 1,
        imageUrl: '',
        additionalImages: '',
        categoryId: 0,
    });

    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchCategories();
        if (isEditing) {
            fetchProduct();
        }
    }, [asin]);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:8080/api/categories', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCategories(response.data.data || response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchProduct = async () => {
        if (!asin) return;
        try {
            setLoading(true);
            const product = await sellerService.getMyProductByAsin(asin);
            setFormData({
                productName: product.productName,
                description: product.description || '',
                price: product.price,
                stockQuantity: product.stockQuantity,
                imageUrl: product.imageUrl || '',
                categoryId: product.categoryId,
            });
        } catch (error: any) {
            setError(error.response?.data?.message || 'Failed to load product');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (! formData.productName || !formData.price || !formData.categoryId) {
            setError('Veuillez remplir tous les champs obligatoires');
            return;
        }

        try {
            setSubmitting(true);
            if (isEditing) {
                await sellerService.updateMyProduct(asin!, formData);
                setSuccess('Produit mis à jour avec succès! ');
            } else {
                await sellerService.submitProduct(formData);
                setSuccess('Produit soumis pour approbation!  Vous serez notifié une fois approuvé.');
            }
            setTimeout(() => navigate('/seller/products'), 2000);
        } catch (error: any) {
            setError(error.response?.data?.message || 'Une erreur est survenue');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {isEditing ? 'Modifier le Produit' : 'Soumettre un Nouveau Produit'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isEditing
                        ? 'Modifiez les informations de votre produit'
                        : 'Remplissez le formulaire pour soumettre un nouveau produit à la vente. Il sera examiné par notre équipe avant publication.'}
                </p>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
                    <p className="font-medium">Erreur</p>
                    <p>{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
                    <p className="font-medium">Succès</p>
                    <p>{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Name */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Nom du Produit *
                        </label>
                        <input
                            type="text"
                            value={formData.productName}
                            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Ex: iPhone 15 Pro Max 256GB"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Décrivez votre produit en détail..."
                        />
                    </div>

                    {/* Price */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Price ($) *
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Quantité en Stock *
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={formData.stockQuantity}
                            onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Catégorie *
                        </label>
                        <select
                            value={formData.categoryId}
                            onChange={(e) => setFormData({ ...formData, categoryId: parseInt(e.target.value) })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            required
                        >
                            <option value={0}>Sélectionner une catégorie</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            URL de l'Image
                        </label>
                        <input
                            type="url"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="https://example.com/image.jpg"
                        />
                    </div>

                    {/* Image Preview */}
                    {formData.imageUrl && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Aperçu de l'Image
                            </label>
                            <img
                                src={formData.imageUrl}
                                alt="Preview"
                                className="w-48 h-48 object-cover rounded-lg border"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/placeholder-product.png';
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Submit Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/seller/products')}
                        className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {submitting && (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        )}
                        {isEditing ? 'Mettre à jour' : 'Soumettre pour Approbation'}
                    </button>
                </div>
            </form>

            {/* Info Box */}
            {! isEditing && (
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Comment ça marche?
                    </h4>
                    <ul className="mt-2 text-sm text-blue-700 dark:text-blue-400 space-y-1">
                        <li>1. Soumettez votre produit avec toutes les informations requises</li>
                        <li>2. Notre équipe examinera votre demande (généralement sous 24h)</li>
                        <li>3. Vous recevrez une notification une fois approuvé</li>
                        <li>4.Votre produit sera automatiquement mis en vente</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SellerProductForm;
