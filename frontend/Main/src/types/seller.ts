export interface SellerDashboard {
    sellerId: number;
    storeName: string;
    isVerifiedSeller: boolean;
    totalProducts: number;
    approvedProducts: number;
    pendingProducts: number;
    pendingRequests: number;
    totalSalesCount: number;
    totalUnitsSold: number;
    totalRevenue: number;
    monthlyRevenue: number;
    weeklyRevenue: number;
    todayRevenue: number;
    revenueTrend: DailyRevenuePoint[];
    topProducts: TopProductRevenue[];
}

export interface DailyRevenuePoint {
    date: string;
    revenue: number;
}

export interface TopProductRevenue {
    asin: string;
    productName: string;
    unitsSold: number;
    revenue: number;
}

export interface SellerProfile {
    id: number;
    email: string;
    fullName: string;
    phone: string;
    bio: string;
    profileImage: string;
    storeName: string;
    storeDescription: string;
    businessAddress: string;
    isVerifiedSeller: boolean;
    totalProducts: number;
    totalRevenue: number;
    totalSales: number;
    averageRating: number;
    memberSince: string;
}

export interface SellerProductRequest {
    id: number;
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    categoryId: number;
    categoryName: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    statusDescription: string;
    adminNotes: string;
    rejectionReason: string;
    generatedAsin: string;
    createdAt: string;
    reviewedAt: string;
}

export interface SellerOrder {
    orderItemId: number;
    orderId: number;
    orderNumber: string;
    productAsin: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
    buyerName: string;
    orderStatus: string;
    orderDate: string;
}

export interface SellerReviewSummary {
    totalReviews: number;
    averageRating: number;
    ratingDistribution: Record<number, number>;
}

export interface ProductSubmission {
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    additionalImages?: string;
    categoryId: number;
}

export interface SellerRegisterData {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    storeName: string;
    storeDescription?: string;
    businessAddress?: string;
    securityQuestion: string;
    securityAnswer: string;
}