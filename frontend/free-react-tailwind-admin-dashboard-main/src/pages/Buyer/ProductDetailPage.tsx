import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import Toast from '../../components/common/Toast';
import { reviewService, ProductDetail, Review } from '../../service/review';

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const [product, setProduct] = useState<ProductDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Review states
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const { addToCart, isInCart, getItemQuantity } = useCart();
    const location = useLocation();

    const isSellerContext = location.pathname.startsWith('/seller');
    const shopBasePath = isSellerContext ? '/seller/shop' : '/shop';

    useEffect(() => {
        if (asin) {
            fetchProductDetail();
        }
    }, [asin]);

    const fetchProductDetail = async () => {
        try {
            setLoading(true);
            const data = await reviewService.getProductDetail(asin! );
            setProduct(data);

            // If user has already reviewed, populate the form
            if (data.userHasReviewed && data.userReview) {
                setReviewRating(data.userReview.rating);
                setReviewComment(data.userReview.comment || '');
            }
        } catch (error) {
            console.error('Error fetching product:', error);
            setToast({ message: 'Failed to load product', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (product) {
            // Convert ProductDetail to Product format for cart compatibility
            const cartProduct = {
                asin: product.asin,
                productName: product.productName,
                description: product.description,
                price: product.price,
                rating: product.averageRating || product.rating || 0,
                reviewsCount: product.totalReviews || product.reviewsCount || 0,
                imageUrl: product.imageUrl,
                productLink: product.productLink,
                ranking: product.ranking,
                categoryId: product.categoryId,
                categoryName: product.categoryName,
                isBestseller: product.isBestseller,
                sellerId: product.sellerId,
                sellerName: product.sellerName,
                stockQuantity: product.stockQuantity || 999, // Default stock if not available
            };

            for (let i = 0; i < quantity; i++) {
                addToCart(cartProduct as any);
            }
            setToast({ message: `Added ${quantity} item(s) to cart!`, type: 'success' });
        }
    };

    const handleSubmitReview = async () => {
        if (!asin) return;

        try {
            setSubmittingReview(true);
            await reviewService.createOrUpdateReview(asin, {
                rating: reviewRating,
                comment: reviewComment,
                isLiked: reviewRating >= 4
            });

            setToast({
                message: product?.userHasReviewed ?  'Review updated successfully!' : 'Review submitted successfully!  The seller has been notified.',
                type: 'success'
            });
            setIsEditing(false);

            // Refresh product data to show updated reviews
            await fetchProductDetail();
        } catch (error) {
            console.error('Error submitting review:', error);
            setToast({ message: 'Failed to submit review. Please make sure you are logged in.', type: 'error' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleDeleteReview = async () => {
        if (!asin) return;

        if (! window.confirm('Are you sure you want to delete your review?')) return;

        try {
            await reviewService.deleteReview(asin);
            setToast({ message: 'Review deleted successfully!', type: 'success' });
            setReviewRating(5);
            setReviewComment('');
            await fetchProductDetail();
        } catch (error) {
            console.error('Error deleting review:', error);
            setToast({ message: 'Failed to delete review', type: 'error' });
        }
    };

    const renderStars = (rating: number, interactive: boolean = false, size: string = 'text-xl') => {
        return (
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        disabled={! interactive}
                        onClick={() => interactive && setReviewRating(star)}
                        onMouseEnter={() => interactive && setHoverRating(star)}
                        onMouseLeave={() => interactive && setHoverRating(0)}
                        className={`${size} ${interactive ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
                    >
                        <span className={
                            (interactive ?  (hoverRating || reviewRating) : rating) >= star
                                ? 'text-yellow-500'
                                : 'text-gray-300 dark:text-gray-600'
                        }>
                            ★
                        </span>
                    </button>
                ))}
            </div>
        );
    };

    const renderRatingDistribution = () => {
        if (!product?.ratingDistribution) return null;

        const totalReviews = product.totalReviews || 0;

        return (
            <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                    const count = product.ratingDistribution[star] || 0;
                    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

                    return (
                        <div key={star} className="flex items-center gap-2">
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{star} ★</span>
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-500 rounded-full transition-all duration-300"
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
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Product not found</h2>
                <Link to={shopBasePath} className="text-blue-600 hover:underline">Back to Shop</Link>
            </div>
        );
    }

    return (
        <div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><Link to={shopBasePath} className="hover:text-blue-600">Shop</Link></li>
                    <li>/</li>
                    <li className="text-gray-900 dark:text-white truncate max-w-xs">{product.productName}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Product Image */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        {product.imageUrl ?  (
                            <img
                                src={product.imageUrl}
                                alt={product.productName}
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                </div>

                {/* Product Info */}
                <div>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {product.ranking && product.ranking <= 10 && (
                            <span className="px-3 py-1 bg-yellow-500 text-white text-sm font-bold rounded-full">
                                🏆 Top {product.ranking}
                            </span>
                        )}
                        {product.isBestseller && (
                            <span className="px-3 py-1 bg-orange-500 text-white text-sm font-bold rounded-full">
                                Best Seller
                            </span>
                        )}
                        {isInCart(product.asin) && (
                            <span className="px-3 py-1 bg-green-500 text-white text-sm font-bold rounded-full">
                                ✓ In Cart ({getItemQuantity(product.asin)})
                            </span>
                        )}
                    </div>

                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">
                        {product.categoryName || 'Uncategorized'}
                    </p>

                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {product.productName}
                    </h1>

                    {/* Seller Info */}
                    <div className="mb-4">
                        {product.isMouadVisionProduct ?  (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                🏪 Sold by MouadVision
                            </span>
                        ) : (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                👤 Sold by {product.sellerName || 'Verified Seller'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        {product.averageRating && (
                            <div className="flex items-center">
                                {renderStars(product.averageRating)}
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {product.averageRating.toFixed(1)}
                                </span>
                            </div>
                        )}
                        {product.totalReviews !== undefined && (
                            <span className="text-gray-500 dark:text-gray-400">
                                {product.totalReviews.toLocaleString()} reviews
                            </span>
                        )}
                    </div>

                    <div className="text-4xl font-bold text-gray-900 dark:text-white mb-6">
                        ${product.price.toFixed(2)}
                    </div>

                    {product.description && (
                        <div className="mb-6">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                            >
                                −
                            </button>
                            <span className="px-6 py-2 text-gray-900 dark:text-white font-medium">
                                {quantity}
                            </span>
                            <button
                                onClick={() => setQuantity(quantity + 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                            >
                                +
                            </button>
                        </div>
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 py-3 bg-gray-800 dark:bg-gray-800  text-white rounded-lg font-semibold hover:from-blue-700 hover:to-gray-700 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </button>
                    </div>

                    <Link
                        to={`${shopBasePath}/cart`}
                        className="block w-full py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-800 transition-all text-center"
                    >
                        View Cart
                    </Link>
                </div>
            </div>

            {/* Reviews Section */}
            <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Rating Summary & Write Review */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Rating Summary */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Customer Reviews
                        </h3>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold text-gray-900 dark:text-white">
                                    {product.averageRating?.toFixed(1) || '0.0'}
                                </div>
                                <div className="mt-1">
                                    {renderStars(product.averageRating || 0, false, 'text-lg')}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {product.totalReviews || 0} reviews
                                </div>
                            </div>
                        </div>

                        {renderRatingDistribution()}
                    </div>

                    {/* Write/Edit Review */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            {product.userHasReviewed && ! isEditing ? 'Your Review' : 'Write a Review'}
                        </h3>

                        {product.userHasReviewed && !isEditing ?  (
                            // Show existing review
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    {renderStars(product.userReview?.rating || 0, false, 'text-lg')}
                                    <span className="text-gray-600 dark:text-gray-400">
                                        {product.userReview?.rating}/5
                                    </span>
                                </div>
                                {product.userReview?.comment && (
                                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                                        "{product.userReview.comment}"
                                    </p>
                                )}
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                    Posted on {product.userReview?.createdAt ?  formatDate(product.userReview.createdAt) : 'Unknown date'}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Edit Review
                                    </button>
                                    <button
                                        onClick={handleDeleteReview}
                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Review form
                            <div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Rating
                                    </label>
                                    <div className="flex items-center gap-2">
                                        {renderStars(reviewRating, true, 'text-3xl')}
                                        <span className="text-gray-600 dark:text-gray-400 ml-2">
                                            {reviewRating}/5
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Your Review (optional)
                                    </label>
                                    <textarea
                                        value={reviewComment}
                                        onChange={(e) => setReviewComment(e.target.value)}
                                        placeholder="Share your experience with this product..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSubmitReview}
                                        disabled={submittingReview}
                                        className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-600 to-gray-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submittingReview ? (
                                            <>
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                ⭐ {product.userHasReviewed ?  'Update Review' : 'Submit Review'}
                                            </>
                                        )}
                                    </button>
                                    {isEditing && (
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                if (product.userReview) {
                                                    setReviewRating(product.userReview.rating);
                                                    setReviewComment(product.userReview.comment || '');
                                                }
                                            }}
                                            className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                </div>

                                <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                                    💡 The product owner will be notified when you submit your review.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Reviews */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                            Recent Reviews
                        </h3>

                        {product.recentReviews && product.recentReviews.length > 0 ? (
                            <div className="space-y-6">
                                {product.recentReviews.map((review: Review) => (
                                    <div
                                        key={review.id}
                                        className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
                                                    {review.userName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                        {review.userName || 'Anonymous'}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        {renderStars(review.rating, false, 'text-sm')}
                                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                                            {review.rating}/5
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>

                                        {review.comment && (
                                            <p className="text-gray-700 dark:text-gray-300 ml-13">
                                                {review.comment}
                                            </p>
                                        )}

                                        {review.helpfulCount > 0 && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 ml-13">
                                                👍 {review.helpfulCount} people found this helpful
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">📝</div>
                                <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                    No reviews yet
                                </h4>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Be the first to review this product!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;