import axios from 'axios';
import { SellerRegisterData } from '../types/seller';

const API_URL = 'http://localhost:8080/api';

export interface LoginData {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    password: string;
    fullName: string;
    role?: string;
    securityQuestion: string;
    securityAnswer: string;
}

export interface AuthResponse {
    token: string;
    type: string;
    id: number;
    email: string;
    fullName: string;
    role: string;
    storeName?: string;
}

export const authService = {
    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await axios.post(`${API_URL}/auth/login`, data);
        return response.data.data;
    },

    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await axios. post(`${API_URL}/auth/register`, data);
        return response.data. data;
    },

    registerSeller: async (data: SellerRegisterData): Promise<AuthResponse> => {
        const response = await axios.post(`${API_URL}/auth/register/seller`, data);
        return response.data. data;
    },

    getSecurityQuestion: async (email: string): Promise<string> => {
        const response = await axios.post(`${API_URL}/auth/forgot-password`, null, {
            params: { email },
        });
        return response.data.data. securityQuestion;
    },

    resetPassword: async (email: string, securityAnswer: string, newPassword: string): Promise<void> => {
        await axios.post(`${API_URL}/auth/reset-password`, null, {
            params: { email, securityAnswer, newPassword },
        });
    },

    getCurrentUser: async () => {
        const token = localStorage.getItem('token');
        const response = await axios. get(`${API_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data;
    },

    getAvailableRoles: async (): Promise<Record<string, string>> => {
        const response = await axios. get(`${API_URL}/auth/roles`);
        return response.data.data;
    },
};