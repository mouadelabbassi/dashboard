import React, { useEffect, useState } from "react";
import { getTopProducts, Product } from "../../service/api";

const TopProductTable: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getTopProducts(10);
                setProducts(data);
            } catch (err: any) {
                console.error("Error fetching top products:", err);
                setError(err.message || "Failed to load products");
            } finally {
                setLoading(false);
            }
        };

        fetchTopProducts();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-black dark:text-white flex items-center">
                        🏆 Top 10 Best Sellers
                    </h4>
                </div>
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-black dark:text-white flex items-center">
                        🏆 Top 10 Best Sellers
                    </h4>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-black dark:text-white flex items-center">
                    🏆 Top 10 Best Sellers
                </h4>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full table-auto">
                    <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                        <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white">
                            Rank
                        </th>
                        <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                            Product Name
                        </th>
                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                            ASIN
                        </th>
                        <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                            Category
                        </th>
                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                            Price
                        </th>
                        <th className="min-w-[100px] px-4 py-4 font-medium text-black dark:text-white">
                            Rating
                        </th>
                        <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                            Reviews
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((product, index) => {
                        // Use ranking from API, or fallback to index + 1
                        const productRank = product.ranking || product.rank || index + 1;
                        // Use categoryName from API, or fallback to category
                        const productCategory = product.categoryName || product.category || 'N/A';

                        return (
                            <tr
                                key={product.asin}
                                className="border-b border-stroke dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <td className="px-4 py-4">
                                    <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-sm font-bold ${
                                        productRank === 1
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                            : productRank === 2
                                                ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                                : productRank === 3
                                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                    }`}>
                                        #{productRank}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        {product.imageUrl && (
                                            <img
                                                src={product.imageUrl}
                                                alt={product.productName}
                                                className="h-12 w-12 rounded object-cover border border-gray-200 dark:border-gray-700"
                                                onError={(e) => {
                                                    e.currentTarget.src = 'https://via.placeholder.com/50';
                                                }}
                                            />
                                        )}
                                        <p className="text-sm text-black dark:text-white font-medium line-clamp-2">
                                            {product.productName}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-sm text-blue-600 dark:text-blue-400 font-mono">{product.asin}</p>
                                </td>
                                <td className="px-4 py-4">
                                    <span className="inline-flex rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-300">
                                        {productCategory}
                                    </span>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                                        ${product.price?.toFixed(2) || '0.00'}
                                    </p>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-1">
                                        <span className="text-yellow-400">⭐</span>
                                        <p className="text-sm text-black dark:text-white">
                                            {product.rating?.toFixed(1) || 'N/A'}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <p className="text-sm text-black dark:text-white">
                                        {product.reviewsCount?.toLocaleString() || '0'}
                                    </p>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {products.length === 0 && (
                <div className="py-12 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No products found</p>
                </div>
            )}
        </div>
    );
};

export default TopProductTable;
