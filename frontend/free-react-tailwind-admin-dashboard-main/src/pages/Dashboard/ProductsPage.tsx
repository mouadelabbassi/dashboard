import React, { useState, useEffect } from "react";
import { getAllProducts, deleteProduct, searchProducts, Product, SearchFilters, getCategories, Category } from "../../service/api";
import ProductModal from "../../components/products/ProductModal";

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const calculateProductScore = (product: Product): number => {
        const ratingScore = (product.rating || 0) * 1000;
        const salesScore = (product.salesCount || 0) * 100;
        return ratingScore + salesScore;
    };
    const getProductsWithDynamicRank = (productsList: Product[]): (Product & { dynamicRank: number })[] => {
        return [...productsList]
            .sort((a, b) => calculateProductScore(b) - calculateProductScore(a))
            .map((product, index) => ({
                ...product,
                dynamicRank:  index + 1
            }));
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery || filters.category || filters.minPrice || filters.maxPrice) {
                handleSearch();
            } else {
                fetchProducts();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts(0, 1000);
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const cats = await getCategories();
            setCategories(cats);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const searchFilters = {
                ...filters,
                query: searchQuery || undefined
            };
            const data = await searchProducts(searchFilters, 0, 1000);
            setProducts(data);
        } catch (error) {
            console.error("Error searching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearchQuery("");
        setFilters({});
        fetchProducts();
    };

    const handleDelete = async (asin: string, productName: string) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"?`)) {
            try {
                await deleteProduct(asin);
                fetchProducts();
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product.Please try again.");
            }
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleModalSuccess = () => {
        fetchProducts();
        fetchCategories(); // Refresh category counts
    };

    const getCategoryColor = (categoryName: string) => {
        const colors:{ [key:string]:string } = {
            'Electronics':'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            'Video Games':'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
            'Toys & Games':'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
            'Clothing, Shoes & Jewelry':'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Camera & Photo':'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'Gift Cards':'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
            'Books': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        };
        return colors[categoryName] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    };
    const rankedProducts = getProductsWithDynamicRank(products);

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        Products Management
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage your product catalog
                    </p>
                </div>
                <button
                    onClick={handleAddProduct}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Product
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Search
                        </label>
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Search by name, ASIN..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Category
                        </label>
                        <select
                            className="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            value={filters.category || ""}
                            onChange={(e) => setFilters({ ...filters, category:e.target.value || undefined })}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Min Price
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Min"
                            value={filters.minPrice || ""}
                            onChange={(e) => setFilters({ ...filters, minPrice:e.target.value ? Number(e.target.value) :undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Max Price
                        </label>
                        <input
                            type="number"
                            className="w-full px-3 py-2.5 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Max"
                            value={filters.maxPrice || ""}
                            onChange={(e) => setFilters({ ...filters, maxPrice:e.target.value ? Number(e.target.value) :undefined })}
                        />
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleReset}
                        className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Filters
                    </button>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing <span className="font-semibold text-gray-900 dark:text-white">{products.length}</span> products
                        <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(Ranked by Rating & Sales)</span>
                    </p>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) :products.length === 0 ? (
                    <div className="text-center py-12">
                        <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No products found</h3>
                        <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
                    </div>
                ) :(
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Sales
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {rankedProducts.map((product) => (
                                <tr
                                    key={product.asin}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                >

                                    <td className="px-4 py-4">
                                        <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold ${
                                            product.dynamicRank <= 3
                                                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                :product.dynamicRank <= 10
                                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                                                    :'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                        }`}>
                                            #{product.dynamicRank}
                                        </span>
                                    </td>

                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {product.imageUrl ?  (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/48?text=No+Image';
                                                    }}
                                                />
                                            ) :(
                                                <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="min-w-0">
                                                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs" title={product.productName}>
                                                    {product.productName}
                                                </p>
                                                <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">
                                                    {product.asin}
                                                </p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${getCategoryColor(product.categoryName || '')}`}>
                                            {product.categoryName || 'Uncategorized'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-semibold text-green-600 dark:text-green-400">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-1">
                                            <span className="text-yellow-500">⭐</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {product.rating?.toFixed(1) || '0.0'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className={`font-medium ${
                                            (product.salesCount || 0) > 0
                                                ? 'text-green-600 dark:text-green-400'
                                                :'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {(product.salesCount || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleEditProduct(product)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit product"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.asin, product.productName)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete product"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={editingProduct}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
};

export default ProductsPage;