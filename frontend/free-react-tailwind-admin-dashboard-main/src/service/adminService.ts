import axios from 'axios';
import { AdminDashboard, PendingProduct, ProductApprovalRequest } from '../types/admin';
import { SellerProductRequest } from '../types/seller';

const API_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const adminService = {
    // Dashboard
    getDashboard: async (): Promise<AdminDashboard> => {
        const response = await axios.get(`${API_URL}/admin/product-approvals/dashboard`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Pending Products
    getPendingProducts: async (page = 0, size = 10): Promise<{ content: PendingProduct[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/admin/product-approvals/pending`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    getPendingProductDetails: async (requestId: number): Promise<PendingProduct> => {
        const response = await axios.get(`${API_URL}/admin/product-approvals/pending/${requestId}`, {
            headers: getAuthHeader(),
        });
        return response.data. data;
    },

    approveProduct: async (requestId: number, data?: ProductApprovalRequest): Promise<SellerProductRequest> => {
        const response = await axios. post(`${API_URL}/admin/product-approvals/${requestId}/approve`, data || {}, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    rejectProduct: async (requestId: number, data: ProductApprovalRequest): Promise<SellerProductRequest> => {
        const response = await axios. post(`${API_URL}/admin/product-approvals/${requestId}/reject`, data, {
            headers: getAuthHeader(),
        });
        return response.data. data;
    },

    getAllProductRequests: async (page = 0, size = 10): Promise<{ content: SellerProductRequest[]; totalPages: number }> => {
        const response = await axios.get(`${API_URL}/admin/product-approvals/all`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    getProductRequestsByStatus: async (status: string, page = 0, size = 10): Promise<{ content: SellerProductRequest[]; totalPages: number }> => {
        const response = await axios. get(`${API_URL}/admin/product-approvals/status/${status}`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response. data.data;
    },
};