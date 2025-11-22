import axios from 'axios';

// Base API URL - Backend running on port 8080
const API_BASE_URL = 'http://localhost:8080/api';

// Create axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 seconds timeout
});

// Request interceptor for error handling
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', config.method?.toUpperCase(), config.url);
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
    },
    (error) => {
        console.error('Response Error:', error.response?.status, error.message);
        return Promise.reject(error);
    }
);

// ===========================
// TYPE DEFINITIONS
// ===========================

export interface Product {
    id: number;
    asin: string;
    category: string;
    productLink: string;
    numberOfSellers: string;
    rank: number;
    rating: number;
    reviewsCount: string;
    price: number;
}

export interface DashboardStats {
    totalProducts: number;
    totalCategories: number;
    averageGlobalPrice: number;
    averageGlobalRating: number;
    distributionByCategory: CategoryDistribution[];
    topProducts: Product[];
    categoryInsights?: any;
}

export interface CategoryDistribution {
    category: string;
    count: number;
    averagePrice: number;
}

export interface CategoryAnalytics {
    category: string;
    averagePrice: number;
    bestRatedProduct: Product;
    mostReviewedProduct: Product;
    ratingDistribution: number[];
    productCount: number;
}

export interface Alert {
    type: string;
    message: string;
    category?: string;
    product?: Product;
    timestamp: string;
}

export interface SearchFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
}

// ===========================
// DASHBOARD APIs
// ===========================

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/dashboard/stats');
    return response.data;
};

export const getCategoryDistribution = async (): Promise<CategoryDistribution[]> => {
    const response = await api.get<CategoryDistribution[]>('/dashboard/distribution');
    return response.data;
};

export const getCategoryAnalytics = async (category: string): Promise<CategoryAnalytics> => {
    const response = await api.get<CategoryAnalytics>(`/dashboard/category/${encodeURIComponent(category)}`);
    return response.data;
};

export const getAlerts = async (): Promise<Alert[]> => {
    const response = await api.get<Alert[]>('/dashboard/alerts');
    return response.data;
};

// ===========================
// PRODUCTS APIs
// ===========================

export const getAllProducts = async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products');
    return response.data;
};

export const getProductById = async (id: number): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
};

export const getProductByAsin = async (asin: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/asin/${asin}`);
    return response.data;
};

export const getTopProducts = async (limit: number = 10): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/top/${limit}`);
    return response.data;
};

export const searchProducts = async (filters: SearchFilters): Promise<Product[]> => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
    if (filters.minRating !== undefined) params.append('minRating', filters.minRating.toString());

    const response = await api.get<Product[]>(`/products/search?${params.toString()}`);
    return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
    const response = await api.post<Product>('/products', productData);
    return response.data;
};

export const updateProduct = async (id: number, productData: Partial<Product>): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, productData);
    return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
};

// ===========================
// DATA IMPORT API
// ===========================

export const importCSV = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<string>('/import/csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export default api;