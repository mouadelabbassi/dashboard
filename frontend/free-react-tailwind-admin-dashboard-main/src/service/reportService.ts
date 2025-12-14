import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
};

// Types for advanced report
export interface PlatformRevenue {
    totalRevenue: number;
    directSalesRevenue: number;
    commissionRevenue: number;
    sellerRevenue: number;
    totalOrders: number;
    completedOrders: number;
    avgOrderValue: number;
    revenueGrowth: number;
    thisMonthRevenue: number;
    lastMonthRevenue: number;
}

export interface TopSeller {
    rank: number;
    sellerId: number;
    sellerName: string;
    storeName: string;
    totalRevenue: number;
    productsSold: number;
    totalOrders: number;
    avgOrderValue: number;
    productCount: number;
}

export interface TopCategory {
    categoryId: number;
    categoryName: string;
    productCount: number;
    revenue: number;
    unitsSold: number;
    avgPrice: number;
    avgRating: number;
}

export interface MostSoldProduct {
    rank: number;
    asin: string;
    productName: string;
    price: number;
    salesCount: number;
    revenue: number;
    rating: number;
    categoryName: string;
    imageUrl: string;
    stockQuantity: number;
    seller: string;
}

export interface MonthlyTrend {
    month: string;
    year: number;
    monthYear: string;
    revenue: number;
    orders: number;
}

export interface CategoryDistribution {
    categoryName: string;
    revenue: number;
    percentage: number;
    productCount: number;
    color: string;
}

export interface SalesPerformance {
    todayRevenue: number;
    weekRevenue: number;
    monthRevenue: number;
    yearRevenue: number;
    bestSellingDay: string;
    bestSellingDayRevenue: number;
    conversionRate: number;
}

export interface WeeklyTrend {
    date: string;
    dayName: string;
    revenue: number;
    orders: number;
}

export interface AdvancedReportData {
    platformRevenue: PlatformRevenue;
    top3Sellers: TopSeller[];
    top3Categories: TopCategory[];
    mostSoldProducts: MostSoldProduct[];
    monthlyRevenueTrend: MonthlyTrend[];
    categoryRevenueDistribution: CategoryDistribution[];
    salesPerformance:  SalesPerformance;
    orderStatusDistribution: { [key: string]: number };
    weeklySalesTrend: WeeklyTrend[];
    kpis: any;
}

