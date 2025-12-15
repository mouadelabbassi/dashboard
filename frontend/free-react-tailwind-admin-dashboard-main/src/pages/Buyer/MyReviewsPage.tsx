import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../service/api';

interface ReviewResponse {
    id: number;
    productAsin: string;
    productName: string;
    productImage: string;
    rating: number;
    comment: string;
    isLiked: boolean | null;
    createdAt: string;
    updatedAt: string;
}

const MyReviewsPage: React.FC = () => {
    const [reviews, setReviews] = useState<ReviewResponse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyReviews();
    }, []);

    const fetchMyReviews = async () => {
        try {
            setLoading(true);
            const response = await api.get('/reviews/my-reviews');
            if (response.data.success) {
                setReviews(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReview = async (productAsin: string) => {
        if (!window.confirm('Are you sure you want to delete this review?')) return;

        try {
            await api.delete(`/reviews/product/${productAsin}`);
            fetchMyReviews();
        } catch (error) {
            console.error('Error deleting review:', error);
        }
    };

    const renderStars = (rating: number) => {
        return Array(5).fill(0).map((_, i) => (
            <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}>
                ★
            </span>
        ));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div>
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    My Reviews
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                    Manage your product reviews and ratings
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{reviews.length}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Reviews</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">

                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {reviews.length > 0
                                    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                                    : '0.0'
                                }
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Avg Rating Given</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-800">
                    <div className="flex items-center gap-4">
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                {reviews.filter(r => r.isLiked === true).length}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Products Liked</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-12 text-center">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">
                        No reviews yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Start exploring products and share your opinions!
                    </p>
                    <Link
                        to="/shop"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Browse Products
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {reviews.map(review => (
                        <div
                            key={review.id}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                {/* Product Image */}
                                <Link to={`/shop/product/${review.productAsin}`} className="flex-shrink-0">
                                    <img
                                        src={review.productImage || 'https://via.placeholder.com/80?text=No+Image'}
                                        alt={review.productName}
                                        className="w-20 h-20 object-contain rounded-lg border border-gray-200 dark:border-gray-700"
                                    />
                                </Link>

                                {/* Review Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4 mb-2">
                                        <div>
                                            <Link
                                                to={`/shop/product/${review.productAsin}`}
                                                className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 line-clamp-1"
                                            >
                                                {review.productName}
                                            </Link>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="flex">{renderStars(review.rating)}</div>
                                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(review.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/shop/product/${review.productAsin}`}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                title="Edit review"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </Link>
                                            <button
                                                onClick={() => handleDeleteReview(review.productAsin)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete review"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {review.comment && (
                                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                                            {review.comment}
                                        </p>
                                    )}

                                    {review.isLiked !== null && (
                                        <div className="mt-2">
                                            <span className={`inline-flex items-center gap-1 text-sm px-2 py-1 rounded-full ${
                                                review.isLiked
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                            }`}>
                                                {review.isLiked ? 'Liked' : 'Disliked'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReviewsPage;
