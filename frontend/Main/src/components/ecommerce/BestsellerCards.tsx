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

    const medalConfig = [
        {
            borderColor: 'border-yellow-500',
            badgeColor: 'bg-yellow-500 text-black',
            lightBg: 'bg-yellow-50',
            darkBg: 'dark:bg-yellow-500/10'
        },
        {
            borderColor: 'border-gray-400',
            badgeColor: 'bg-gray-400 text-black',
            lightBg: 'bg-gray-50',
            darkBg: 'dark:bg-gray-500/10'
        },
        {
            borderColor: 'border-orange-500',
            badgeColor: 'bg-orange-500 text-white',
            lightBg: 'bg-orange-50',
            darkBg: 'dark:bg-orange-500/10'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="rounded-2xl bg-gray-200 dark:bg-gray-800 h-48 animate-pulse"
                    />
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
                {bestsellers.slice(0, 3).map((product, index) => (
                    <div
                        key={product.asin}
                        className={`relative overflow-hidden rounded-2xl border-2 ${medalConfig[index].borderColor}`}
                    >
                        {/* Card with theme-aware background */}
                        <div className={`${medalConfig[index].lightBg} ${medalConfig[index].darkBg} p-4 h-full`}>

                            {/* Header with medal badge and rank */}
                            <div className="flex items-start justify-between mb-3">
                                {/* Medal badge with number */}
                                <div className={`w-10 h-10 rounded-full ${medalConfig[index].badgeColor} flex items-center justify-center font-bold text-lg shadow-lg`}>
                                    {index + 1}
                                </div>
                                {/* Rank badge */}
                                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-500/20 rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold">
                                    #{index + 1}
                                </span>
                            </div>

                            {/* Product info */}
                            <div className="flex items-center gap-3 mb-3">
                                {product.imageUrl ?  (
                                    <img
                                        src={product.imageUrl}
                                        alt={product.productName}
                                        className="w-16 h-16 rounded-lg object-cover border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                        onError={(e) => {
                                            e.currentTarget.src = 'https://via.placeholder.com/64? text=No+Image';
                                        }}
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                        <span className="text-2xl">📦</span>
                                    </div>
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

                            {/* Stats grid */}
                            <div className="grid grid-cols-3 gap-2 text-center">
                                {/* Price */}
                                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        ${product.price?.toFixed(2) || '0.00'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark: text-gray-400">Price</p>
                                </div>
                                {/* Rating */}
                                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
                                    <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400 flex items-center justify-center gap-1">
                                        <span>⭐</span> {product.rating?.toFixed(1) || '0.0'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Rating</p>
                                </div>
                                {/* Reviews */}
                                <div className="bg-white dark:bg-gray-800/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
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