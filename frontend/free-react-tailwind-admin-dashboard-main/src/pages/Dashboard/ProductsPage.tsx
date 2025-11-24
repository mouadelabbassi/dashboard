import React, { useState, useEffect } from "react";
import { getAllProducts, deleteProduct, searchProducts, Product, SearchFilters } from "../../service/api";

const ProductsPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState<SearchFilters>({});
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, []);

    // Auto-apply filters whenever they change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery || filters.category || filters.minPrice || filters.maxPrice) {
                handleSearch();
            } else {
                fetchProducts();
            }
        }, 500); // Debounce for 500ms

        return () => clearTimeout(timeoutId);
    }, [searchQuery, filters]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts(0, 1000); // Get first 1000 products
            setProducts(data);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
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

    const handleDelete = async (asin: string) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(asin);
                // Refresh the current view
                if (searchQuery || filters.category || filters.minPrice || filters.maxPrice) {
                    handleSearch();
                } else {
                    fetchProducts();
                }
            } catch (error) {
                console.error("Error deleting product:", error);
                alert("Failed to delete product. Please try again.");
            }
        }
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Products Management</h1>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 mb-6 border border-gray-200 dark:border-gray-800">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Search</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search products..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Category</label>
                        <select
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={filters.category || ""}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value || undefined })}
                        >
                            <option value="">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Clothing, Shoes & Jewelry">Clothing, Shoes & Jewelry</option>
                            <option value="Gift Cards">Gift Cards</option>
                            <option value="Books">Books</option>
                            <option value="Video Games">Video Games</option>
                            <option value="Camera & Photo">Camera & Photo</option>
                            <option value="Toys & Games">Toys & Games</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Min Price</label>
                        <input
                            type="number"
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Min"
                            value={filters.minPrice || ""}
                            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Max Price</label>
                        <input
                            type="number"
                            className="w-full border rounded px-3 py-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Max"
                            value={filters.maxPrice || ""}
                            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value ? parseFloat(e.target.value) : undefined })}
                        />
                    </div>
                </div>
                <div className="mt-4 flex justify-between items-center">
                    <button
                        onClick={handleReset}
                        className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                    >
                        Reset All Filters
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {products.length} product{products.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-800">
                {loading ? (
                    <div className="p-8 text-center text-gray-600 dark:text-gray-400">Loading...</div>
                ) : products.length === 0 ? (
                    <div className="p-8 text-center text-gray-600 dark:text-gray-400">No products found</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rank
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Rating
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Reviews
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map((product) => (
                                <tr key={product.asin} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">
                                            #{product.ranking || product.rank || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            {product.imageUrl && (
                                                <img
                                                    src={product.imageUrl}
                                                    alt={product.productName}
                                                    className="w-12 h-12 object-cover rounded mr-3 border border-gray-200 dark:border-gray-700"
                                                    onError={(e) => {
                                                        e.currentTarget.src = 'https://via.placeholder.com/50';
                                                    }}
                                                />
                                            )}
                                            <div className="max-w-md">
                                                <div className="font-medium text-gray-900 dark:text-white line-clamp-2">
                                                    {product.productName}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    ASIN: {product.asin}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                            {product.categoryName || product.category || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-gray-900 dark:text-white font-semibold">
                                            ${product.price?.toFixed(2) || '0.00'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <span className="text-yellow-500">★</span>
                                            <span className="ml-1 text-gray-900 dark:text-white">
                                                {product.rating?.toFixed(1) || 'N/A'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white">
                                        {product.reviewsCount?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <button
                                            onClick={() => handleDelete(product.asin)}
                                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductsPage;