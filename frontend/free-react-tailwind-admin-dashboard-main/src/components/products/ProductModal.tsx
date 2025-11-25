import React, { useState, useEffect } from 'react';
import { Product, ProductCreateRequest, ProductUpdateRequest, Category, getCategories, createProduct, updateProduct } from '../../service/api';

interface ProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    product?: Product | null; // If provided, we're editing
    onSuccess: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ isOpen, onClose, product, onSuccess }) => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');

    const [formData, setFormData] = useState({
        asin: '',
        productName: '',
        description: '',
        price: '',
        imageUrl: '',
        productLink: '',
        categoryId: ''
    });

    const isEditMode = !!product;

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            const cats = await getCategories();
            setCategories(cats);
        };
        fetchCategories();
    }, []);

    // Populate form when editing
    useEffect(() => {
        if (product) {
            setFormData({
                asin: product.asin || '',
                productName: product.productName || '',
                description: product.description || '',
                price: product.price?.toString() || '',
                imageUrl: product.imageUrl || '',
                productLink: product.productLink || '',
                categoryId: product.categoryId?.toString() || ''
            });
            setImagePreview(product.imageUrl || '');
        } else {
            // Reset form for new product
            setFormData({
                asin: '',
                productName: '',
                description: '',
                price: '',
                imageUrl: '',
                productLink: '',
                categoryId: ''
            });
            setImagePreview('');
        }
    }, [product, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Update image preview
        if (name === 'imageUrl') {
            setImagePreview(value);
        }
    };

    const generateAsin = () => {
        // Generate a random ASIN-like code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let asin = 'B';
        for (let i = 0; i < 9; i++) {
            asin += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, asin }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isEditMode) {
                // Update existing product
                const updateData: ProductUpdateRequest = {
                    productName: formData.productName,
                    description: formData.description || undefined,
                    price: parseFloat(formData.price),
                    imageUrl: formData.imageUrl || undefined,
                    productLink: formData.productLink || undefined,
                    categoryId: parseInt(formData.categoryId)
                };
                await updateProduct(product!.asin, updateData);
            } else {
                // Create new product
                const createData: ProductCreateRequest = {
                    asin: formData.asin,
                    productName: formData.productName,
                    description: formData.description || undefined,
                    price: parseFloat(formData.price),
                    imageUrl: formData.imageUrl || undefined,
                    productLink: formData.productLink || undefined,
                    categoryId: parseInt(formData.categoryId)
                };
                await createProduct(createData);
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error('Error saving product:', err);
            setError(err.response?.data?.message || 'Failed to save product. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-xl">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {isEditMode ? '✏️ Edit Product' : '➕ Add New Product'}
                        </h3>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left Column */}
                            <div className="space-y-4">
                                {/* ASIN */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        ASIN {!isEditMode && <span className="text-red-500">*</span>}
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            name="asin"
                                            value={formData.asin}
                                            onChange={handleChange}
                                            disabled={isEditMode}
                                            required={!isEditMode}
                                            placeholder="e.g., B00GAC1D2G"
                                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
                                        />
                                        {!isEditMode && (
                                            <button
                                                type="button"
                                                onClick={generateAsin}
                                                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-sm"
                                            >
                                                Generate
                                            </button>
                                        )}
                                    </div>
                                    {isEditMode && (
                                        <p className="text-xs text-gray-500 mt-1">ASIN cannot be changed</p>
                                    )}
                                </div>

                                {/* Product Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="productName"
                                        value={formData.productName}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter product name"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        name="description"
                                        value={formData.description}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Enter product description"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Price ($) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                        min="0.01"
                                        step="0.01"
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Category <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="categoryId"
                                        value={formData.categoryId}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    >
                                        <option value="">Select a category</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name} ({cat.productCount} products)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Right Column */}
                            <div className="space-y-4">
                                {/* Image URL */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Image URL
                                    </label>
                                    <input
                                        type="url"
                                        name="imageUrl"
                                        value={formData.imageUrl}
                                        onChange={handleChange}
                                        placeholder="https://example.com/image.jpg"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paste a URL from the web or use a local path
                                    </p>
                                </div>

                                {/* Image Preview */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Image Preview
                                    </label>
                                    <div className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800 overflow-hidden">
                                        {imagePreview ? (
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="max-w-full max-h-full object-contain"
                                                onError={() => setImagePreview('')}
                                            />
                                        ) : (
                                            <div className="text-center text-gray-400">
                                                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <p className="text-sm">No image</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Product Link */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Product Link
                                    </label>
                                    <input
                                        type="url"
                                        name="productLink"
                                        value={formData.productLink}
                                        onChange={handleChange}
                                        placeholder="https://amazon.com/dp/..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>

                                {/* Info Box for Edit Mode */}
                                {isEditMode && (
                                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                                            ℹ️ Read-only Fields
                                        </h4>
                                        <p className="text-xs text-blue-600 dark:text-blue-400">
                                            Rank, Rating, and Reviews cannot be modified. These values are determined by customer activity.
                                        </p>
                                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">#{product?.ranking || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">Rank</p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                                <p className="text-lg font-bold text-yellow-500">⭐ {product?.rating || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">Rating</p>
                                            </div>
                                            <div className="bg-white dark:bg-gray-800 rounded p-2">
                                                <p className="text-lg font-bold text-gray-800 dark:text-white">{product?.reviewsCount?.toLocaleString() || 0}</p>
                                                <p className="text-xs text-gray-500">Reviews</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        {isEditMode ? '💾 Update Product' : '➕ Add Product'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;