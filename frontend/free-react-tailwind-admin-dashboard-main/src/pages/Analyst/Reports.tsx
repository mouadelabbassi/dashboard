import React, { useState } from 'react';
import { analystService } from '../../service/analystService';
import ExportAdvancedPDFButton from '../../components/ExportAdvancedPDFButton';

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
        if (! data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                headers.map(header => {
                    const value = row[header];
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
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        📑 Reports & Export
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Generate reports and export data for analysis
                    </p>
                </div>

                {/* Advanced PDF Export Button */}
                <ExportAdvancedPDFButton variant="gradient" />
            </div>

            {/* Executive Report Banner */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <span>📊</span> Executive Business Report
                        </h2>
                        <p className="text-purple-100 mt-1">
                            Generate a comprehensive PDF report with charts, top sellers, revenue analytics, and business insights
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                🏆 Top 3 Sellers
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                📂 Top Categories
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                📈 Revenue Charts
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                🛒 Best Products
                            </span>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-medium">
                                💡 Business Insights
                            </span>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <ExportAdvancedPDFButton variant="outline" className="! border-white ! text-white hover:!bg-white hover:!text-purple-600" />
                    </div>
                </div>
            </div>

            {/* Date Range Selector */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark: border-gray-700">
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
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
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
                            className="px-4 py-2 border border-gray-300 dark: border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </span>
                        ) : (
                            'Generate Report'
                        )}
                    </button>
                </div>

                {/* Quick Date Presets */}
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
                        className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover: bg-gray-200 dark: hover:bg-gray-600 transition-colors"
                    >
                        Last month
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                📤 CSV Export Options
            </h2>
            <div className="grid grid-cols-1 md: grid-cols-3 gap-6">
                {/* Sales Export */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark: border-gray-700">
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
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark: border-gray-700">
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-blue-200 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(reportData.sales?.totalRevenue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-blue-200 text-sm">Total Orders</p>
                                <p className="text-2xl font-bold">
                                    {reportData.sales?.totalOrders || 0}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-blue-200 text-sm">Avg Order Value</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(reportData.sales?.avgOrderValue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <p className="text-blue-200 text-sm">Items Sold</p>
                                <p className="text-2xl font-bold">
                                    {reportData.sales?.totalItems || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Top Products */}
                    {reportData.topProducts && reportData.topProducts.length > 0 && (
                        <div className="bg-white dark: bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">
                                🏆 Top Selling Products
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-3 text-gray-500 dark:text-gray-400">Rank</th>
                                        <th className="pb-3 text-gray-500 dark: text-gray-400">Product</th>
                                        <th className="pb-3 text-gray-500 dark:text-gray-400 text-right">Sales</th>
                                        <th className="pb-3 text-gray-500 dark: text-gray-400 text-right">Revenue</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reportData.topProducts.slice(0, 5).map((product:  any, index: number) => (
                                        <tr key={product.asin || index} className="border-b border-gray-100 dark:border-gray-700">
                                            <td className="py-3">
                                                    <span className={`font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-amber-700' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        #{index + 1}
                                                    </span>
                                            </td>
                                            <td className="py-3">
                                                <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                                                    {product.productName}
                                                </p>
                                                <p className="text-xs text-gray-500">{product.categoryName || 'N/A'}</p>
                                            </td>
                                            <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                {product.salesCount?.toLocaleString() || 0}
                                            </td>
                                            <td className="py-3 text-right font-semibold text-green-600">
                                                {formatCurrency(product.revenue || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Tips Section */}
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark: text-white mb-4">
                    💡 Export Tips
                </h3>
                <div className="grid grid-cols-1 md: grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark: bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <span>📄</span>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">Executive PDF</p>
                            <p className="text-xs text-gray-500 mt-1">
                                Use the Executive Report button for comprehensive PDF with charts and insights.
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