import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
        } else if (error.request) {
            console.error('Network Error:', error.message);
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

export interface DashboardStats {
    totalProducts: number;
    totalCategories: number;
    avgPrice: number;
    avgRating: number;
    totalReviews: number;
    totalRevenue: number;      // AJOUTE SI MANQUANT
    totalSales: number;        // AJOUTE CETTE LIGNE
    totalInventoryValue: number;
}

export interface Product {
    asin: string;
    productName: string;
    description?: string;
    price: number;
    rating: number;
    reviewsCount: number;
    imageUrl?: string;
    productLink?: string;
    noOfSellers?: number;
    ranking?: number;
    rank?: number;
    categoryId?: number;
    categoryName?: string;
    category?: string;
    isBestseller?: boolean;
    createdAt?: string;
    updatedAt?: string;
    // NEW: Add these seller fields
    sellerId?: number;
    sellerName?: string;
    stockQuantity?: number;
    salesCount?: number;
    approvalStatus?: string;
}

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
    revenueTrend: { date: string; revenue: number }[];
    topProducts: { asin: string; productName: string; unitsSold: number; revenue: number }[];
}

export interface SellerProductSubmission {
    productName: string;
    description: string;
    price: number;
    stockQuantity: number;
    imageUrl: string;
    categoryId: number;
}


export interface ProductCreateRequest {
    asin: string;
    productName: string;
    description?: string;
    price: number;
    imageUrl?: string;
    productLink?: string;
    categoryId: number;
    stockQuantity?: number;

}

export interface ProductUpdateRequest {
    productName?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    productLink?: string;
    categoryId?: number;
    stockQuantity?: number;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    productCount: number;
}

export interface CategoryRevenue {
    name: string;
    productCount: number;
    estimatedRevenue: number;
    avgPrice: number;
}

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

