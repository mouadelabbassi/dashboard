import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import api from '../../service/api';

interface ReviewResponse {
    id: number;
    productAsin: string;
    userId: number;
    userName: string;
    rating: number;
    comment: string;
    isLiked: boolean | null;
    createdAt: string;
}

interface ProductDetail {
    asin: string;
    productName: string;
    description: string;
    price: number;
    averageRating: number;
    totalReviews: number;
    ranking: number;
    imageUrl: string;
    categoryName: string;
    isBestseller: boolean;
    userHasReviewed: boolean;
    userReview: ReviewResponse | null;
    likesCount: number;
    dislikesCount: number;
    ratingDistribution: { [key: number]: number };
    recentReviews: ReviewResponse[];
}

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [userComment, setUserComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetchProductDetail();
    }, [asin]);

    const fetchProductDetail = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/reviews/product/${asin}`);
            if (response.data.success) {
                setProduct(response.data.data);
                if (response.data.data.userReview) {
                    setUserRating(response.data.data.userReview.rating);
                    setUserComment(response.data.data.userReview.comment || '');
                }
            }
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (userRating === 0) {
            setMessage({ type: 'error', text: 'Please select a rating' });
            return;
        }

        try {
            setSubmitting(true);
            await api.post(`/reviews/product/${asin}`, {
                rating: userRating,
                comment: userComment || null,
                isLiked: null
            });
            setMessage({ type: 'success', text: 'Review submitted successfully!' });
            fetchProductDetail();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to submit review' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleLike = async (isLike: boolean) => {
        try {
            await api.post(`/reviews/product/${asin}/${isLike ? 'like' : 'dislike'}`);
            fetchProductDetail();
        } catch (error) {
            console.error('Error updating like status:', error);
        }
    };

    const renderStars = (rating: number, interactive = false, size = 'text-xl') => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type={interactive ? 'button' : undefined}
                    onClick={interactive ? () => setUserRating(i) : undefined}
                    onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
                    onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
                    className={`${size} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
                        i <= (hoverRating || rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                    }`}
                    disabled={!interactive}
                >
                    ★
                </button>
            );
        }
        return stars;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Product not found</h2>
                <Link to="/shop" className="text-blue-600 hover:underline mt-4 inline-block">
                    ← Back to Shop
                </Link>
            </div>
        );
    }

    const totalRatings = Object.values(product.ratingDistribution).reduce((a, b) => a + b, 0);

    return (
        <div>
            {/* Breadcrumb */}
            <nav className="mb-6">
                <Link to="/shop" className="text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to Shop
                </Link>
            </nav>

            {/* Product Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Image */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 border border-gray-200 dark:border-gray-800">
                    <img
                        src={product.imageUrl || 'https://via.placeholder.com/500?text=No+Image'}
                        alt={product.productName}
                        className="w-full h-auto object-contain max-h-[500px]"
                    />
                </div>

                {/* Details */}
                <div>
                    {/* Category & Bestseller Badge */}
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                            {product.categoryName}
                        </span>
                        {product.isBestseller && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">
                                🏆 Best Seller
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {product.productName}
                    </h1>

                    {/* Rating Summary */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center gap-2">
                            <div className="flex">{renderStars(product.averageRating || 0)}</div>
                            <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {product.averageRating?.toFixed(1) || 'N/A'}
                            </span>
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                            ({product.totalReviews?.toLocaleString() || 0} reviews)
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                            Rank #{product.ranking}
                        </span>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                        <span className="text-3xl font-bold text-gray-900 dark:text-white">
                            ${product.price?.toFixed(2)}
                        </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                        {product.description || 'No description available.'}
                    </p>

                    {/* Like/Dislike Buttons */}
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => handleLike(true)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all ${
                                product.userReview?.isLiked === true
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-green-500 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <span className="text-xl">👍</span>
                            <span className="font-medium">{product.likesCount}</span>
                        </button>
                        <button
                            onClick={() => handleLike(false)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-full border-2 transition-all ${
                                product.userReview?.isLiked === false
                                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-600'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-red-500 text-gray-600 dark:text-gray-400'
                            }`}
                        >
                            <span className="text-xl">👎</span>
                            <span className="font-medium">{product.dislikesCount}</span>
                        </button>
                    </div>

                    {/* Rating Distribution */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Rating Breakdown</h3>
                        {[5, 4, 3, 2, 1].map(star => {
                            const count = product.ratingDistribution[star] || 0;
                            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                            return (
                                <div key={star} className="flex items-center gap-3 mb-2">
                                    <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{star} star</span>
                                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-yellow-400 rounded-full transition-all"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                                        {count}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Write Review Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8 mb-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    {product.userHasReviewed ? '✏️ Update Your Review' : '⭐ Write a Review'}
                </h2>

                {message && (
                    <div className={`mb-4 p-4 rounded-lg ${
                        message.type === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmitReview}>
                    {/* Star Rating */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Rating
                        </label>
                        <div className="flex gap-1">
                            {renderStars(userRating, true, 'text-3xl')}
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Review (Optional)
                        </label>
                        <textarea
                            value={userComment}
                            onChange={(e) => setUserComment(e.target.value)}
                            rows={4}
                            placeholder="Share your experience with this product..."
                            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {submitting ? 'Submitting...' : product.userHasReviewed ? 'Update Review' : 'Submit Review'}
                    </button>
                </form>
            </div>

            {/* Reviews List */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-8">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                    Customer Reviews ({product.totalReviews})
                </h2>

                {product.recentReviews.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                        No reviews yet. Be the first to review this product!
                    </p>
                ) : (
                        <div className="space-y-6">
                    {product.recentReviews.map(review => (
                        <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                                    {review.userName?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {review.userName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {renderStars(review.rating, false, 'text-sm')}
                        </div>
                    </div>
                    {review.comment && (
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                            {review.comment}
                        </p>
                    )}
                    {review.isLiked !== null && (
                        <div className="mt-2">
                                            <span className={`text-sm ${review.isLiked ? 'text-green-600' : 'text-red-600'}`}>
                                                {review.isLiked ? '👍 Liked this product' : '👎 Disliked this product'}
                                            </span>
                        </div>
                        )}
                    </div>
                    ))}
                </div>
            )}
            </div>
        </div>
        );
    };

export default ProductDetailPage;