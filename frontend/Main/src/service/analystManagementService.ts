import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface Analyst {
    id: number;
    email: string;
    fullName: string;
    phone?: string;
    bio?: string;
    profileImage?: string;
    department?: string;
    specialization?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    lastLoginAt?: string;
    totalReportsGenerated?: number;
    totalExportsCreated?: number;
    lastActivityAt?: string;
}

export interface AnalystRequest {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    bio?: string;
    department?: string;
    specialization?: string;
    isActive?: boolean;
}

export interface AnalystUpdateRequest {
    email?: string;
    password?: string;
    fullName?: string;
    phone?: string;
    bio?: string;
    department?: string;
    specialization?: string;
    isActive?: boolean;
    profileImage?: string;
}

export interface AnalystSummary {
    totalAnalysts: number;
    activeAnalysts: number;
    inactiveAnalysts: number;
}

export const analystManagementService = {
    // Get all analysts (paginated)
    getAllAnalysts: async (page = 0, size = 10): Promise<{ content: Analyst[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/admin/analysts`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data.data;
    },

    // Get all analysts (no pagination)
    getAllAnalystsNoPagination: async (): Promise<Analyst[]> => {
        const response = await axios.get(`${API_URL}/admin/analysts/all`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Get analyst by ID
    getAnalystById: async (analystId: number): Promise<Analyst> => {
        const response = await axios.get(`${API_URL}/admin/analysts/${analystId}`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Create new analyst
    createAnalyst: async (data: AnalystRequest): Promise<Analyst> => {
        const response = await axios.post(`${API_URL}/admin/analysts`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Update analyst
    updateAnalyst: async (analystId: number, data: AnalystUpdateRequest): Promise<Analyst> => {
        const response = await axios.put(`${API_URL}/admin/analysts/${analystId}`, data, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Delete analyst
    deleteAnalyst: async (analystId: number): Promise<void> => {
        await axios.delete(`${API_URL}/admin/analysts/${analystId}`, {
            headers: getAuthHeader(),
        });
    },

    // Toggle analyst status
    toggleAnalystStatus: async (analystId: number): Promise<Analyst> => {
        const response = await axios.patch(`${API_URL}/admin/analysts/${analystId}/toggle-status`, {}, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Get analyst statistics
    getAnalystStatistics: async (analystId: number): Promise<Analyst> => {
        const response = await axios.get(`${API_URL}/admin/analysts/${analystId}/statistics`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    // Get analysts summary
    getAnalystsSummary: async (): Promise<AnalystSummary> => {
        const response = await axios.get(`${API_URL}/admin/analysts/summary`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },
};