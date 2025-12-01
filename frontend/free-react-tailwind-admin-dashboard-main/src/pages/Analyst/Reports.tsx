import React, { useState } from 'react';
import { analystService } from '../../service/analystService';

const Reports: React.FC = () => {
    const [startDate, setStartDate] = useState<string>(() => {
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState<string>(() => {
        return new Date().toISOString().split('T')[0];
    });
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState<string | null>(null);

    const generateReport = async () => {
        try {
            setLoading(true);
            const data = await analystService.getReportSummary(startDate, endDate);
            setReportData(data);
        } catch (error) {
            console.error('Error generating report:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = (data: any[], filename: string) => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
                    // Handle values with commas or quotes
                    if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                        return `"${value.replace(/"/g, '""')}"`;
                    }
                    return value;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    const handleExportSales = async () => {
        try {
            setExportLoading('sales');
            const data = await analystService.exportSalesData(startDate, endDate);
            exportToCSV(data, 'sales_report');
        } catch (error) {
            console.error('Error exporting sales:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportProducts = async () => {
        try {
            setExportLoading('products');
            const data = await analystService.exportProductsData();
            exportToCSV(data, 'products_report');
        } catch (error) {
            console.error('Error exporting products:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportSellers = async () => {
        try {
            setExportLoading('sellers');
            const data = await analystService.exportSellersData();
            exportToCSV(data, 'sellers_report');
        } catch (error) {
            console.error('Error exporting sellers:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    📑 Reports & Export
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Generate reports and export data for analysis
                </p>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    📅 Select Date Range
                </h3>
                <div className="flex flex-wrap items-end gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </>
                        ) : (
                            <>
                                <span>📊</span>
                                Generate Report
                            </>
                        )}
                    </button>
                </div>

                {/* Quick Date Selectors */}
                <div className="flex flex-wrap gap-2 mt-4">
                    <button
                        onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(end.getDate() - 7);
                            setStartDate(start.toISOString().split('T')[0]);
                            setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Last 7 days
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setMonth(end.getMonth() - 1);
                            setStartDate(start.toISOString().split('T')[0]);
                            setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Last 30 days
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setMonth(end.getMonth() - 3);
                            setStartDate(start.toISOString().split('T')[0]);
                            setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Last 3 months
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const start = new Date(end.getFullYear(), 0, 1);
                            setStartDate(start.toISOString().split('T')[0]);
                            setEndDate(end.toISOString().split('T')[0]);
                        }}
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                        Year to date
                    </button>
                </div>
            </div>

            {/* Export Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Sales Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <span className="text-2xl">💰</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Sales Data
                            </h3>
                            <p className="text-sm text-gray-500">Export order history</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Export all orders within the selected date range including customer info, amounts, and status.
                    </p>
                    <button
                        onClick={handleExportSales}
                        disabled={exportLoading === 'sales'}
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {exportLoading === 'sales' ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                Export CSV
                            </>
                        )}
                    </button>
                </div>

                {/* Products Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <span className="text-2xl">📦</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Products Data
                            </h3>
                            <p className="text-sm text-gray-500">Export product catalog</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Export complete product catalog with prices, ratings, reviews, stock, and sales data.
                    </p>
                    <button
                        onClick={handleExportProducts}
                        disabled={exportLoading === 'products'}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {exportLoading === 'products' ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                Export CSV
                            </>
                        )}
                    </button>
                </div>

                {/* Sellers Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <span className="text-2xl">🏪</span>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Sellers Data
                            </h3>
                            <p className="text-sm text-gray-500">Export seller performance</p>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Export seller rankings with revenue, products sold, and order counts.
                    </p>
                    <button
                        onClick={handleExportSellers}
                        disabled={exportLoading === 'sellers'}
                        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                        {exportLoading === 'sellers' ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Exporting...
                            </>
                        ) : (
                            <>
                                <span>📥</span>
                                Export CSV
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Generated Report */}
            {reportData && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">📊 Report Summary</h3>
                            <span className="text-blue-200 text-sm">
                                {startDate} to {endDate}
                            </span>
                        </div>

                        {reportData.sales && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-blue-200 text-sm">Total Revenue</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {formatCurrency(reportData.sales.totalRevenue)}
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-blue-200 text-sm">Total Orders</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {reportData.sales.totalOrders}
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-blue-200 text-sm">Items Sold</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {reportData.sales.totalItems}
                                    </p>
                                </div>
                                <div className="bg-white/10 rounded-xl p-4">
                                    <p className="text-blue-200 text-sm">Avg Order Value</p>
                                    <p className="text-2xl font-bold mt-1">
                                        {formatCurrency(reportData.sales.avgOrderValue)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Top Products in Period */}
                    {reportData.topProducts && reportData.topProducts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                🏆 Top Products in Period
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                                        <th className="pb-4 font-medium">Rank</th>
                                        <th className="pb-4 font-medium">Product</th>
                                        <th className="pb-4 font-medium text-right">Price</th>
                                        <th className="pb-4 font-medium text-right">Units Sold</th>
                                        <th className="pb-4 font-medium text-right">Revenue</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reportData.topProducts.slice(0, 10).map((product: any, index: number) => (
                                        <tr key={product.asin} className="border-t border-gray-100 dark:border-gray-700">
                                            <td className="py-3">
                                                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                        index === 0 ?  'bg-yellow-100 text-yellow-700' :
                                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                                index === 2 ? 'bg-orange-100 text-orange-700' :
                                                                    'bg-gray-50 text-gray-600'
                                                    }`}>
                                                        {index + 1}
                                                    </span>
                                            </td>
                                            <td className="py-3">
                                                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                                    {product.productName}
                                                </p>
                                            </td>
                                            <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                                                {formatCurrency(product.price)}
                                            </td>
                                            <td className="py-3 text-right text-gray-600 dark:text-gray-400">
                                                {product.salesCount}
                                            </td>
                                            <td className="py-3 text-right font-bold text-green-600">
                                                {formatCurrency(product.revenue)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Category Breakdown */}
                    {reportData.categories && reportData.categories.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                📈 Category Performance
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {reportData.categories.slice(0, 8).map((category: any) => (
                                    <div
                                        key={category.categoryId}
                                        className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4"
                                    >
                                        <p className="font-medium text-gray-900 dark:text-white truncate">
                                            {category.categoryName}
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 mt-1">
                                            {formatCurrency(category.revenue)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {category.unitsSold} units • {category.productCount} products
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Help Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    💡 Tips for Data Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span>📊</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Trend Analysis</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Use 30-90 day ranges to identify seasonal patterns and growth trends.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                            <span>📈</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Excel Analysis</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Export CSV files and open in Excel for pivot tables and advanced charts.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <span>🔄</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Regular Exports</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Schedule weekly exports to track performance over time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;