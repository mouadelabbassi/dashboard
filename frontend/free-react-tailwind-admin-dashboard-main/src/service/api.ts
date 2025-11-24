import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for better error handling
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
    ranking?: number;
    rank?: number;
    productName: string;
    description?: string;
    price: number;
    rating: number;
    reviewsCount: number;
    imageUrl?: string;
    productLink?: string;
    noOfSellers?: number;
    // Backend returns these fields:
    categoryId?: number;
    categoryName?: string;
    // Keep this for backward compatibility:
    category?: string;
    isBestseller?: boolean;
    createdAt?: string;
    updatedAt?: string;
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
        // @ts-ignore
        return ;
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

// Search and Filter Products
export const searchProducts = async (filters: SearchFilters, page: number = 0, size: number = 1000): Promise<Product[]> => {
    try {
        // If there's a search query, use the /search endpoint
        if (filters.query && filters.query.trim()) {
            const response = await api.get('/products/search', {
                params: { q: filters.query, page, size }
            });

            if (response.data && response.data.data && response.data.data.content) {
                return response.data.data.content;
            }
            return [];
        }

        // Otherwise use the /filter endpoint
        const params: any = {
            page,
            size,
            sortBy: 'ranking'
        };

        if (filters.category) params.categoryName = filters.category;  // CHANGED: categoryName instead of category
        if (filters.minPrice) params.minPrice = filters.minPrice;
        if (filters.maxPrice) params.maxPrice = filters.maxPrice;
        if (filters.minRating) params.minRating = filters.minRating;

        const response = await api.get('/products/filter', {
            params
        });

        if (response.data && response.data.data && response.data.data.content) {
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
    try {
        await api.delete(`/products/${asin}`);
    } catch (error) {
        console.error('Error deleting product:', error);
        throw error;
    }
};

// Sales API
export const salesAPI = {
    getMonthly: async (year: number) => {
        try {
            const response = await api.get(`/sales/monthly?year=${year}`);
            return response;
        } catch (error) {
            console.error('Error fetching monthly sales:', error);
            return {
                data: {
                    success: false,
                    data: {}
                }
            };
        }
    },
    getRevenue: async () => {
        try {
            const response = await api.get('/sales/revenue');
            return response;
        } catch (error) {
            console.error('Error fetching revenue:', error);
            return {
                data: {
                    success: false,
                    data: 0
                }
            };
        }
    },
};

// Dashboard API
export const dashboardAPI = {
    getPriceDistribution: async () => {
        try {
            const response = await api.get('/dashboard/price-distribution');
            return response;
        } catch (error) {
            console.error('Error fetching price distribution:', error);
            return {
                data: {
                    success: false,
                    data: {}
                }
            };
        }
    },
};

export default api;