export const reportService = {
    // Get advanced report data for professional PDF export
    getAdvancedReportData: async (): Promise<AdvancedReportData> => {
        try {
            const response = await axios.get(`${API_URL}/analyst/reports/advanced`, {
                headers: getAuthHeader(),
            });
            return response.data.data;
        } catch (error) {
            console.error('Error fetching advanced report data:', error);
            throw error;
        }
    },

    // Get complete report data for Admin
    getAdminReportData: async () => {
        try {
            const [
                dashboardRes,
                productsRes,
                sellersRes,
            ] = await Promise.all([
                axios.get(`${API_URL}/admin/product-approvals/dashboard`, { headers: getAuthHeader() }),
                axios.get(`${API_URL}/products? page=0&size=20&sortBy=salesCount&sortOrder=desc`, { headers: getAuthHeader() }),
                axios.get(`${API_URL}/admin/sellers?page=0&size=10`, { headers: getAuthHeader() }),
            ]);

            const dashboard = dashboardRes.data?.data || {};
            const productsData = productsRes.data?.data?.content || productsRes.data?.data || [];
            const sellersData = sellersRes.data?.data?.content || sellersRes.data?.data || [];

            const topProducts = productsData.map((p: any) => ({
                asin: p.asin || '',
                productName: p.productName || p.product_name || 'Unknown',
                price: p.price || 0,
                salesCount: p.salesCount || p.sales_count || 0,
                revenue: (p.price || 0) * (p.salesCount || p.sales_count || 0),
                rating: p.rating || 0,
                category: p.categoryName || p.category?.name || p.category_name || 'Uncategorized',
            }));

            const topSellers = sellersData.map((s: any) => ({
                id: s.id || 0,
                storeName: s.storeName || s.store_name || s.fullName || s.full_name || 'Unknown Store',
                email: s.email || '',
                productCount: s.productCount || s.product_count || 0,
                totalSales: s.totalSales || s.total_sales || s.salesCount || 0,
                totalRevenue: s.totalRevenue || s.total_revenue || 0,
                rating: s.rating || 4.5,
            }));

            const calculatedRevenue = topProducts.reduce((sum: number, p: any) => sum + (p.revenue || 0), 0);

            return {
                kpis: {
                    totalRevenue: dashboard.totalPlatformRevenue || dashboard.totalRevenue || calculatedRevenue || 0,
                    totalOrders: dashboard.totalOrders || 0,
                    totalBuyers: dashboard.totalBuyers || 0,
                    totalSellers: dashboard.totalSellers || 0,
                    totalProducts: dashboard.totalProducts || productsData.length || 0,
                    pendingApprovals: dashboard.pendingApprovals || 0,
                    avgOrderValue: dashboard.avgOrderValue || (dashboard.totalPlatformRevenue / (dashboard.totalOrders || 1)) || 0,
                    conversionRate: dashboard.conversionRate || 0,
                },
                topProducts:  topProducts.sort((a:  any, b: any) => (b.salesCount || 0) - (a.salesCount || 0)).slice(0, 10),
                topSellers: topSellers,
                ordersByStatus: dashboard.ordersByStatus || {
                    PENDING: dashboard.pendingOrders || 0,
                    CONFIRMED: dashboard.confirmedOrders || 0,
                    SHIPPED: dashboard.shippedOrders || 0,
                    DELIVERED: dashboard.deliveredOrders || 0,
                    CANCELLED: dashboard.cancelledOrders || 0,
                },
                revenueByMonth: [],
            };
        } catch (error) {
            console.error('Error fetching admin report data:', error);
            throw error;
        }
    },

    // Get complete report data for Analyst
    getAnalystReportData: async () => {
        try {
            const [
                kpisRes,
                productsRes,
                sellersRes,
                categoriesRes,
            ] = await Promise.all([
                axios.get(`${API_URL}/analyst/kpis`, { headers: getAuthHeader() }).catch(() => null),
                axios.get(`${API_URL}/analyst/products/performance? limit=20`, { headers: getAuthHeader() }).catch(() => null),
                axios.get(`${API_URL}/analyst/sellers/ranking?limit=15`, { headers: getAuthHeader() }).catch(() => null),
                axios.get(`${API_URL}/analyst/categories/overview`, { headers: getAuthHeader() }).catch(() => null),
            ]);

            let topProducts = productsRes?.data?.data || [];
            let topSellers = sellersRes?.data?.data || [];
            let kpis = kpisRes?.data?.data || {};

            if (topProducts.length === 0) {
                const fallbackProducts = await axios.get(
                    `${API_URL}/products?page=0&size=20&sortBy=salesCount&sortOrder=desc`,
                    { headers: getAuthHeader() }
                ).catch(() => null);
                topProducts = fallbackProducts?.data?.data?.content || [];
            }

            if (topSellers.length === 0) {
                const fallbackSellers = await axios.get(
                    `${API_URL}/admin/sellers?page=0&size=15`,
                    { headers: getAuthHeader() }
                ).catch(() => null);
                topSellers = fallbackSellers?.data?.data?.content || [];
            }

            const mappedProducts = topProducts.map((p: any) => ({
                asin: p.asin || '',
                productName: p.productName || p.product_name || 'Unknown',
                price: p.price || 0,
                salesCount: p.salesCount || p.sales_count || 0,
                revenue: (p.price || 0) * (p.salesCount || p.sales_count || 0),
                rating: p.rating || 0,
                category: p.categoryName || p.category?.name || 'Uncategorized',
            }));

            const mappedSellers = topSellers.map((s: any) => ({
                id: s.id || s.sellerId || 0,
                storeName: s.storeName || s.store_name || s.sellerName || s.fullName || 'Unknown',
                email: s.email || '',
                productCount: s.productCount || s.product_count || s.products || 0,
                totalSales: s.totalSales || s.sales || s.salesCount || 0,
                totalRevenue: s.totalRevenue || s.revenue || 0,
                rating: s.rating || s.avgRating || 4.5,
            }));

            const calculatedRevenue = mappedProducts.reduce((sum: number, p:  any) => sum + (p.revenue || 0), 0);

            return {
                kpis: {
                    totalRevenue: kpis.totalRevenue?.value || calculatedRevenue || 0,
                    totalOrders: kpis.totalOrders?.value || 0,
                    totalBuyers: kpis.totalBuyers?.value || 0,
                    totalSellers:  kpis.totalSellers?.value || mappedSellers.length || 0,
                    totalProducts: kpis.totalProducts?.value || mappedProducts.length || 0,
                    pendingApprovals: 0,
                    avgOrderValue: kpis.avgOrderValue?.value || 0,
                    conversionRate: 3.5,
                },
                topProducts:  mappedProducts.sort((a: any, b: any) => (b.salesCount || 0) - (a.salesCount || 0)),
                topSellers: mappedSellers.sort((a: any, b:  any) => (b.totalRevenue || 0) - (a.totalRevenue || 0)),
                ordersByStatus: {},
                revenueByMonth:  [],
                categoryPerformance: categoriesRes?.data?.data || [],
                lowStockProducts: [],
                priceDistribution: {},
                ratingDistribution: {},
            };
        } catch (error) {
            console.error('Error fetching analyst report data:', error);
            throw error;
        }
    },
};

export default reportService;