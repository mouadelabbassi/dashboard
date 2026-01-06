import React, { useState } from 'react';
import { analystService } from '../../service/analystService';
import ExportAdvancedPDFButton from '../../components/ExportAdvancedPDFButton';

interface ExportStats {
    sales:{ count:number; lastExport:string | null };
    products:{ count:number; lastExport:string | null };
    sellers:{ count:number; lastExport:string | null };
}

const Reports:React.FC = () => {
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
    const [exportFormat, setExportFormat] = useState<'csv' | 'excel'>('csv');
    const [previewData, setPreviewData] = useState<{ type:string; data:any[] } | null>(null);
    const [exportStats, setExportStats] = useState<ExportStats>({
        sales:{ count:0, lastExport:null },
        products:{ count:0, lastExport:null },
        sellers:{ count:0, lastExport:null }
    });

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
    const exportToCSV = (data:any[], filename:string, columns?:{ key:string; header:string }[]) => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = columns ? columns.map(c => c.header) :Object.keys(data[0]);
        const keys = columns ? columns.map(c => c.key) :Object.keys(data[0]);

        const BOM = '\uFEFF';

        const csvContent = [
            headers.join(','),
            ...data.map(row =>
                keys.map(key => {
                    let value = row[key];

                    if (value === null || value === undefined) {
                        return '';
                    }

                    if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
                        if (value) {
                            const date = new Date(value);
                            if (! isNaN(date.getTime())) {
                                value = date.toLocaleString('en-US', {
                                    year:'numeric',
                                    month:'2-digit',
                                    day:'2-digit',
                                    hour:'2-digit',
                                    minute:'2-digit'
                                });
                            }
                        }
                    }

                    if (key.toLowerCase().includes('price') ||
                        key.toLowerCase().includes('amount') ||
                        key.toLowerCase().includes('revenue') ||
                        key.toLowerCase().includes('total')) {
                        if (typeof value === 'number') {
                            value = value.toFixed(2);
                        }
                    }

                    const stringValue = String(value);
                    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                        return `"${stringValue.replace(/"/g, '""')}"`;
                    }
                    return stringValue;
                }).join(',')
            )
        ].join('\n');

        const blob = new Blob([BOM + csvContent], { type:'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    };


    const exportToExcel = (data:any[], filename:string, columns?:{ key:string; header:string }[]) => {
        if (!data || data.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = columns ? columns.map(c => c.header) :Object.keys(data[0]);
        const keys = columns ?  columns.map(c => c.key) :Object.keys(data[0]);

        let html = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" 
                  xmlns:x="urn:schemas-microsoft-com:office:excel">
            <head>
                <meta charset="UTF-8">
                <style>
                    table { border-collapse:collapse; }
                    th { background-color:#4F46E5; color:white; font-weight:bold; padding:8px; border:1px solid #ddd; }
                    td { padding:6px; border:1px solid #ddd; }
                    tr:nth-child(even) { background-color:#f9f9f9; }
                    .number { text-align:right; }
                    .currency { text-align:right; color:#059669; }
                </style>
            </head>
            <body>
                <table>
                    <thead>
                        <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
                    </thead>
                    <tbody>
        `;

        data.forEach(row => {
            html += '<tr>';
            keys.forEach(key => {
                let value = row[key];
                let className = '';

                if (value === null || value === undefined) {
                    value = '';
                } else if (typeof value === 'number') {
                    if (key.toLowerCase().includes('price') ||
                        key.toLowerCase().includes('amount') ||
                        key.toLowerCase().includes('revenue')) {
                        value = `$${value.toFixed(2)}`;
                        className = 'currency';
                    } else {
                        className = 'number';
                    }
                } else if (key.toLowerCase().includes('date') || key.toLowerCase().includes('at')) {
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                        value = date.toLocaleString();
                    }
                }

                html += `<td class="${className}">${value}</td>`;
            });
            html += '</tr>';
        });

        html += '</tbody></table></body></html>';

        const blob = new Blob([html], { type:'application/vnd.ms-excel' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xls`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const handleExportSales = async () => {
        try {
            setExportLoading('sales');
            const data = await analystService.exportSalesData(startDate, endDate);

            const salesColumns = [
                { key:'orderNumber', header:'Order Number' },
                { key:'date', header:'Order Date' },
                { key:'customerName', header:'Customer Name' },
                { key:'customerEmail', header:'Customer Email' },
                { key:'totalAmount', header:'Total Amount ($)' },
                { key:'totalItems', header:'Items Count' },
                { key:'status', header:'Order Status' },
            ];

            const totalRevenue = data.reduce((sum:number, row:any) => sum + (row.totalAmount || 0), 0);
            const totalOrders = data.length;
            const totalItems = data.reduce((sum:number, row:any) => sum + (row.totalItems || 0), 0);

            const enrichedData = [
                ...data,
                { orderNumber:'---', date:'', customerName:'', customerEmail:'', totalAmount:'', totalItems:'', status:'---' },
                { orderNumber:'SUMMARY', date:`${startDate} to ${endDate}`, customerName:`${totalOrders} Orders`, customerEmail:'', totalAmount:totalRevenue, totalItems:totalItems, status:'' }
            ];

            if (exportFormat === 'excel') {
                exportToExcel(enrichedData, 'MouadVision_Sales_Report', salesColumns);
            } else {
                exportToCSV(enrichedData, 'MouadVision_Sales_Report', salesColumns);
            }

            setExportStats(prev => ({
                ...prev,
                sales:{ count:data.length, lastExport:new Date().toLocaleString() }
            }));
        } catch (error) {
            console.error('Error exporting sales:', error);
            alert('Failed to export sales data.Please try again.');
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportProducts = async () => {
        try {
            setExportLoading('products');
            const data = await analystService.exportProductsData();

            const productColumns = [
                { key:'asin', header:'ASIN' },
                { key:'productName', header:'Product Name' },
                { key:'category', header:'Category' },
                { key:'price', header:'Price ($)' },
                { key:'stockQuantity', header:'Stock Quantity' },
                { key:'rating', header:'Rating (1-5)' },
                { key:'reviewsCount', header:'Reviews Count' },
                { key:'salesCount', header:'Total Sales' },
                { key:'seller', header:'Seller' },
                { key:'revenue', header:'Total Revenue ($)' },
            ];

            const enrichedData = data.map((product:any) => ({
                ...product,
                revenue:(product.price || 0) * (product.salesCount || 0),
                stockQuantity:product.stockQuantity || 0
            }));

            const totalProducts = enrichedData.length;
            const totalRevenue = enrichedData.reduce((sum:number, p:any) => sum + p.revenue, 0);
            const totalStock = enrichedData.reduce((sum:number, p:any) => sum + (p.stockQuantity || 0), 0);
            const avgRating = enrichedData.filter((p:any) => p.rating).reduce((sum:number, p:any) => sum + p.rating, 0) / enrichedData.filter((p:any) => p.rating).length || 0;

            const finalData = [
                ...enrichedData,
                { asin:'---', productName:'', category:'', price:'', stockQuantity:'', rating:'', reviewsCount:'', salesCount:'', seller:'', revenue:'' },
                { asin:'SUMMARY', productName:`${totalProducts} Products`, category:'', price:'', stockQuantity:totalStock, rating:avgRating.toFixed(1), reviewsCount:'', salesCount:'', seller:'', revenue:totalRevenue }
            ];

            if (exportFormat === 'excel') {
                exportToExcel(finalData, 'MouadVision_Products_Catalog', productColumns);
            } else {
                exportToCSV(finalData, 'MouadVision_Products_Catalog', productColumns);
            }

            setExportStats(prev => ({
                ...prev,
                products:{ count:data.length, lastExport:new Date().toLocaleString() }
            }));
        } catch (error) {
            console.error('Error exporting products:', error);
            alert('Failed to export products data.Please try again.');
        } finally {
            setExportLoading(null);
        }
    };

    const handleExportSellers = async () => {
        try {
            setExportLoading('sellers');
            const data = await analystService.exportSellersData();

            const sellerColumns = [
                { key:'rank', header:'Rank' },
                { key:'sellerName', header:'Seller Name' },
                { key:'storeName', header:'Store Name' },
                { key:'totalRevenue', header:'Total Revenue ($)' },
                { key:'productsSold', header:'Products Sold' },
                { key:'totalOrders', header:'Total Orders' },
                { key:'avgOrderValue', header:'Avg Order Value ($)' },
                { key:'performanceScore', header:'Performance Score' },
            ];

            const enrichedData = data.map((seller:any) => ({
                ...seller,
                avgOrderValue:seller.totalOrders > 0 ? (seller.totalRevenue / seller.totalOrders).toFixed(2) :0,
                performanceScore:calculatePerformanceScore(seller)
            }));

            const totalRevenue = enrichedData.reduce((sum:number, s:any) => sum + (s.totalRevenue || 0), 0);
            const totalProductsSold = enrichedData.reduce((sum:number, s:any) => sum + (s.productsSold || 0), 0);
            const totalOrders = enrichedData.reduce((sum:number, s:any) => sum + (s.totalOrders || 0), 0);

            const finalData = [
                ...enrichedData,
                { rank:'---', sellerName:'', storeName:'', totalRevenue:'', productsSold:'', totalOrders:'', avgOrderValue:'', performanceScore:'' },
                { rank:'TOTAL', sellerName:`${enrichedData.length} Sellers`, storeName:'', totalRevenue:totalRevenue, productsSold:totalProductsSold, totalOrders:totalOrders, avgOrderValue:'', performanceScore:'' }
            ];

            if (exportFormat === 'excel') {
                exportToExcel(finalData, 'MouadVision_Sellers_Performance', sellerColumns);
            } else {
                exportToCSV(finalData, 'MouadVision_Sellers_Performance', sellerColumns);
            }

            setExportStats(prev => ({
                ...prev,
                sellers:{ count:data.length, lastExport:new Date().toLocaleString() }
            }));
        } catch (error) {
            console.error('Error exporting sellers:', error);
            alert('Failed to export sellers data.Please try again.');
        } finally {
            setExportLoading(null);
        }
    };

    const calculatePerformanceScore = (seller:any):string => {
        const revenueScore = Math.min((seller.totalRevenue || 0) / 10000, 40);
        const ordersScore = Math.min((seller.totalOrders || 0) * 2, 30);
        const productsScore = Math.min((seller.productsSold || 0) * 0.5, 30);
        const total = Math.round(revenueScore + ordersScore + productsScore);

        if (total >= 80) return `${total} ⭐ Excellent`;
        if (total >= 60) return `${total} 🔥 Good`;
        if (total >= 40) return `${total} 📈 Average`;
        return `${total} 🆕 New`;
    };

    const handlePreview = async (type:'sales' | 'products' | 'sellers') => {
        try {
            setExportLoading(type);
            let data;

            switch (type) {
                case 'sales':
                    data = await analystService.exportSalesData(startDate, endDate);
                    break;
                case 'products':
                    data = await analystService.exportProductsData();
                    break;
                case 'sellers':
                    data = await analystService.exportSellersData();
                    break;
            }

            setPreviewData({ type, data:data.slice(0, 10) });
        } catch (error) {
            console.error('Error loading preview:', error);
        } finally {
            setExportLoading(null);
        }
    };

    const formatCurrency = (value:number) => {
        return new Intl.NumberFormat('en-US', {
            style:'currency',
            currency:'USD',
            minimumFractionDigits:0,
            maximumFractionDigits:0,
        }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Reports & Export
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Generate professional reports and export data for analysis
                    </p>
                </div>
                <ExportAdvancedPDFButton variant="gradient" />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <button
                        onClick={generateReport}
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium flex items-center gap-2"
                    >
                        {loading ?  (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Generating...
                            </>
                        ) :(
                            <>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Generate Report
                            </>
                        )}
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {[
                        { label:'Last 7 days', days:7 },
                        { label:'Last 30 days', days:30 },
                        { label:'Last 90 days', days:90 },
                        { label:'This Year', days:'ytd' },
                        { label:'All Time', days:'all' }
                    ].map(preset => (
                        <button
                            key={preset.label}
                            onClick={() => {
                                const end = new Date();
                                let start = new Date();
                                if (preset.days === 'ytd') {
                                    start = new Date(end.getFullYear(), 0, 1);
                                } else if (preset.days === 'all') {
                                    start = new Date('2020-01-01');
                                } else {
                                    start.setDate(end.getDate() - (preset.days as number));
                                }
                                setStartDate(start.toISOString().split('T')[0]);
                                setEndDate(end.toISOString().split('T')[0]);
                            }}
                            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    📁 Data Export Center
                </h2>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                    <button
                        onClick={() => setExportFormat('csv')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            exportFormat === 'csv'
                                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                :'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        📄 CSV
                    </button>
                    <button
                        onClick={() => setExportFormat('excel')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                            exportFormat === 'excel'
                                ?  'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                                :'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                        }`}
                    >
                        📊 Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Sales Data</h3>
                                <p className="text-emerald-100 text-sm">Complete order history</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 text-sm text-emerald-100">
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Order numbers & dates
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Customer information
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Amount & item counts
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Order status tracking
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Summary statistics
                            </p>
                        </div>

                        {exportStats.sales.lastExport && (
                            <p className="text-xs text-emerald-200 mb-3">
                                Last export:{exportStats.sales.count} records • {exportStats.sales.lastExport}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleExportSales}
                                disabled={exportLoading === 'sales'}
                                className="flex-1 px-4 py-3 bg-white text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                {exportLoading === 'sales' ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                                        Exporting...
                                    </>
                                ) :(
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export {exportFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handlePreview('sales')}
                                className="px-4 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                                title="Preview Data"
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Products Data</h3>
                                <p className="text-blue-100 text-sm">Full product catalog</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 text-sm text-blue-100">
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> ASIN & product names
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Categories & prices
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Stock quantities
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Ratings & reviews
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Sales & revenue data
                            </p>
                        </div>

                        {exportStats.products.lastExport && (
                            <p className="text-xs text-blue-200 mb-3">
                                Last export:{exportStats.products.count} records • {exportStats.products.lastExport}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleExportProducts}
                                disabled={exportLoading === 'products'}
                                className="flex-1 px-4 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                {exportLoading === 'products' ?  (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                                        Exporting...
                                    </>
                                ) :(
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export {exportFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handlePreview('products')}
                                className="px-4 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                                title="Preview Data"
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                    <div className="relative">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold">Sellers Data</h3>
                                <p className="text-purple-100 text-sm">Performance analytics</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6 text-sm text-purple-100">
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Seller rankings
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Store information
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Revenue & orders
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Products sold metrics
                            </p>
                            <p className="flex items-center gap-2">
                                <span className="text-white">✓</span> Performance scores
                            </p>
                        </div>

                        {exportStats.sellers.lastExport && (
                            <p className="text-xs text-purple-200 mb-3">
                                Last export:{exportStats.sellers.count} records • {exportStats.sellers.lastExport}
                            </p>
                        )}

                        <div className="flex gap-2">
                            <button
                                onClick={handleExportSellers}
                                disabled={exportLoading === 'sellers'}
                                className="flex-1 px-4 py-3 bg-white text-purple-600 rounded-xl font-semibold hover:bg-purple-50 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-lg"
                            >
                                {exportLoading === 'sellers' ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                                        Exporting...
                                    </>
                                ) :(
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Export {exportFormat.toUpperCase()}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => handlePreview('sellers')}
                                className="px-4 py-3 bg-white/20 text-white rounded-xl font-semibold hover:bg-white/30 transition-colors"
                                title="Preview Data"
                            >
                                👁️
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {previewData && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setPreviewData(null)} />
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
                            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        📋 Data Preview - {previewData.type.charAt(0).toUpperCase() + previewData.type.slice(1)}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        Showing first 10 records of {previewData.data.length} total
                                    </p>
                                </div>
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 overflow-x-auto max-h-[60vh]">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        {Object.keys(previewData.data[0] || {}).map(key => (
                                            <th key={key} className="px-4 py-3 text-left font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                            </th>
                                        ))}
                                    </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {previewData.data.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            {Object.values(row).map((value:any, cellIdx) => (
                                                <td key={cellIdx} className="px-4 py-3 text-gray-900 dark:text-white whitespace-nowrap">
                                                    {typeof value === 'number' ? value.toLocaleString() :String(value || '-')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={() => setPreviewData(null)}
                                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        if (previewData.type === 'sales') handleExportSales();
                                        else if (previewData.type === 'products') handleExportProducts();
                                        else handleExportSellers();
                                        setPreviewData(null);
                                    }}
                                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export Full Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reportData && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold">📈 Report Summary</h3>
                            <span className="text-blue-200 text-sm bg-white/10 px-3 py-1 rounded-full">
                                {startDate} to {endDate}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <p className="text-blue-200 text-sm">Total Revenue</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(reportData.sales?.totalRevenue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <p className="text-blue-200 text-sm">Total Orders</p>
                                <p className="text-2xl font-bold">
                                    {reportData.sales?.totalOrders || 0}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <p className="text-blue-200 text-sm">Avg Order Value</p>
                                <p className="text-2xl font-bold">
                                    {formatCurrency(reportData.sales?.avgOrderValue || 0)}
                                </p>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                                <p className="text-blue-200 text-sm">Items Sold</p>
                                <p className="text-2xl font-bold">
                                    {reportData.sales?.totalItems || 0}
                                </p>
                            </div>
                        </div>
                    </div>
                    {reportData.topProducts && reportData.topProducts.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                🏆 Top Selling Products
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                                        <th className="pb-3 text-gray-500 dark:text-gray-400">Rank</th>
                                        <th className="pb-3 text-gray-500 dark:text-gray-400">Product</th>
                                        <th className="pb-3 text-gray-500 dark:text-gray-400 text-right">Sales</th>
                                        <th className="pb-3 text-gray-500 dark:text-gray-400 text-right">Revenue</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {reportData.topProducts.slice(0, 5).map((product:any, index:number) => (
                                        <tr key={product.asin || index} className="border-b border-gray-100 dark:border-gray-700">
                                            <td className="py-3">
                                                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                                        index === 0 ?  'bg-yellow-100 text-yellow-700' :
                                                            index === 1 ?  'bg-gray-100 text-gray-700' :
                                                                index === 2 ? 'bg-amber-100 text-amber-700' :
                                                                    'bg-gray-50 text-gray-600'
                                                    }`}>
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
                                            <td className="py-3 text-right font-semibold text-gray-600">
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
        </div>
    );
};

export default Reports;