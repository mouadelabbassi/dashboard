import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/common/Toast';
import axios from 'axios';

interface Product {
    asin: string;
    productName: string;
    description?: string;
    price: number;
    rating?: number;
    reviewsCount?: number;
    imageUrl?: string;
    categoryName?: string;
    sellerName?: string;
    sellerId?: number;
    storeName?: string;
    isBestseller?: boolean;
}

interface Review {
    id: number;
    userId: number;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
    isLiked: boolean;
}

const ProductDetailPage: React.FC = () => {
    const { asin } = useParams<{ asin: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { addToCart, isInCart, getItemQuantity } = useCart();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Review states
    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [userRating, setUserRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [hasUserReviewed, setHasUserReviewed] = useState(false);

    useEffect(() => {
        if (asin) {
            fetchProduct();
            fetchReviews();
        }
    }, [asin]);

    const fetchProduct = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/products/${asin}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const productData = response.data?.data || response.data;
            setProduct(productData);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            setReviewsLoading(true);
            const token = localStorage.getItem('token');

            const response = await axios.get(
                `http://localhost:8080/api/reviews/product/${asin}/all`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { page: 0, size: 50 }
                }
            );

            console.log('Reviews response:', response.data);

            let reviewsData: Review[] = [];

            if (response.data?.data?.content) {
                reviewsData = response.data.data.content;
            } else if (response.data?.content) {
                reviewsData = response.data.content;
            } else if (Array.isArray(response.data?.data)) {
                reviewsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                reviewsData = response.data;
            }

            setReviews(reviewsData);

            if (user && reviewsData.length > 0) {
                const userReview = reviewsData.find((r: Review) => r.userId === user.id);
                if (userReview) {
                    setHasUserReviewed(true);
                    setUserRating(userReview.rating);
                    setReviewComment(userReview.comment || '');
                }
            }
        } catch (error) {
            console.error('Error fetching reviews:', error);
            setReviews([]);
        } finally {
            setReviewsLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (userRating === 0) {
            setToast({ message: 'Please select a rating', type: 'error' });
            return;
        }

        try {
            setSubmittingReview(true);
            const token = localStorage.getItem('token');

            await axios.post(
                `http://localhost:8080/api/reviews/product/${asin}`,
                {
                    rating: userRating,
                    comment: reviewComment,
                    isLiked: userRating >= 4
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            setToast({ message: 'Review submitted successfully! ', type: 'success' });
            setHasUserReviewed(true);

            await fetchReviews();
            await fetchProduct();

        } catch (error: any) {
            console.error('Submit review error:', error);
            const errorMessage = error.response?.data?.message || 'Failed to submit review';
            setToast({ message: errorMessage, type: 'error' });
        } finally {
            setSubmittingReview(false);
        }
    };

    const handleQuantityChange = (newQty: number) => {
        if (newQty < 1) newQty = 1;
        if (newQty > 99) newQty = 99;
        setQuantity(newQty);
    };

    const handleAddToCart = () => {
        if (product) {
            addToCart(product as any, quantity);
            setToast({ message: `Added ${quantity} item(s) to cart! `, type: 'success' });
            setQuantity(1);
        }
    };

    const handleBuyNow = () => {
        if (product) {
            addToCart(product as any, quantity);
            navigate('/shop/cart');
        }
    };

    const renderStars = (rating: number, interactive: boolean = false, size: string = 'w-5 h-5') => {
        return [...Array(5)].map((_, i) => (
            <svg
                key={i}
                className={`${size} ${interactive ? 'cursor-pointer' : 'cursor-default'} ${
                    i < (interactive ? (hoverRating || userRating) : Math.floor(rating))
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
                onMouseEnter={() => interactive && setHoverRating(i + 1)}
                onMouseLeave={() => interactive && setHoverRating(0)}
                onClick={() => interactive && setUserRating(i + 1)}
            >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
        ));
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-4">Product not found</h2>
                <Link to="/shop" className="text-blue-600 hover:underline">Back to Shop</Link>
            </div>
        );
    }

    const inCart = isInCart(product.asin);
    const cartQuantity = getItemQuantity(product.asin);
    const sellerName = product.sellerName || 'MouadVision Store';
    const isMouadVisionProduct = ! product.sellerId;

    return (
        <div className="max-w-6xl mx-auto">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Breadcrumb */}
            <nav className="mb-6">
                <ol className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <li><Link to="/shop" className="hover:text-blue-600">Shop</Link></li>
                    <li>/</li>
                    <li className="text-gray-900 dark:text-white truncate max-w-xs">{product.productName}</li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Product Image */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <img
                        src={product.imageUrl || '/placeholder-product.png'}
                        alt={product.productName}
                        className="w-full h-auto object-contain rounded-xl max-h-[500px]"
                    />
                </div>

                {/* Product Info */}
                <div className="space-y-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            {product.productName}
                        </h1>
                        <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-700/50">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Sold by:</p>

                            {isMouadVisionProduct ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 2a8 8 0 100 16 8 8 0 000-16z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 dark:text-white">MouadVision Store</h4>
                                        <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">✓ Official Store</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Your trusted e-commerce platform</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                                        <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                            {product.sellerName?.charAt(0) || 'S'}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-white">{sellerName}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs rounded-full">
                                                  ✓ Verified Seller
                                            </span>
                                        </div>
                                        {product.sellerId && (
                                            <Link
                                                to={`/seller/${product.sellerId}`}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                                            >
                                                Visit Store →
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center">
                            {renderStars(product.rating || 0)}
                        </div>
                        <span className="text-gray-600 dark:text-gray-400">
                            {product.rating?.toFixed(1) || '0.0'} ({product.reviewsCount?.toLocaleString() || 0} reviews)
                        </span>
                    </div>

                    {/* Price */}
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        ${product.price?.toFixed(2) || '0.00'}
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-4">
                        <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg">
                            <button
                                onClick={() => handleQuantityChange(quantity - 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg"
                            >
                                -
                            </button>
                            <span className="px-4 py-2 font-semibold text-gray-900 dark:text-white">{quantity}</span>
                            <button
                                onClick={() => handleQuantityChange(quantity + 1)}
                                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {inCart && (
                        <p className="text-green-600 dark:text-green-400 text-sm">
                            ✓ {cartQuantity} item(s) already in cart
                        </p>
                    )}

                    <div className="flex gap-4">
                        <button
                            onClick={handleAddToCart}
                            className="flex-1 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 rounded-xl font-semibold hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Add to Cart
                        </button>
                        <button
                            onClick={handleBuyNow}
                            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
                        >
                            Buy Now
                        </button>
                    </div>

                    {/* Description */}
                    {product.description && (
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{product.description}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                    Customer Reviews
                </h2>

                {/* Write Review Form */}
                {user && ! hasUserReviewed && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Write a Review
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Rating *
                            </label>
                            <div className="flex items-center gap-1">
                                {renderStars(0, true, 'w-8 h-8')}
                                <span className="ml-2 text-gray-600 dark:text-gray-400">
                                    {userRating > 0 ? `${userRating} star${userRating > 1 ? 's' : ''}` : 'Click to rate'}
                                </span>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Your Review (Optional)
                            </label>
                            <textarea
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                                placeholder="Share your experience with this product..."
                            />
                        </div>

                        <button
                            onClick={handleSubmitReview}
                            disabled={submittingReview || userRating === 0}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {submittingReview ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    Submit Review
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Already Reviewed Message */}
                {user && hasUserReviewed && (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="font-medium">You have already reviewed this product</span>
                        </div>
                    </div>
                )}

                {/* Not Logged In Message */}
                {!user && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Please <Link to="/signin" className="font-medium underline">sign in</Link> to write a review</span>
                        </div>
                    </div>
                )}

                {/* Reviews List */}
                {reviewsLoading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map((review) => (
                            <div key={review.id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {review.userName}
                                            </span>
                                            {review.userId === user?.id && (
                                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex">{renderStars(review.rating, false, 'w-4 h-4')}</div>
                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                                        {review.comment}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No reviews yet</h3>
                        <p className="text-gray-500 dark:text-gray-400">Be the first to review this product! </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetailPage;