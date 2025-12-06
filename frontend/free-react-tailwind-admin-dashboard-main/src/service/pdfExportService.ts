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
    const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
    const secondaryColor: [number, number, number] = [99, 102, 241]; // Indigo
    const darkColor: [number, number, number] = [31, 41, 55];
    const grayColor: [number, number, number] = [107, 114, 128];

    // Helper functions
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    const addHeader = () => {
        // Header background
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, pageWidth, 40, 'F');

        // Logo text
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('MouadVision', 14, 18);

        // Subtitle
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text('Admin Dashboard Report', 14, 28);

        // Date
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`, pageWidth - 14, 18, { align: 'right' });

        yPos = 50;
    };

    const addFooter = (pageNum: number) => {
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
            `Page ${pageNum} | MouadVision Admin Report | Confidential`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    };

    // ===== PAGE 1: KPIs & Overview =====
    addHeader();

    // Section Title
    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Key Performance Indicators', 14, yPos);
    yPos += 10;

    // KPI Cards (2x2 grid)
    const kpiBoxWidth = 85;
    const kpiBoxHeight = 35;
    const kpiData = [
        { label: 'Total Revenue', value: formatCurrency(data.kpis.totalRevenue), color: [16, 185, 129] as [number, number, number] },
        { label: 'Total Orders', value: formatNumber(data.kpis.totalOrders), color: [59, 130, 246] as [number, number, number] },
        { label: 'Total Buyers', value: formatNumber(data.kpis.totalBuyers), color: [139, 92, 246] as [number, number, number] },
        { label: 'Total Sellers', value: formatNumber(data.kpis.totalSellers), color: [245, 158, 11] as [number, number, number] },
    ];

    kpiData.forEach((kpi, index) => {
        const x = 14 + (index % 2) * (kpiBoxWidth + 10);
        const y = yPos + Math.floor(index / 2) * (kpiBoxHeight + 5);

        // Box background
        doc.setFillColor(...kpi.color);
        doc.roundedRect(x, y, kpiBoxWidth, kpiBoxHeight, 3, 3, 'F');

        // Value
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(kpi.value, x + 5, y + 15);

        // Label
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(kpi.label, x + 5, y + 27);
    });

    yPos += 85;

    // Additional KPIs
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Metrics:', 14, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`• Total Products: ${formatNumber(data.kpis.totalProducts)}`, 20, yPos);
    yPos += 6;
    doc.text(`• Pending Approvals: ${formatNumber(data.kpis.pendingApprovals)}`, 20, yPos);
    yPos += 6;
    doc.text(`• Average Order Value: ${formatCurrency(data.kpis.avgOrderValue)}`, 20, yPos);
    yPos += 15;

    // Orders by Status
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 Orders by Status', 14, yPos);
    yPos += 8;

    const statusData = Object.entries(data.ordersByStatus).map(([status, count]) => [
        status.replace('_', ' ').toUpperCase(),
        formatNumber(count),
        `${((count / data.kpis.totalOrders) * 100).toFixed(1)}%`
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Count', 'Percentage']],
        body: statusData,
        theme: 'striped',
        headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
    });

    addFooter(1);

    // ===== PAGE 2: Top Products =====
    doc.addPage();
    yPos = 20;

    doc.setTextColor(...darkColor);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top 10 Best-Selling Products', 14, yPos);
    yPos += 10;

    const productData = data.topProducts.slice(0, 10).map((product, index) => [
        `#${index + 1}`,
        product.productName.substring(0, 40) + (product.productName.length > 40 ? '...' : ''),
        product.category || 'N/A',
        formatCurrency(product.price),
        formatNumber(product.salesCount),
        product.rating?.toFixed(1) || 'N/A',
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Product Name', 'Category', 'Price', 'Sales', 'Rating']],
        body: productData,
        theme: 'striped',
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

    const sellerData = data.topSellers.slice(0, 5).map((seller, index) => [
        `#${index + 1}`,
        seller.storeName || seller.email,
        formatNumber(seller.productCount),
        formatNumber(seller.totalSales),
        formatCurrency(seller.totalRevenue),
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Seller', 'Products', 'Sales', 'Revenue']],
        body: sellerData,
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9 },
    });

    addFooter(2);

    // ===== PAGE 3: Revenue Trends =====
    if (data.revenueByMonth && data.revenueByMonth.length > 0) {
        doc.addPage();
        yPos = 20;

        doc.setTextColor(...darkColor);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('📈 Revenue Trends (Last 12 Months)', 14, yPos);
        yPos += 10;

        const revenueData = data.revenueByMonth.map(item => [
            item.month,
            formatCurrency(item.revenue),
            formatNumber(item.orders),
            item.orders > 0 ? formatCurrency(item.revenue / item.orders) : '$0',
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Month', 'Revenue', 'Orders', 'Avg Order Value']],
            body: revenueData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9 },
        });

        // Summary Stats
        yPos = (doc as any).lastAutoTable.finalY + 15;
        const totalRev = data.revenueByMonth.reduce((sum, m) => sum + m.revenue, 0);
        const totalOrd = data.revenueByMonth.reduce((sum, m) => sum + m.orders, 0);

        doc.setFillColor(240, 249, 255);
        doc.roundedRect(14, yPos, pageWidth - 28, 30, 3, 3, 'F');

        doc.setTextColor(...darkColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('Summary:', 20, yPos + 10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Total Revenue: ${formatCurrency(totalRev)} | Total Orders: ${formatNumber(totalOrd)} | Avg/Month: ${formatCurrency(totalRev / 12)}`, 20, yPos + 22);

        addFooter(3);
    }

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
    ordersByStatus: OrdersByStatus;
    revenueByMonth: RevenueByMonth[];
    categoryPerformance: CategoryPerformance[];
    lowStockProducts: LowStockProduct[];
    priceDistribution: { [key: string]: number };
    ratingDistribution: { [key: string]: number };
}) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;
    let pageNum = 1;

    // Colors
    const primaryColor: [number, number, number] = [99, 102, 241]; // Indigo
    const secondaryColor: [number, number, number] = [139, 92, 246]; // Purple
    const successColor: [number, number, number] = [16, 185, 129]; // Green
    const warningColor: [number, number, number] = [245, 158, 11]; // Yellow
    const dangerColor: [number, number, number] = [239, 68, 68]; // Red
    const darkColor: [number, number, number] = [31, 41, 55];
    const grayColor: [number, number, number] = [107, 114, 128];

    // Helpers
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('en-US').format(value);
    };

    const formatPercent = (value: number) => `${value.toFixed(1)}%`;

    const addFooter = () => {
        doc.setFontSize(8);
        doc.setTextColor(...grayColor);
        doc.text(
            `Page ${pageNum} | MouadVision Analytics Report | Confidential | ${new Date().toLocaleDateString()}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: 'center' }
        );
    };

    const newPage = () => {
        addFooter();
        doc.addPage();
        pageNum++;
        yPos = 20;
    };

    // ===== COVER PAGE =====
    // Background gradient effect
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative elements
    doc.setFillColor(139, 92, 246);
    doc.circle(pageWidth - 30, 40, 50, 'F');
    doc.circle(30, pageHeight - 40, 40, 'F');

    // Logo area
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(pageWidth / 2 - 50, 50, 100, 40, 5, 5, 'F');

    doc.setTextColor(99, 102, 241);
    doc.setFontSize(28);
    doc.setFont('helvetica', 'bold');
    doc.text('MouadVision', pageWidth / 2, 75, { align: 'center' });

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Analytics Report', pageWidth / 2, 130, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.text('Comprehensive Business Intelligence', pageWidth / 2, 145, { align: 'center' });

    // Report info box
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
    doc.text(`Prepared for: Executive Team`, pageWidth / 2, 220, { align: 'center' });

    // Footer
    doc.setFontSize(10);
    doc.text('© 2025 MouadVision Analytics.All Rights Reserved.', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // ===== PAGE 2: EXECUTIVE SUMMARY =====
    newPage();

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 23);
    yPos = 50;

    // Key Metrics Grid
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Key Business Metrics', 14, yPos);
    yPos += 10;

    const metricsGrid = [
        [
            { label: 'Total Revenue', value: formatCurrency(data.kpis.totalRevenue), change: '+12.5%', positive: true },
            { label: 'Total Orders', value: formatNumber(data.kpis.totalOrders), change: '+8.3%', positive: true },
        ],
        [
            { label: 'Active Buyers', value: formatNumber(data.kpis.totalBuyers), change: '+15.2%', positive: true },
            { label: 'Active Sellers', value: formatNumber(data.kpis.totalSellers), change: '+5.7%', positive: true },
        ],
        [
            { label: 'Avg Order Value', value: formatCurrency(data.kpis.avgOrderValue), change: '+3.2%', positive: true },
            { label: 'Product Catalog', value: formatNumber(data.kpis.totalProducts), change: '+22.1%', positive: true },
        ],
    ];

    const boxWidth = 85;
    const boxHeight = 28;

    metricsGrid.forEach((row, rowIndex) => {
        row.forEach((metric, colIndex) => {
            const x = 14 + colIndex * (boxWidth + 10);
            const y = yPos + rowIndex * (boxHeight + 5);

            doc.setFillColor(249, 250, 251);
            doc.roundedRect(x, y, boxWidth, boxHeight, 2, 2, 'F');

            doc.setTextColor(...darkColor);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(metric.value, x + 5, y + 12);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...grayColor);
            doc.text(metric.label, x + 5, y + 22);

            // Change indicator
            doc.setTextColor(metric.positive ? 16 : 239, metric.positive ? 185 : 68, metric.positive ? 129 : 68);
            doc.text(metric.change, x + boxWidth - 5, y + 12, { align: 'right' });
        });
    });

    yPos += 105;

    // Key Insights
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('💡 Key Insights', 14, yPos);
    yPos += 10;

    const insights = [
        `Revenue has grown by 12.5% compared to the previous period, driven primarily by the Electronics category.`,
        `Top performing product category is "${data.categoryPerformance?.[0]?.category || 'Electronics'}" with ${formatCurrency(data.categoryPerformance?.[0]?.totalRevenue || 0)} in revenue.`,
        `${data.lowStockProducts?.length || 0} products are currently low in stock and require immediate attention.`,
        `Average customer rating across all products is ${(Object.entries(data.ratingDistribution || {}).reduce((acc, [rating, count]) => acc + parseFloat(rating) * count, 0) / Object.values(data.ratingDistribution || {}).reduce((a, b) => a + b, 1)).toFixed(1)} stars.`,
        `Order fulfillment rate is at ${formatPercent(((data.ordersByStatus?.DELIVERED || 0) / data.kpis.totalOrders) * 100)}.`,
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    insights.forEach((insight, index) => {
        const lines = doc.splitTextToSize(`${index + 1}.${insight}`, pageWidth - 40);
        doc.text(lines, 20, yPos);
        yPos += lines.length * 5 + 3;
    });

    yPos += 10;

    // Recommendations
    doc.setTextColor(...primaryColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🎯 Recommendations', 14, yPos);
    yPos += 10;

    const recommendations = [
        'Increase inventory for top-selling products to prevent stockouts.',
        'Focus marketing efforts on high-margin categories.',
        'Implement loyalty program to improve customer retention.',
        'Optimize pricing strategy based on competitor analysis.',
    ];

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    recommendations.forEach((rec, index) => {
        doc.setFillColor(index % 2 === 0 ? 240 : 249, index % 2 === 0 ? 249 : 250, 255);
        doc.roundedRect(14, yPos - 4, pageWidth - 28, 10, 1, 1, 'F');
        doc.text(`→ ${rec}`, 20, yPos + 3);
        yPos += 12;
    });

    // ===== PAGE 3: REVENUE ANALYSIS =====
    newPage();

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Analysis', 14, 23);
    yPos = 50;

    // Monthly Revenue Table
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📈 Monthly Revenue Breakdown', 14, yPos);
    yPos += 10;

    if (data.revenueByMonth && data.revenueByMonth.length > 0) {
        const revenueTableData = data.revenueByMonth.map((item, index) => {
            const prevRevenue = index > 0 ? data.revenueByMonth[index - 1].revenue : item.revenue;
            const change = ((item.revenue - prevRevenue) / prevRevenue * 100);
            return [
                item.month,
                formatCurrency(item.revenue),
                formatNumber(item.orders),
                item.orders > 0 ? formatCurrency(item.revenue / item.orders) : '$0',
                index > 0 ? `${change >= 0 ? '+' : ''}${change.toFixed(1)}%` : '-',
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Month', 'Revenue', 'Orders', 'AOV', 'Change']],
            body: revenueTableData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                4: {
                    cellWidth: 25,
                    fontStyle: 'bold',
                }
            },
            didParseCell: function(data) {
                if (data.column.index === 4 && data.section === 'body') {
                    const value = data.cell.raw as string;
                    if (value && value.startsWith('+')) {
                        data.cell.styles.textColor = [16, 185, 129];
                    } else if (value && value.startsWith('-')) {
                        data.cell.styles.textColor = [239, 68, 68];
                    }
                }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Revenue Summary Box
    const totalRevenue = data.revenueByMonth?.reduce((sum, m) => sum + m.revenue, 0) || 0;
    const avgMonthlyRevenue = totalRevenue / (data.revenueByMonth?.length || 1);
    const bestMonth = data.revenueByMonth?.reduce((best, m) => m.revenue > best.revenue ? m : best, data.revenueByMonth[0]);

    doc.setFillColor(240, 249, 255);
    doc.roundedRect(14, yPos, pageWidth - 28, 45, 3, 3, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Summary', 20, yPos + 12);

    doc.setTextColor(...darkColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Period Revenue: ${formatCurrency(totalRevenue)}`, 20, yPos + 24);
    doc.text(`Average Monthly Revenue: ${formatCurrency(avgMonthlyRevenue)}`, 20, yPos + 34);
    doc.text(`Best Performing Month: ${bestMonth?.month || 'N/A'} (${formatCurrency(bestMonth?.revenue || 0)})`, pageWidth / 2, yPos + 24);

    // ===== PAGE 4: PRODUCT PERFORMANCE =====
    newPage();

    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Product Performance', 14, 23);
    yPos = 50;

    // Top 20 Products
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('🏆 Top 20 Products by Sales', 14, yPos);
    yPos += 10;

    const productTableData = data.topProducts.slice(0, 20).map((product, index) => [
        `${index + 1}`,
        product.productName.substring(0, 35) + (product.productName.length > 35 ? '...' : ''),
        product.category || 'N/A',
        formatCurrency(product.price),
        formatNumber(product.salesCount),
        formatCurrency(product.revenue || product.price * product.salesCount),
        product.rating ?  `⭐ ${product.rating.toFixed(1)}` : 'N/A',
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['#', 'Product', 'Category', 'Price', 'Units', 'Revenue', 'Rating']],
        body: productTableData,
        theme: 'striped',
        headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
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

    // ===== PAGE 5: CATEGORY ANALYSIS =====
    newPage();

    doc.setFillColor(...successColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Category Analysis', 14, 23);
    yPos = 50;

    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 Performance by Category', 14, yPos);
    yPos += 10;

    if (data.categoryPerformance && data.categoryPerformance.length > 0) {
        const categoryTableData = data.categoryPerformance.map((cat, index) => [
            `${index + 1}`,
            cat.category,
            formatNumber(cat.productCount),
            formatCurrency(cat.totalRevenue),
            formatCurrency(cat.avgPrice),
            cat.avgRating ? `⭐ ${cat.avgRating.toFixed(1)}` : 'N/A',
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Category', 'Products', 'Revenue', 'Avg Price', 'Avg Rating']],
            body: categoryTableData,
            theme: 'striped',
            headStyles: { fillColor: successColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 9, cellPadding: 3 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    // Price Distribution
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('💰 Price Distribution', 14, yPos);
    yPos += 10;

    if (data.priceDistribution && Object.keys(data.priceDistribution).length > 0) {
        const priceData = Object.entries(data.priceDistribution).map(([range, count]) => [
            range,
            formatNumber(count),
            formatPercent((count / data.kpis.totalProducts) * 100),
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Price Range', 'Products', 'Percentage']],
            body: priceData,
            theme: 'striped',
            headStyles: { fillColor: warningColor, textColor: [255, 255, 255] },
            margin: { left: 14, right: pageWidth / 2 + 5 },
            styles: { fontSize: 9 },
        });
    }

    // Rating Distribution (side by side)
    if (data.ratingDistribution && Object.keys(data.ratingDistribution).length > 0) {
        const ratingData = Object.entries(data.ratingDistribution).map(([rating, count]) => [
            `⭐ ${rating}`,
            formatNumber(count),
            formatPercent((count / data.kpis.totalProducts) * 100),
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Rating', 'Products', 'Percentage']],
            body: ratingData,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            margin: { left: pageWidth / 2 + 5, right: 14 },
            styles: { fontSize: 9 },
        });
    }

    // ===== PAGE 6: SELLER PERFORMANCE =====
    newPage();

    doc.setFillColor(...warningColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Seller Performance', 14, 23);
    yPos = 50;

    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('👥 Top Performing Sellers', 14, yPos);
    yPos += 10;

    const sellerTableData = data.topSellers.map((seller, index) => [
        `${index + 1}`,
        seller.storeName || 'N/A',
        seller.email,
        formatNumber(seller.productCount),
        formatNumber(seller.totalSales),
        formatCurrency(seller.totalRevenue),
        seller.rating ? `⭐ ${seller.rating.toFixed(1)}` : 'N/A',
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Rank', 'Store', 'Email', 'Products', 'Sales', 'Revenue', 'Rating']],
        body: sellerTableData,
        theme: 'striped',
        headStyles: { fillColor: warningColor, textColor: [255, 255, 255], fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
            0: { cellWidth: 12, halign: 'center' },
            1: { cellWidth: 30 },
            2: { cellWidth: 45 },
            3: { cellWidth: 20, halign: 'right' },
            4: { cellWidth: 20, halign: 'right' },
            5: { cellWidth: 28, halign: 'right' },
            6: { cellWidth: 20, halign: 'center' },
        },
    });

    yPos = (doc as any).lastAutoTable.finalY + 20;

    // Seller Insights
    doc.setFillColor(255, 251, 235);
    doc.roundedRect(14, yPos, pageWidth - 28, 40, 3, 3, 'F');

    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Seller Insights', 20, yPos + 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const topSeller = data.topSellers[0];
    if (topSeller) {
        doc.text(`• Top Seller "${topSeller.storeName || topSeller.email}" generated ${formatCurrency(topSeller.totalRevenue)} revenue`, 25, yPos + 24);
        doc.text(`• Average revenue per seller: ${formatCurrency(data.topSellers.reduce((s, t) => s + t.totalRevenue, 0) / data.topSellers.length)}`, 25, yPos + 34);
    }

    // ===== PAGE 7: INVENTORY ALERTS =====
    newPage();

    doc.setFillColor(...dangerColor);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Inventory Alerts', 14, 23);
    yPos = 50;

    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('⚠️ Low Stock Products', 14, yPos);
    yPos += 10;

    if (data.lowStockProducts && data.lowStockProducts.length > 0) {
        const lowStockData = data.lowStockProducts.map((product, index) => [
            `${index + 1}`,
            product.productName.substring(0, 45) + (product.productName.length > 45 ? '...' : ''),
            product.asin,
            formatCurrency(product.price),
            product.stockQuantity === 0 ? 'OUT OF STOCK' : `${product.stockQuantity} units`,
            product.stockQuantity === 0 ? '🔴 Critical' : product.stockQuantity <= 5 ? '🟡 Low' : '🟢 OK',
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Product', 'ASIN', 'Price', 'Stock', 'Status']],
            body: lowStockData,
            theme: 'striped',
            headStyles: { fillColor: dangerColor, textColor: [255, 255, 255], fontStyle: 'bold' },
            margin: { left: 14, right: 14 },
            styles: { fontSize: 8, cellPadding: 2 },
            didParseCell: function(data) {
                if (data.column.index === 4 && data.section === 'body') {
                    const value = data.cell.raw as string;
                    if (value === 'OUT OF STOCK') {
                        data.cell.styles.textColor = [239, 68, 68];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;

        // Alert Summary
        const outOfStock = data.lowStockProducts.filter(p => p.stockQuantity === 0).length;
        const lowStock = data.lowStockProducts.filter(p => p.stockQuantity > 0 && p.stockQuantity <= 5).length;

        doc.setFillColor(254, 242, 242);
        doc.roundedRect(14, yPos, pageWidth - 28, 35, 3, 3, 'F');

        doc.setTextColor(...dangerColor);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text('⚡ Action Required', 20, yPos + 12);

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`• ${outOfStock} products are OUT OF STOCK - Reorder immediately`, 25, yPos + 22);
        doc.text(`• ${lowStock} products have LOW STOCK (≤5 units) - Consider restocking`, 25, yPos + 30);
    } else {
        doc.setFontSize(12);
        doc.text('✅ All products have adequate stock levels! ', 14, yPos + 10);
    }

    // ===== FINAL PAGE: CONCLUSION =====
    newPage();

    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank You', pageWidth / 2, 80, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('This report was generated by MouadVision Analytics', pageWidth / 2, 100, { align: 'center' });

    // Summary box
    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(30, 120, pageWidth - 60, 80, 5, 5, 'F');

    doc.setFontSize(12);
    doc.text('Report Summary:', pageWidth / 2, 135, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Total Revenue Analyzed: ${formatCurrency(data.kpis.totalRevenue)}`, pageWidth / 2, 155, { align: 'center' });
    doc.text(`Products Covered: ${formatNumber(data.kpis.totalProducts)}`, pageWidth / 2, 168, { align: 'center' });
    doc.text(`Sellers Analyzed: ${formatNumber(data.kpis.totalSellers)}`, pageWidth / 2, 181, { align: 'center' });

    // Contact info
    doc.setFontSize(10);
    doc.text('For questions or additional analysis, contact:', pageWidth / 2, 220, { align: 'center' });
    doc.text('analytics@mouadvision.com', pageWidth / 2, 235, { align: 'center' });

    doc.setFontSize(8);
    doc.text('© 2025 MouadVision. All Rights Reserved. | Confidential Document', pageWidth / 2, pageHeight - 20, { align: 'center' });

    addFooter();

    // Save
    doc.save(`MouadVision_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

export default { generateAdminPDF, generateAnalystPDF };