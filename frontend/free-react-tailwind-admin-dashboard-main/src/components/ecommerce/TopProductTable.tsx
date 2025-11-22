import { useEffect, useState } from "react";
import { getTopProducts, Product } from "../../service/api";

export default function TopProductsTable() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTopProducts();
    }, []);

    const fetchTopProducts = async () => {
        try {
            const data = await getTopProducts(10);
            setProducts(data);
        } catch (error) {
            console.error("Error fetching top products:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] animate-pulse">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
            <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90">
                🏆 Top 10 Best Sellers
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800">
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            Rank
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            ASIN
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            Category
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            Price
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            Rating
                        </th>
                        <th className="pb-3 text-left text-sm font-medium text-gray-700 dark:text-gray-400">
                            Reviews
                        </th>
                    </tr>
                    </thead>
                    <tbody>
                    {products.map((product) => (
                        <tr
                            key={product.id}
                            className="border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                        >
                            <td className="py-4">
                  <span className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-sm font-bold text-blue-600 dark:text-blue-400">
                    #{product.rank}
                  </span>
                            </td>
                            <td className="py-4 font-mono text-sm text-gray-800 dark:text-white/90">
                                {product.asin}
                            </td>
                            <td className="py-4">
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-400">
                    {product.category}
                  </span>
                            </td>
                            <td className="py-4 font-semibold text-green-600 dark:text-green-400">
                                ${product.price}
                            </td>
                            <td className="py-4">
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">⭐</span>
                                    <span className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {product.rating}
                    </span>
                                </div>
                            </td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                                {product.reviewsCount}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}