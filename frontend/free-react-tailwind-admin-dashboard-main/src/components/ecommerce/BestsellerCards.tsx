import React, { useEffect, useState } from 'react';
import { dashboardAPI, Product } from '../../service/api';

const BestsellerCards: React.FC = () => {
    const [bestsellers, setBestsellers] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBestsellers = async () => {
            try {
                const response = await dashboardAPI.getBestsellers();
                if (response.data.success) {
                    setBestsellers(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching bestsellers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBestsellers();
    }, []);

    const medals = ['🥇', '🥈', '🥉'];
    const gradients = [
        'from-yellow-400 via-yellow-500 to-orange-500',
        'from-gray-300 via-gray-400 to-gray-500',
        'from-orange-400 via-orange-500 to-red-500'
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="rounded-2xl bg-gray-200 dark:bg-gray-800 h-48 animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    🏆 Top Bestsellers
                </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {bestsellers.map((product, index) => (
                    <div
                        key={product.asin}
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradients[index]} p-1`}
                    >
                        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 h-full">
                            <div className="flex items-start justify-between mb-3">
                                <span className="text-3xl">{medals[index]}</span>
                                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                                    #{product.ranking || index + 1}
                                </span>
                            </div>

                            <div className="flex items-center gap-3 mb-3">
                                {product.imageUrl && (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-100 dark:border-gray-700"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/64';
                                        }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm line-clamp-2">
                                        {product.productName}
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {product.categoryName || 'Uncategorized'}
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        ${product.price?.toFixed(2) || '0'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                                        <span>⭐</span> {product.rating?.toFixed(1) || '0'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                        {(product.reviewsCount || 0).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Reviews</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BestsellerCards;