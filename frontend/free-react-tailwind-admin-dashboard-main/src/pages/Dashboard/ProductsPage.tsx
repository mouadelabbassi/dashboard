import { useState, useEffect } from "react";
import { getAllProducts, deleteProduct, searchProducts, Product, SearchFilters } from "../../service/api";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<SearchFilters>({});

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getAllProducts();
            setProducts(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        try {
            setLoading(true);
            const data = await searchProducts(filters);
            setProducts(data);
        } catch (error) {
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            try {
                await deleteProduct(id);
                fetchProducts();
            } catch (error) {
                console.error("Error:", error);
            }
        }
    };

    return (
        <>
            <PageMeta title="Products Management" description="Manage Amazon Best Seller products" />
            <PageBreadcrumb pageTitle="Products" />

            {/* Search Filters */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] mb-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-white/90">
                    🔍 Search & Filter
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="Category"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={filters.category || ""}
                        onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    />
                    <input
                        type="number"
                        placeholder="Min Price"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                    />
                    <input
                        type="number"
                        placeholder="Max Price"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                    />
                    <button
                        onClick={handleSearch}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                        Search
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
                <div className="mb-5 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        All Products ({products.length})
                    </h3>
                    <button
                        onClick={fetchProducts}
                        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        🔄 Refresh
                    </button>
                </div>

                {loading ? (
                    <div className="animate-pulse space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-800">
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Rank</th>
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">ASIN</th>
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Category</th>
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Price</th>
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Rating</th>
                                <th className="pb-3 text-left text-xs font-medium text-gray-700 dark:text-gray-400">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {products.map((product) => (
                                <tr key={product.id} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                                    <td className="py-4 font-bold text-blue-600">#{product.rank}</td>
                                    <td className="py-4 font-mono text-sm">{product.asin}</td>
                                    <td className="py-4"><span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2 py-1 text-xs">{product.category}</span></td>
                                    <td className="py-4 font-semibold text-green-600">${product.price}</td>
                                    <td className="py-4">⭐ {product.rating}</td>
                                    <td className="py-4">
                                        <button
                                            onClick={() => handleDelete(product.id)}
                                            className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700"
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
        </>
    );
}