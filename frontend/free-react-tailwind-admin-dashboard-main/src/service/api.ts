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
    totalRevenue: number;
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
}

export interface ProductCreateRequest {
    asin: string;
    productName: string;
    description?: string;
    price: number;
    imageUrl?: string;
    productLink?: string;
    categoryId: number;
}

export interface ProductUpdateRequest {
    productName?: string;
    description?: string;
    price?: number;
    imageUrl?: string;
    productLink?: string;
    categoryId?: number;
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

// Order Types
export interface OrderItem {
    id?: number;
    productAsin: string;
    productName?: string;
    productImageUrl?: string;
    quantity: number;
    unitPrice?: number;
    subtotal?: number;
}

export interface Order {
    id?: number;
    userId?: number;
    userEmail?: string;
    userFullName?: string;
    orderDate?: string;
    status?: string;
    totalAmount?: number;
    items?: OrderItem[];
}

export interface OrderRequest {
    items: {
        productAsin: string;
        quantity: number;
    }[];
}

// Order API
export const orderAPI = {
    createOrder: async (request: OrderRequest): Promise<Order> => {
        const response = await api.post<ApiResponse<Order>>('/orders', request);
        return response.data.data;
    },

    getMyOrders: async (): Promise<Order[]> => {
        try {
            const response = await api.get<ApiResponse<Order[]>>('/orders/my-orders');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching my orders:', error);
            return [];
        }
    },

    getOrderById: async (id: number): Promise<Order | null> => {
        try {
            const response = await api.get<ApiResponse<Order>>(`/orders/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order:', error);
            return null;
        }
    },

    getAllOrders: async (): Promise<Order[]> => {
        try {
            const response = await api.get<ApiResponse<Order[]>>('/orders');
            return response.data.data;
        } catch (error) {
            console.error('Error fetching all orders:', error);
            return [];
        }
    },

    confirmOrder: async (id: number): Promise<Order> => {
        const response = await api.put<ApiResponse<Order>>(`/orders/${id}/confirm`);
        return response.data.data;
    },
};

export default api;