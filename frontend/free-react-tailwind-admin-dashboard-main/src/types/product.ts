export interface Product {
    asin: string;
    productName: string;
    description: string;
    price: number;
    rating: number;
    reviewsCount: number;
    ranking: number;
    imageUrl: string;
    categoryId: number;
    categoryName: string;
    isBestseller: boolean;
    salesCount: number;
    stockQuantity: number;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    sellerName: string;
    sellerId: number | null;
    isMouadVisionProduct: boolean;
    createdAt: string;
}

export interface ProductDetail extends Product {
    averageRating: number;
    totalReviews: number;
    productLink: string;
    userHasReviewed: boolean;
    userReview: Review | null;
    likesCount: number;
    dislikesCount: number;
    ratingDistribution: Record<number, number>;
    recentReviews: Review[];
}

export interface Review {
    id: number;
    productAsin: string;
    productName: string;
    userId: number;
    userName: string;
    rating: number;
    comment: string;
    isLiked: boolean | null;
    helpfulCount: number;
    createdAt: string;
}