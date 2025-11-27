import axios from 'axios';
import {
    SellerDashboard,
    SellerProfile,
    SellerProductRequest,
    SellerOrder,
    SellerReviewSummary,
    ProductSubmission,
} from '../types/seller';
import { Product, Review } from '../types/product';

const API_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const sellerService = {
    // Dashboard
    getDashboard: async (): Promise<SellerDashboard> => {
        const response = await axios. get(`${API_URL}/seller/dashboard`, {
            headers: getAuthHeader(),
        });
        return response.data. data;
    },

    // Profile
    getProfile: async (): Promise<SellerProfile> => {
        const response = await axios.get(`${API_URL}/seller/profile`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    updateProfile: async (data: Partial<SellerProfile>): Promise<SellerProfile> => {
        const response = await axios.put(`${API_URL}/seller/profile`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Product Submission
    submitProduct: async (data: ProductSubmission): Promise<SellerProductRequest> => {
        const response = await axios. post(`${API_URL}/seller/products/submit`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getProductRequests: async (page = 0, size = 10): Promise<{ content: SellerProductRequest[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/seller/products/requests`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    getProductRequestById: async (requestId: number): Promise<SellerProductRequest> => {
        const response = await axios. get(`${API_URL}/seller/products/requests/${requestId}`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Products
    getMyProducts: async (page = 0, size = 10): Promise<{ content: Product[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/seller/products`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    getMyProductsByStatus: async (status: string, page = 0, size = 10): Promise<{ content: Product[]; totalPages: number }> => {
        const response = await axios.get(`${API_URL}/seller/products/status/${status}`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response. data.data;
    },

    getMyProductByAsin: async (asin: string): Promise<Product> => {
        const response = await axios. get(`${API_URL}/seller/products/${asin}`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    updateMyProduct: async (asin: string, data: Partial<ProductSubmission>): Promise<Product> => {
        const response = await axios.put(`${API_URL}/seller/products/${asin}`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Orders
    getMySoldOrders: async (page = 0, size = 10): Promise<{ content: SellerOrder[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/seller/orders`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data. data;
    },

    // Reviews
    getMyProductReviews: async (page = 0, size = 10): Promise<{ content: Review[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/seller/reviews`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response. data.data;
    },

    getReviewSummary: async (): Promise<SellerReviewSummary> => {
        const response = await axios.get(`${API_URL}/seller/reviews/summary`, {
            headers: getAuthHeader(),
        });
        return response. data.data;
    },
};