import axios from 'axios';
import api from './api';

const API_URL = import.meta.env. VITE_API_URL || 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

export interface KPI {
    value: number;
    growth: number;
    trend: 'up' | 'down' | 'stable';
}

export interface SalesTrendPoint {
    date: string;
    revenue: number;
    orders: number;
    items: number;
}

export interface CategorySales {
    categoryId: number;
    categoryName: string;
    productCount: number;
    revenue: number;
    unitsSold: number;
}

export interface TopProduct {
    asin: string;
    productName: string;
    price: number;
    salesCount: number;
    revenue: number;
    rating: number;
    categoryName: string;
    imageUrl: string;
}

export interface ProductPerformance {
    asin: string;
    name: string;
    price: number;
    rating: number;
    sales: number;
    reviews: number;
    category: string;
}

export interface SellerRanking {
    rank: number;
    sellerId: number;
    sellerName: string;
    storeName: string;
    totalRevenue: number;
    productsSold: number;
    totalOrders: number;
}

export interface CategoryOverview {
    id: number;
    name: string;
    productCount: number;
    avgPrice: number;
    avgRating: number;
    totalSales: number;
    revenue: number;
    percentage?: number;
}

export const analystService = {

    getDashboard: async () => {
        const response = await axios.get(`${API_URL}/analyst/dashboard`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getKPIs: async () => {
        const response = await axios. get(`${API_URL}/analyst/kpis`, {
            headers: getAuthHeader(),
        });
        return response.data. data;
    },

    getSalesOverview: async (startDate?: string, endDate?: string) => {
        const params: any = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const response = await axios.get(`${API_URL}/analyst/sales/overview`, {
            headers: getAuthHeader(),
            params,
        });
        return response.data.data;
    },

    getSalesTrends: async (period: string = 'daily', days: number = 30): Promise<SalesTrendPoint[]> => {
        const response = await axios.get(`${API_URL}/analyst/sales/trends`, {
            headers: getAuthHeader(),
            params: { period, days },
        });
        return response.data.data;
    },

    getSalesByCategory: async (): Promise<CategorySales[]> => {
        const response = await axios.get(`${API_URL}/analyst/sales/by-category`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getTopSellingProducts: async (limit: number = 10): Promise<TopProduct[]> => {
        const response = await axios.get(`${API_URL}/analyst/sales/top-products`, {
            headers: getAuthHeader(),
            params: { limit },
        });
        return response.data.data;
    },

    getSalesGrowth: async () => {
        const response = await axios.get(`${API_URL}/analyst/sales/growth`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getPeakSalesTimes: async () => {
        const response = await axios.get(`${API_URL}/analyst/sales/peak-times`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },


    getProductsOverview: async () => {
        const response = await axios.get(`${API_URL}/analyst/products/overview`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getProductPerformance: async (limit: number = 100): Promise<ProductPerformance[]> => {
        const response = await axios.get(`${API_URL}/analyst/products/performance`, {
            headers: getAuthHeader(),
            params: { limit },
        });
        return response.data.data;
    },

    getPriceDistribution: async () => {
        const response = await axios.get(`${API_URL}/analyst/products/price-distribution`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getRatingDistribution: async () => {
        const response = await axios.get(`${API_URL}/analyst/products/rating-distribution`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getLowStockProducts: async (threshold: number = 10) => {
        const response = await axios.get(`${API_URL}/analyst/products/low-stock`, {
            headers: getAuthHeader(),
            params: { threshold },
        });
        return response.data.data;
    },

    getBestsellerTrends: async (): Promise<any[]> => {
        const response = await api.get('/analyst/products/bestseller-trends');
        return response. data. data || [];
    },

    getSellersOverview: async () => {
        const response = await axios.get(`${API_URL}/analyst/sellers/overview`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getSellersRanking: async (limit: number = 10): Promise<SellerRanking[]> => {
        const response = await axios.get(`${API_URL}/analyst/sellers/ranking`, {
            headers: getAuthHeader(),
            params: { limit },
        });
        return response.data.data;
    },

    getSellerGrowth: async () => {
        const response = await axios.get(`${API_URL}/analyst/sellers/growth`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getPlatformComparison: async () => {
        const response = await axios.get(`${API_URL}/analyst/sellers/platform-comparison`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getSellerDetails: async (sellerId: number) => {
        const response = await axios.get(`${API_URL}/analyst/sellers/${sellerId}/details`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },


    getCategoriesOverview: async (): Promise<CategoryOverview[]> => {
        const response = await axios.get(`${API_URL}/analyst/categories/overview`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getCategoryMetrics: async (categoryId: number) => {
        const response = await axios.get(`${API_URL}/analyst/categories/${categoryId}/metrics`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getCategoryComparison: async () => {
        const response = await axios.get(`${API_URL}/analyst/categories/comparison`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    getCategoryRevenueContribution: async () => {
        const response = await axios.get(`${API_URL}/analyst/categories/revenue-contribution`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },


    getReportSummary: async (startDate: string, endDate: string) => {
        const response = await axios.get(`${API_URL}/analyst/reports/summary`, {
            headers: getAuthHeader(),
            params: { startDate, endDate },
        });
        return response.data.data;
    },

    exportSalesData: async (startDate: string, endDate: string) => {
        const response = await axios.get(`${API_URL}/analyst/reports/export/sales`, {
            headers: getAuthHeader(),
            params: { startDate, endDate },
        });
        return response.data.data;
    },

    exportProductsData: async () => {
        const response = await axios.get(`${API_URL}/analyst/reports/export/products`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },

    exportSellersData: async () => {
        const response = await axios.get(`${API_URL}/analyst/reports/export/sellers`, {
            headers: getAuthHeader(),
        });
        return response.data.data;
    },
};

export default analystService;