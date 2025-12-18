import axios from 'axios';

export interface Notification {
    id: number;
    type: string;
    typeDescription: string;
    title: string;
    message: string;
    referenceId: string;
    referenceType: string;
    actionUrl: string;
    isRead: boolean;
    readAt: string | null;
    createdAt: string;
}

const API_URL = import.meta.env. VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export const notificationService = {
    getNotifications: async (page = 0, size = 20): Promise<{ content: Notification[]; totalPages: number; totalElements: number }> => {
        const response = await axios.get(`${API_URL}/notifications`, {
            headers: getAuthHeader(),
            params: { page, size },
        });
        return response.data. data;
    },

    getUnreadNotifications: async (): Promise<Notification[]> => {
        const response = await axios.get(`${API_URL}/notifications/unread`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getUnreadCount: async (): Promise<number> => {
        const response = await axios. get(`${API_URL}/notifications/unread/count`, {
            headers: getAuthHeader(),
        });
        return response.data.data. count;
    },

    // ✅ FIXED: Changed PUT to PATCH to match backend NotificationController
    markAsRead: async (id: number): Promise<void> => {
        await axios.patch(`${API_URL}/notifications/${id}/read`, null, {
            headers: getAuthHeader(),
        });
    },

    // ✅ FIXED: Changed PUT to PATCH to match backend NotificationController
    markAllAsRead: async (): Promise<void> => {
        await axios.patch(`${API_URL}/notifications/read-all`, null, {
            headers: getAuthHeader(),
        });
    },

    markMultipleAsRead: async (ids: number[]): Promise<void> => {
        await axios.patch(`${API_URL}/notifications/read-multiple`, ids, {
            headers: getAuthHeader(),
        });
    },

    // ✅ NEW: Delete notification
    deleteNotification: async (id: number): Promise<void> => {
        await axios.delete(`${API_URL}/notifications/${id}`, {
            headers: getAuthHeader(),
        });
    },
};