export interface ProductWithSeller extends Product {
    sellerId?: number;
    sellerName?: string;
    stockQuantity?: number;
    approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface CorrelationPoint {
    asin: string;
    name: string;
    reviews: number;
    ranking: number;
    rating: number;
    price: number;
    category: string;
}

export interface SearchFilters {
    query?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    maxRating?: number;
}

export interface PagedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

// Order Types
export interface OrderItemRequest {
    productAsin: string;
    quantity: number;
}

export interface OrderRequest {
    items: OrderItemRequest[];
    notes?: string;
}

export interface OrderItemResponse {
    id: number;
    productAsin: string;
    productName: string;
    productImage: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
}

export interface OrderResponse {
    id: number;
    orderNumber: string;
    userId: number;
    userName: string;
    userEmail: string;
    status: string;
    statusDescription: string;
    totalAmount: number;
    totalItems: number;
    orderDate: string;
    confirmedAt: string | null;
    cancelledAt: string | null;
    notes: string | null;
    items: OrderItemResponse[];
    createdAt: string;
}

// Notification Types
export interface NotificationResponse {
    id: number;
    type: string;
    typeDescription: string;
    title: string;
    message: string;
    referenceId: number;
    referenceType: string;
    buyerName: string;
    buyerEmail: string;
    orderTotal: string;
    itemsCount: number;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}


export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

// Dashboard Stats
export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

export const getAdminDashboard = async (): Promise<AdminDashboard> => {
    const response = await api.get<ApiResponse<AdminDashboard>>('/admin/product-approvals/dashboard');
    return response.data.data;
};

// Get Pending Products
export const getPendingProducts = async (page: number = 0, size: number = 10): Promise<PagedResponse<PendingProduct>> => {
    const response = await api.get<ApiResponse<PagedResponse<PendingProduct>>>('/admin/product-approvals/pending', {
        params: { page, size }
    });
    return response.data.data;
};

// Approve Product
export const approveProduct = async (requestId: number, adminNotes?: string): Promise<void> => {
    await api.post(`/admin/product-approvals/${requestId}/approve`, { adminNotes });
};

// Reject Product
export const rejectProduct = async (requestId: number, rejectionReason: string, adminNotes?: string): Promise<void> => {
    await api.post(`/admin/product-approvals/${requestId}/reject`, { rejectionReason, adminNotes });
};

// Top Products
export const getTopProducts = async (limit: number = 10): Promise<Product[]> => {
    try {
        const response = await api.get<ApiResponse<Product[]>>(`/products/top/${limit}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching top products:', error);
        return [];
    }
};

// All Products with pagination
export const getAllProducts = async (page: number = 0, size: number = 1000): Promise<Product[]> => {
    try {
        const response = await api.get<ApiResponse<PagedResponse<Product>>>('/products', {
            params: { page, size, sortBy: 'ranking', direction: 'asc' }
        });
        return response.data.data.content;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
};

// Get single product by ASIN
export const getProductByAsin = async (asin: string): Promise<Product | null> => {
    try {
        const response = await api.get<ApiResponse<Product>>(`/products/${asin}`);
        return response.data.data;
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
};

export const createOrder = async (order: OrderRequest): Promise<OrderResponse> => {
    const response = await api.post<ApiResponse<OrderResponse>>('/orders', order);
    return response.data.data;
};

// Confirm Order
export const confirmOrder = async (orderId: number): Promise<OrderResponse> => {
    const response = await api.post<ApiResponse<OrderResponse>>(`/orders/${orderId}/confirm`);
    return response.data.data;
};

// Cancel Order
export const cancelOrder = async (orderId: number): Promise<OrderResponse> => {
    const response = await api.post<ApiResponse<OrderResponse>>(`/orders/${orderId}/cancel`);
    return response.data.data;
};

// Get My Orders
export const getMyOrders = async (): Promise<OrderResponse[]> => {
    const response = await api.get<ApiResponse<OrderResponse[]>>('/orders/my-orders');
    return response.data.data;
};

export const getSellerDashboard = async (): Promise<SellerDashboard> => {
    const response = await api.get<ApiResponse<SellerDashboard>>('/seller/dashboard');
    return response.data.data;
};

// Submit Product for Approval
export const submitProductForApproval = async (product: SellerProductSubmission): Promise<void> => {
    await api.post('/seller/products/submit', product);
};

// Get My Products (Seller)
export const getMySellerProducts = async (page: number = 0, size: number = 10): Promise<PagedResponse<ProductWithSeller>> => {
    const response = await api.get<ApiResponse<PagedResponse<ProductWithSeller>>>('/seller/products', {
        params: { page, size }
    });
    return response.data.data;
};

// Get My Sold Orders (Seller)
export const getMySoldOrders = async (page: number = 0, size: number = 10): Promise<PagedResponse<OrderResponse>> => {
    const response = await api.get<ApiResponse<PagedResponse<OrderResponse>>>('/seller/orders', {
        params: { page, size }
    });
    return response.data.data;
};
// Get Order by ID
export const getOrderById = async (orderId: number): Promise<OrderResponse> => {
    const response = await api.get<ApiResponse<OrderResponse>>(`/orders/${orderId}`);
    return response.data.data;
};

// Get All Orders (Admin)
export const getAllOrders = async (page: number = 0, size: number = 20): Promise<PagedResponse<OrderResponse>> => {
    const response = await api.get<ApiResponse<PagedResponse<OrderResponse>>>('/orders', {
        params: { page, size }
    });
    return response.data.data;
};

// Get Recent Orders (Admin)
export const getRecentOrders = async (limit: number = 10): Promise<OrderResponse[]> => {
    const response = await api.get<ApiResponse<OrderResponse[]>>('/orders/recent', {
        params: { limit }
    });
    return response.data.data;
};
// Create Product
export const createProduct = async (product: ProductCreateRequest): Promise<Product> => {
    const response = await api.post<ApiResponse<Product>>('/products', product);
    return response.data.data;
};

// Update Product
export const updateProduct = async (asin: string, product: ProductUpdateRequest): Promise<Product> => {
    const response = await api.put<ApiResponse<Product>>(`/products/${asin}`, product);
    return response.data.data;
};

// Search and Filter Products
export const searchProducts = async (filters: SearchFilters, page: number = 0, size: number = 1000): Promise<Product[]> => {
    try {
        if (filters.query && filters.query.trim()) {
            const response = await api.get('/products/search', {
                params: { q: filters.query, page, size }
            });
            if (response.data?.data?.content) {
                return response.data.data.content;
            }
            return [];
        }

        const params: any = { page, size, sortBy: 'ranking' };
        if (filters.category) params.categoryName = filters.category;
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.minRating) params.minRating = filters.minRating;

        const response = await api.get('/products/filter', { params });
        if (response.data?.data?.content) {
            return response.data.data.content;
        }
        return [];
    } catch (error) {
        console.error('Error searching/filtering products:', error);
        return [];
    }
};

// Delete Product
export const deleteProduct = async (asin: string): Promise<void> => {
    await api.delete(`/products/${asin}`);
};

// Get all categories
export const getCategories = async (): Promise<Category[]> => {
    try {
        const response = await api.get<ApiResponse<Category[]>>('/categories');
        return response.data.data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
};

export const getNotifications = async (): Promise<NotificationResponse[]> => {
    const response = await api.get<ApiResponse<NotificationResponse[]>>('/notifications');
    return response.data.data;
};

// Get Unread Notifications
export const getUnreadNotifications = async (): Promise<NotificationResponse[]> => {
    const response = await api.get<ApiResponse<NotificationResponse[]>>('/notifications/unread');
    return response.data.data;
};

// Get Unread Count
export const getUnreadNotificationCount = async (): Promise<number> => {
    const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread/count');
    return response.data.data.count;
};

// Mark Notification as Read
export const markNotificationAsRead = async (notificationId: number): Promise<NotificationResponse> => {
    const response = await api.patch<ApiResponse<NotificationResponse>>(`/notifications/${notificationId}/read`);
    return response.data.data;
};

// Mark All as Read
export const markAllNotificationsAsRead = async (): Promise<void> => {
    await api.patch('/notifications/read-all');
};

// Delete Notification
export const deleteNotification = async (notificationId: number): Promise<void> => {
    await api.delete(`/notifications/${notificationId}`);
};

// Dashboard API
export const dashboardAPI = {
    getStats: async () => api.get('/dashboard/stats'),
    getPriceDistribution: async () => api.get('/dashboard/price-distribution'),
    getRatingDistribution: async () => api.get('/dashboard/rating-distribution'),
    getCategoryDistribution: async () => api.get('/dashboard/category-distribution'),
    getCategoryRevenue: async () => api.get<ApiResponse<CategoryRevenue[]>>('/dashboard/category-revenue'),
    getBestsellers: async () => api.get<ApiResponse<Product[]>>('/dashboard/bestsellers'),
    getCorrelationData: async () => api.get<ApiResponse<CorrelationPoint[]>>('/dashboard/reviews-ranking-correlation'),
    getTrends: async () => api.get('/dashboard/trends'),
    getTopProducts: (limit: number = 10) => api.get(`/dashboard/top-products? limit=${limit}`),
};

// Sales API
export const salesAPI = {
    getMonthly: async (year: number) => {
        try {
            return await api.get(`/sales/monthly?year=${year}`);
        } catch (error) {
            console.error('Error fetching monthly sales:', error);
            return { data: { success: false, data: {} } };
        }
    },
    getRevenue: async () => {
        try {
            return await api.get('/sales/revenue');
        } catch (error) {
            console.error('Error fetching revenue:', error);
            return { data: { success: false, data: 0 } };
        }
    },
};

export default api;