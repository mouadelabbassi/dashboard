import React from 'react';
import PageMeta from '../../components/common/PageMeta';
import EcommerceMetrics from '../../components/ecommerce/EcommerceMetrics';
import MonthlySalesChart from '../../components/ecommerce/MonthlySalesChart';
import MonthlyTarget from '../../components/ecommerce/MonthlyTarget';
import StatisticsChart from '../../components/ecommerce/StatisticsChart';
import TopProductTable from '../../components/ecommerce/TopProductTable';

const Home: React.FC = () => {
    return (
        <>
            <PageMeta
                title="Dashboard - TailAdmin"
                description="Amazon Sales Analytics Dashboard"
            />

            <div className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Dashboard
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Welcome to your Amazon Sales Analytics Dashboard
                    </p>
                </div>

                {/* Metrics Cards */}
                <div className="mb-6">
                    <EcommerceMetrics />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <MonthlySalesChart />
                    <MonthlyTarget />
                </div>

                {/* Statistics Chart */}
                <div className="mb-6">
                    <StatisticsChart />
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