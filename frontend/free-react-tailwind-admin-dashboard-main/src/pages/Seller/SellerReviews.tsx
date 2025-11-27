import React, { useEffect, useState } from 'react';
import { sellerService } from '../../service/sellerService';
import { Review } from '../../types/product';
import { SellerReviewSummary } from '../../types/seller';

const SellerReviews: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [summary, setSummary] = useState<SellerReviewSummary | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    useEffect(() => {
        fetchData();
    }, [currentPage]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [reviewsData, summaryData] = await Promise.all([
                sellerService. getMyProductReviews(currentPage, 10),
                currentPage === 0 ? sellerService. getReviewSummary() : Promise.resolve(summary),
            ]);
            setReviews(reviewsData.content);
            setTotalPages(reviewsData.totalPages);
            if (summaryData) setSummary(summaryData);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                        key={star}
                        className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M9. 049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95. 69h3.462c.969 0 1.371 1.24. 588 1.81l-2.8 2. 034a1 1 0 00-. 364 1.118l1.07 3. 292c. 3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1. 175 0l-2.8 2.034c-. 784. 57-1.838-. 197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1. 118L2.98 8.72c-.783-.57-. 38-1.81. 588-1.81h3.461a1 1 0 00.951-.69l1.07-3. 292z" />
                    </svg>
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Avis Clients</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Consultez les avis laissés par les acheteurs sur vos produits
                </p>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Average Rating */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Note Moyenne</h3>
                        <div className="mt-2 flex items-center gap-3">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                {summary.averageRating. toFixed(1)}
              </span>
                            <div>
                                {renderStars(Math.round(summary.averageRating))}
                                <p className="text-sm text-gray-500 mt-1">{summary.totalReviews} avis au total</p>
                            </div>
                        </div>
                    </div>

                    {/* Rating Distribution */}
                    <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">Distribution des Notes</h3>
                        <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                                const count = summary.ratingDistribution[star] || 0;
                                const percentage = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
                                return (
                                    <div key={star} className="flex items-center gap-2">
                                        <span className="text-sm w-8 text-gray-600 dark:text-gray-400">{star} ★</span>
                                        <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <span className="text-sm w-12 text-right text-gray-600 dark:text-gray-400">
                      {count}
                    </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Reviews List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : reviews.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4. 03 8-9 8a9. 863 9.863 0 01-4.255-. 949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3. 582 9 8z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Aucun avis pour le moment</h3>
                    <p className="text-gray-500 mt-2">
                        Les avis apparaîtront ici quand vos clients évalueront vos produits.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews. map((review) => (
                        <div key={review.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                      {review.userName?. charAt(0).toUpperCase() || 'U'}
                    </span>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{review.userName}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            {renderStars(review.rating)}
                                            <span className="text-sm text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Produit:</p>
                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 max-w-xs truncate">
                                        {review.productName}
                                    </p>
                                </div>
                            </div>
                            {review.comment && (
                                <p className="mt-4 text-gray-700 dark:text-gray-300">{review.comment}</p>
                            )}
                            {review.isLiked !== null && (
                                <div className="mt-4 flex items-center gap-2">
                  <span className={`text-sm ${review.isLiked ? 'text-green-600' : 'text-red-600'}`}>
                    {review.isLiked ? '👍 A aimé ce produit' : '👎 N\'a pas aimé ce produit'}
                  </span>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center mt-8 gap-2">
                            <button
                                onClick={() => setCurrentPage((p) => Math. max(0, p - 1))}
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
        </div>
    );
};

export default SellerReviews;