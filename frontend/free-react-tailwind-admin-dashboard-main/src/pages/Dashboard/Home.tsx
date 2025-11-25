import React from 'react';
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

const Home: React.FC = () => {
    const { user } = useAuth();

    return (
        <>
            <PageMeta
                title="Dashboard - Amazon Sales Analytics"
                description="Amazon Sales Analytics Dashboard"
            />

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Welcome back, {user?.fullName?.split(' ')[0] || 'User'}! 👋
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Here's what's happening with your Amazon sales today
                    </p>
                </div>

                {/* Metrics Cards */}
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