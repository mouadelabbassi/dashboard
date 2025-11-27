export interface AdminDashboard {
    totalProducts: number;
    pendingApprovals: number;
    totalSellers: number;
    totalBuyers: number;
    totalPlatformRevenue: number;
    totalPlatformFees: number;
    todayRevenue: number;
    todayOrders: number;
}

export interface PendingProduct {
    id: number;
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    categoryId: number;
    categoryName: string;
    sellerId: number;
    sellerName: string;
    sellerStoreName: string;
    sellerEmail: string;
    submittedAt: string;
}

export interface ProductApprovalRequest {
    adminNotes?: string;
    rejectionReason?: string;
}