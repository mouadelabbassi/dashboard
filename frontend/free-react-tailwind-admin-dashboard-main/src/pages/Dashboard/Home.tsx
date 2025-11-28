import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageMeta from '../../components/common/PageMeta';
import EcommerceMetrics from '../../components/ecommerce/EcommerceMetrics';
import TopProductTable from '../../components/ecommerce/TopProductTable';
import CategoryDistributionChart from '../../components/ecommerce/CategoryDistributionChart';
import BestsellerCards from '../../components/ecommerce/BestsellerCards';
import PriceDistributionChart from '../../components/ecommerce/PriceDistributionChart';
import RatingDistributionChart from '../../components/ecommerce/RatingDistributionChart';
import TopCategoriesRevenueChart from '../../components/ecommerce/TopCategoriesRevenueChart';
import ReviewsCorrelationChart from '../../components/ecommerce/ReviewsCorrelationChart';
import { useAuth } from '../../context/AuthContext';
import { getAdminDashboard, AdminDashboard } from '../../service/api';

const Home: React.FC = () => {
    const { user } = useAuth();
    const [adminStats, setAdminStats] = useState<AdminDashboard | null>(null);
    const [, setLoadingStats] = useState(true);

    useEffect(() => {
        fetchAdminStats();
    }, []);

    const fetchAdminStats = async () => {
        try {
            setLoadingStats(true);
            const data = await getAdminDashboard();
            setAdminStats(data);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoadingStats(false);
        }
    };

    return (
        <>
            <PageMeta
                title="Dashboard - Amazon Sales Analytics"
                description="Amazon Sales Analytics Dashboard"
            />

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user?.fullName?.split(' ')[0] || 'Admin'}!  👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here's what's happening with your platform today
                    </p>
                </div>

                {/* NEW: Admin Quick Stats - Pending Approvals & Revenue */}
                {adminStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Pending Approvals - Clickable */}
                        <Link
                            to="/admin/product-approvals"
                            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-5 text-white hover:shadow-xl transition transform hover:scale-105"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-orange-100 text-sm font-medium">Pending Approvals</p>
                                    <p className="text-3xl font-bold mt-1">{adminStats.pendingApprovals}</p>
                                </div>
                                <div className="bg-orange-400/30 p-3 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-orange-200 text-xs mt-2">Click to review →</p>
                        </Link>

                        {/* Platform Revenue */}
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm font-medium">Platform Revenue</p>
                                    <p className="text-3xl font-bold mt-1">
                                        ${adminStats.totalPlatformRevenue?. toFixed(2) || '0. 00'}
                                    </p>
                                </div>
                                <div className="bg-green-400/30 p-3 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-green-200 text-xs mt-2">From confirmed orders</p>
                        </div>

                        {/* Total Sellers */}
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm font-medium">Total Sellers</p>
                                    <p className="text-3xl font-bold mt-1">{adminStats.totalSellers || 0}</p>
                                </div>
                                <div className="bg-blue-400/30 p-3 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-blue-200 text-xs mt-2">Active sellers</p>
                        </div>

                        {/* Total Buyers */}
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm font-medium">Total Buyers</p>
                                    <p className="text-3xl font-bold mt-1">{adminStats.totalBuyers || 0}</p>
                                </div>
                                <div className="bg-purple-400/30 p-3 rounded-full">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-purple-200 text-xs mt-2">Registered buyers</p>
                        </div>
                    </div>
                )}

                {/* Existing Metrics Cards */}
                <div className="mb-6">
                    <EcommerceMetrics />
                </div>

                {/* Top 3 Bestseller Cards */}
                <BestsellerCards />

                {/* Category Distribution & Price Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <CategoryDistributionChart />
                    <PriceDistributionChart />
                </div>

                {/* Revenue by Category & Rating Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <TopCategoriesRevenueChart />
                    <RatingDistributionChart />
                </div>

                {/* Reviews vs Ranking Correlation - Full Width */}
                <div className="mb-6">
                    <ReviewsCorrelationChart />
                </div>

                {/* Top Products Table */}
                <div>
                    <TopProductTable />
                </div>
            </div>
        </>
    );
};

export default Home;
