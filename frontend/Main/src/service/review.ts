import axios from 'axios';

const API_URL = import.meta.env. VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface Review {
    id: number;
    productAsin: string;
    productName: string;
    productImage?: string;
    userId: number;
    userName: string;
    rating: number;
    comment: string;
    isLiked: boolean | null;
    helpfulCount: number;
    createdAt: string;
    updatedAt?: string;
}

export interface ProductDetail {
    asin: string;
    productName: string;
    description: string;
    price: number;
    averageRating: number;
    totalReviews: number;
    ranking: number;
    imageUrl: string;
    productLink: string;
    categoryName: string;
    categoryId: number;
    isBestseller: boolean;
    userHasReviewed: boolean;
    userReview: Review | null;
    likesCount: number;
    dislikesCount: number;
    ratingDistribution: Record<number, number>;
    recentReviews: Review[];
    sellerName: string;
    sellerId: number | null;
    isMouadVisionProduct: boolean;
    // Additional fields from Product
    rating?: number;
    reviewsCount?: number;
    salesCount?: number;
    stockQuantity?: number;
    approvalStatus?: string;
    createdAt?: string;
}

export interface ReviewRequest {
    rating: number;
    comment?: string;
    isLiked?: boolean;
}

export const reviewService = {
    // Get product detail with reviews
    getProductDetail: async (asin: string): Promise<ProductDetail> => {
        const response = await axios. get(`${API_URL}/reviews/product/${asin}`, {
            headers: getAuthHeader(),
        });
        return response.data. data;
    },

    // Get all reviews for a product (paginated)
    getProductReviews: async (asin: string, page = 0, size = 10): Promise<{
        content: Review[];
        totalPages: number;
        totalElements: number;
    }> => {
        const response = await axios.get(`${API_URL}/reviews/product/${asin}/all`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    // Create or update a review
    createOrUpdateReview: async (asin: string, request: ReviewRequest): Promise<Review> => {
        const response = await axios.post(`${API_URL}/reviews/product/${asin}`, request, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Like a product
    likeProduct: async (asin: string): Promise<void> => {
        await axios.post(`${API_URL}/reviews/product/${asin}/like`, {}, {
            headers: getAuthHeader(),
        });
    },

    // Dislike a product
    dislikeProduct: async (asin: string): Promise<void> => {
        await axios.post(`${API_URL}/reviews/product/${asin}/dislike`, {}, {
            headers: getAuthHeader(),
        });
    },

    // Delete a review
    deleteReview: async (asin: string): Promise<void> => {
        await axios.delete(`${API_URL}/reviews/product/${asin}`, {
            headers: getAuthHeader(),
        });
    },

    // Get user's reviews
    getMyReviews: async (): Promise<Review[]> => {
        const response = await axios.get(`${API_URL}/reviews/my-reviews`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },
};

export default reviewService;