import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Types
interface KPIData {
    totalRevenue: number;
    totalOrders: number;
    totalBuyers: number;
    totalSellers: number;
    totalProducts: number;
    pendingApprovals: number;
    avgOrderValue: number;
    conversionRate: number;
}

interface TopProduct {
    asin: string;
    productName: string;
    price: number;
    salesCount: number;
    revenue: number;
    rating: number;
    category: string;
}

interface TopSeller {
    id: number;
    storeName: string;
    email: string;
    totalSales: number;
    totalRevenue: number;
    productCount: number;
    rating: number;
}

interface OrdersByStatus {
    [key: string]: number;
}

interface RevenueByMonth {
    month: string;
    revenue: number;
    orders: number;
}

interface CategoryPerformance {
    category: string;
    productCount: number;
    totalRevenue: number;
    avgPrice: number;
    avgRating: number;
}

interface LowStockProduct {
    asin: string;
    productName: string;
    stockQuantity: number;
    price: number;
}

// ============================================
// 🔷 ADMIN PDF EXPORT - Simple Summary Report
// ============================================

export const generateAdminPDF = async (data: {
    kpis: KPIData;
    topProducts: TopProduct[];
    topSellers: TopSeller[];
    ordersByStatus: OrdersByStatus;
    revenueByMonth: RevenueByMonth[];
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Colors
    const primaryColor:  [number, number, number] = [59, 130, 246];
    const secondaryColor: [number, number, number] = [99, 102, 241];
    const darkColor: [number, number, number] = [31, 41, 55];
    const grayColor: [number, number, number] = [107, 114, 128];

    // Helper functions
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value || 0);
    };

    const addHeader = () => {
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MouadVision', 14, 18);

        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Admin Dashboard Report', 14, 28);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute:  '2-digit'
        })}`, pageWidth - 14, 18, { align: 'right' });

        yPos = 50;
    };

    const addFooter = (pageNum: number) => {
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
            `MouadVision Admin Report - Page ${pageNum}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    };

    // PAGE 1: KPIs and Summary
    addHeader();

    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Key Performance Indicators', 14, yPos);
    yPos += 10;

    // KPI Grid
    const kpis = [
        { label: 'Total Revenue', value:  formatCurrency(data.kpis?.totalRevenue || 0) },
        { label: 'Total Orders', value: formatNumber(data.kpis?.totalOrders || 0) },
        { label: 'Total Products', value: formatNumber(data.kpis?.totalProducts || 0) },
        { label:  'Total Sellers', value: formatNumber(data.kpis?.totalSellers || 0) },
        { label: 'Total Buyers', value: formatNumber(data.kpis?.totalBuyers || 0) },
        { label:  'Avg Order Value', value: formatCurrency(data.kpis?.avgOrderValue || 0) },
    ];

    const kpiBoxWidth = (pageWidth - 42) / 3;
    const kpiBoxHeight = 25;

    kpis.forEach((kpi, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = 14 + col * (kpiBoxWidth + 7);
        const y = yPos + row * (kpiBoxHeight + 5);

        doc.setFillColor(243, 244, 246);
        doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        doc.text(kpi.label, x + 5, y + 10);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text(kpi.value, x + 5, y + 20);
    });

    yPos += 65;

    // Top Products Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top 10 Best-Selling Products', 14, yPos);
    yPos += 8;

    const productData = (data.topProducts || []).slice(0, 10).map((product:  any, index: number) => [
        `#${index + 1}`,
        ((product.productName || product.product_name || 'Unknown').substring(0, 40) +
            ((product.productName || product.product_name || '').length > 40 ? '...' : '')),
        product.category || product.categoryName || product.category_name || 'N/A',
        formatCurrency(product.price || 0),
        formatNumber(product.salesCount || product.sales_count || 0),
        product.rating ?  product.rating.toFixed(1) : 'N/A',
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Product Name', 'Category', 'Price', 'Sales', 'Rating']],
        body: productData,
        theme:  'striped',
        headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 60 },
            2: { cellWidth: 30 },
            3: { cellWidth: 25 },
            4: { cellWidth: 20 },
            5: { cellWidth: 20 },
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Top Sellers
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 Top Sellers', 14, yPos);
    yPos += 8;

    const sellerData = (data.topSellers || []).slice(0, 5).map((seller: any, index: number) => [
        `#${index + 1}`,
        seller.storeName || seller.store_name || seller.fullName || seller.email || 'Unknown',
        formatNumber(seller.productCount || seller.product_count || 0),
        formatNumber(seller.totalSales || seller.total_sales || seller.salesCount || 0),
        formatCurrency(seller.totalRevenue || seller.total_revenue || seller.revenue || 0),
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Seller', 'Products', 'Sales', 'Revenue']],
        body: sellerData,
        theme: 'striped',
        headStyles: { fillColor:  [16, 185, 129], textColor: [255, 255, 255] },
        margin:  { left: 14, right:  14 },
        styles:  { fontSize: 9 },
    });

    addFooter(1);

    // Save
    doc.save(`MouadVision_Admin_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ============================================
// 🔶 ANALYST PDF EXPORT - Detailed Report
// ============================================

export const generateAnalystPDF = async (data: {
    kpis: KPIData;
    topProducts: TopProduct[];
    topSellers: TopSeller[];
    ordersByStatus:  OrdersByStatus;
    revenueByMonth: RevenueByMonth[];
    categoryPerformance?:  CategoryPerformance[];
    lowStockProducts?: LowStockProduct[];
    priceDistribution?: { [key: string]:  number };
    ratingDistribution?: { [key:  string]: number };
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Colors
    const primaryColor: [number, number, number] = [124, 58, 237];
    const secondaryColor: [number, number, number] = [99, 102, 241];
    const darkColor: [number, number, number] = [31, 41, 55];
    const grayColor: [number, number, number] = [107, 114, 128];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value || 0);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value || 0);
    };

    // Cover Page
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(36);
    doc.setFont('helvetica', 'bold');
    doc.text('MouadVision', pageWidth / 2, 100, { align: 'center' });

    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text('Analytics Report', pageWidth / 2, 130, { align: 'center' });

    doc.setFontSize(16);
    doc.text('Comprehensive Business Intelligence', pageWidth / 2, 145, { align: 'center' });

    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(40, 170, pageWidth - 80, 60, 5, 5, 'F');

    doc.setFontSize(12);
    doc.text(`Report Period: Last 12 Months`, pageWidth / 2, 190, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })}`, pageWidth / 2, 205, { align: 'center' });

    // Page 2: Executive Summary
    doc.addPage();
    let yPos = 20;

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 23);

    yPos = 50;

    // KPIs
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Key Performance Indicators', 14, yPos);
    yPos += 12;

    const kpis = [
        { label: 'Total Revenue', value: formatCurrency(data.kpis?.totalRevenue || 0) },
        { label:  'Total Orders', value: formatNumber(data.kpis?.totalOrders || 0) },
        { label: 'Total Products', value: formatNumber(data.kpis?.totalProducts || 0) },
        { label: 'Total Sellers', value: formatNumber(data.kpis?.totalSellers || 0) },
        { label: 'Total Buyers', value: formatNumber(data.kpis?.totalBuyers || 0) },
        { label: 'Avg Order Value', value: formatCurrency(data.kpis?.avgOrderValue || 0) },
    ];

    const kpiBoxWidth = (pageWidth - 42) / 3;
    const kpiBoxHeight = 28;

    kpis.forEach((kpi, index) => {
        const row = Math.floor(index / 3);
        const col = index % 3;
        const x = 14 + col * (kpiBoxWidth + 7);
        const y = yPos + row * (kpiBoxHeight + 5);

        doc.setFillColor(243, 244, 246);
        doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 3, 3, 'F');

        doc.setFontSize(9);
        doc.setTextColor(...grayColor);
        doc.text(kpi.label, x + 5, y + 12);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...darkColor);
        doc.text(kpi.value, x + 5, y + 23);
    });

    yPos += 75;

    // Top Products
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top Selling Products', 14, yPos);
    yPos += 10;

    const productTableData = (data.topProducts || []).slice(0, 10).map((product: any, index: number) => [
        `${index + 1}`,
        ((product.productName || product.product_name || 'Unknown').substring(0, 35) +
            ((product.productName || product.product_name || '').length > 35 ? '...' : '')),
        product.category || product.categoryName || 'N/A',
        formatCurrency(product.price || 0),
        formatNumber(product.salesCount || product.sales_count || 0),
        formatCurrency((product.price || 0) * (product.salesCount || product.sales_count || 0)),
        product.rating ? `⭐ ${Number(product.rating).toFixed(1)}` : 'N/A',
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product', 'Category', 'Price', 'Units', 'Revenue', 'Rating']],
        body: productTableData,
        theme: 'striped',
        headStyles: { fillColor:  secondaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 7, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 50 },
            2: { cellWidth: 25 },
            3: { cellWidth: 22 },
            4: { cellWidth: 18, halign: 'right' },
            5: { cellWidth: 25, halign: 'right' },
            6: { cellWidth: 20, halign: 'center' },
        },
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(
        `MouadVision Analytics Report - Generated ${new Date().toLocaleDateString()}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
    );

    // Save
    doc.save(`MouadVision_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export default { generateAdminPDF, generateAnalystPDF };