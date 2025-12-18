import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { reportService } from './reportService';

// ============================================
// 🎨 COLOR PALETTE & CONSTANTS
// ============================================

const COLORS = {
    primary: [37, 99, 235] as [number, number, number],
    primaryDark: [29, 78, 216] as [number, number, number],
    secondary: [124, 58, 237] as [number, number, number],
    success:  [16, 185, 129] as [number, number, number],
    warning: [245, 158, 11] as [number, number, number],
    danger: [239, 68, 68] as [number, number, number],
    dark: [17, 24, 39] as [number, number, number],
    gray: [107, 114, 128] as [number, number, number],
    lightGray: [243, 244, 246] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
    gold: [234, 179, 8] as [number, number, number],
    silver:  [156, 163, 175] as [number, number, number],
    bronze: [180, 83, 9] as [number, number, number],
};

const CHART_COLORS:  [number, number, number][] = [
    [59, 130, 246],   // Blue
    [16, 185, 129],   // Green
    [245, 158, 11],   // Amber
    [239, 68, 68],    // Red
    [139, 92, 246],   // Purple
    [236, 72, 153],   // Pink
    [6, 182, 212],    // Cyan
    [132, 204, 22],   // Lime
];

// ============================================
// 📊 HELPER FUNCTIONS
// ============================================

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits:  0,
        maximumFractionDigits: 0,
    }).format(value || 0);
};

const formatNumber = (value: number): string => {
    return new Intl.NumberFormat('en-US').format(value || 0);
};
const truncateText = (text: string, maxLength: number): string => {
    if (! text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

// ============================================
// 📈 CHART DRAWING FUNCTIONS
// ============================================

const drawBarChart = (
    doc: jsPDF,
    data: { label: string; value: number; color?:  [number, number, number] }[],
    x: number,
    y: number,
    width: number,
    height: number,
    title:  string
) => {
    const barHeight = Math.min((height - 30) / data.length - 5, 14);
    const maxValue = Math.max(...data.map(d => d.value), 1);

    // Title
    if (title) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(title, x, y);
        y += 12;
    }

    data.forEach((item, index) => {
        const barWidth = (item.value / maxValue) * (width - 80);
        const color = item.color || CHART_COLORS[index % CHART_COLORS.length];
        const currentY = y + index * (barHeight + 6);

        // Label
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(truncateText(item.label, 10), x, currentY + barHeight / 2 + 2);

        // Bar background
        doc.setFillColor(230, 230, 230);
        doc.roundedRect(x + 40, currentY, width - 80, barHeight, 2, 2, 'F');

        // Bar fill
        if (barWidth > 0) {
            doc.setFillColor(...color);
            doc.roundedRect(x + 40, currentY, Math.max(barWidth, 4), barHeight, 2, 2, 'F');
        }

        // Value
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(formatCurrency(item.value), x + 45 + Math.max(barWidth, 4), currentY + barHeight / 2 + 2);
    });
};

const drawLineChart = (
    doc: jsPDF,
    data: { label: string; value: number }[],
    x: number,
    y: number,
    width: number,
    height:  number,
    title: string
) => {
    // Title
    if (title) {
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(title, x, y);
        y += 10;
    }

    const chartX = x + 25;
    const chartY = y + 5;
    const chartWidth = width - 35;
    const chartHeight = height - 35;

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values, 1);
    const minValue = 0;

    // Draw grid lines and Y-axis labels
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.3);

    for (let i = 0; i <= 4; i++) {
        const gridY = chartY + (chartHeight * i) / 4;
        doc.line(chartX, gridY, chartX + chartWidth, gridY);

        const value = maxValue - ((maxValue - minValue) * i) / 4;
        doc.setFontSize(7);
        doc.setTextColor(...COLORS.gray);
        doc.text(formatCurrency(value), x, gridY + 2);
    }

    // Draw data line and points
    if (data.length > 1) {
        const points:  [number, number][] = data.map((item, index) => {
            const px = chartX + (chartWidth * index) / (data.length - 1);
            const py = chartY + chartHeight - ((item.value - minValue) / (maxValue - minValue)) * chartHeight;
            return [px, py];
        });

        doc.setFillColor(59, 130, 246, 0.1);

        // Draw line
        doc.setDrawColor(...COLORS.primary);
        doc.setLineWidth(2);

        for (let i = 0; i < points.length - 1; i++) {
            doc.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1]);
        }

        // Draw points
        points.forEach(([px, py]) => {
            // White circle background
            doc.setFillColor(...COLORS.white);
            doc.circle(px, py, 3, 'F');
            // Colored circle
            doc.setFillColor(...COLORS.primary);
            doc.circle(px, py, 2, 'F');
        });

        // X-axis labels
        doc.setFontSize(6);
        doc.setTextColor(...COLORS.gray);
        data.forEach((item, index) => {
            if (index % 2 === 0 || data.length <= 7) {
                const px = chartX + (chartWidth * index) / (data.length - 1);
                doc.text(item.label, px - 5, chartY + chartHeight + 12);
            }
        });
    }
};

const drawSectionHeader = (doc: jsPDF, title: string, x: number, y: number, icon: string = '') => {
    doc.setFillColor(...COLORS.primary);
    doc.roundedRect(x, y - 6, 4, 16, 1, 1, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(`${icon} ${title}`.trim(), x + 8, y + 4);

    return y + 16;
};


export const generateAdvancedPDF = async (): Promise<void> => {
    console.log('Starting advanced PDF generation...');

    // Fetch data
    const data = await reportService.getAdvancedReportData();
    console.log('Data fetched:', data);

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let pageNumber = 0;

    // ==================== PAGE 1: COVER ====================
    pageNumber++;

    // Gradient background
    doc.setFillColor(...COLORS.primaryDark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Decorative circles
    doc.setFillColor(255, 255, 255, 0.05);
    doc.circle(pageWidth + 20, 50, 80, 'F');
    doc.circle(-30, pageHeight - 50, 100, 'F');

    // Logo/Brand
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(42);
    doc.setFont('helvetica', 'bold');
    doc.text('MouadVision', pageWidth / 2, 80, { align: 'center' });

    // Subtitle
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.text('Executive Business Report', pageWidth / 2, 100, { align: 'center' });

    // Decorative line
    doc.setDrawColor(...COLORS.white);
    doc.setLineWidth(0.5);
    doc.line(pageWidth / 2 - 50, 115, pageWidth / 2 + 50, 115);

    // Report info box
    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(30, 140, pageWidth - 60, 80, 5, 5, 'F');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Comprehensive Analytics & Insights', pageWidth / 2, 165, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const reportDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    doc.text(`Generated:  ${reportDate}`, pageWidth / 2, 185, { align: 'center' });
    doc.text('Report Period: Last 12 Months', pageWidth / 2, 200, { align: 'center' });

    // Key highlights
    const totalRevenue = data.platformRevenue?.totalRevenue || 0;
    const totalOrders = data.platformRevenue?.totalOrders || 0;
    const topSellerCount = data.top3Sellers?.length || 0;

    const highlightWidth = (pageWidth - 70) / 3;
    const highlights = [
        { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
        { label: 'Total Orders', value: formatNumber(totalOrders) },
        { label: 'Top Sellers', value: String(topSellerCount) },
    ];

    highlights.forEach((item, index) => {
        const boxX = 25 + index * (highlightWidth + 10);
        doc.setFillColor(255, 255, 255, 0.08);
        doc.roundedRect(boxX, 240, highlightWidth, 45, 3, 3, 'F');

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(item.value, boxX + highlightWidth / 2, 260, { align: 'center' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(item.label, boxX + highlightWidth / 2, 275, { align: 'center' });
    });

    // Footer
    doc.setFontSize(8);
    doc.text('Confidential Business Report', pageWidth / 2, pageHeight - 20, { align: 'center' });

    // ==================== PAGE 2: EXECUTIVE SUMMARY ====================
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFillColor(...COLORS.primary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 14, 23);
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 23);

    let yPos = 50;

    // KPI Cards
    yPos = drawSectionHeader(doc, 'Key Performance Indicators', 14, yPos);

    const kpiData = [
        { label: 'Total Revenue', value: formatCurrency(data.platformRevenue?.totalRevenue || 0), color: COLORS.success },
        { label: 'Total Orders', value: formatNumber(data.platformRevenue?.totalOrders || 0), color: COLORS.primary },
        { label: 'Avg Order Value', value: formatCurrency(data.platformRevenue?.avgOrderValue || 0), color: COLORS.warning },
        { label: 'Revenue Growth', value: `${(data.platformRevenue?.revenueGrowth || 0).toFixed(1)}%`, color: COLORS.secondary },
    ];

    const cardWidth = (pageWidth - 38) / 4;
    kpiData.forEach((kpi, index) => {
        const cardX = 14 + index * (cardWidth + 4);

        doc.setFillColor(...COLORS.lightGray);
        doc.roundedRect(cardX, yPos, cardWidth, 35, 3, 3, 'F');

        // Top accent bar
        doc.setFillColor(...kpi.color);
        doc.roundedRect(cardX, yPos, cardWidth, 4, 2, 2, 'F');
        doc.rect(cardX + 2, yPos + 2, cardWidth - 4, 2, 'F');

        doc.setFontSize(8);
        doc.setTextColor(...COLORS.gray);
        doc.text(kpi.label, cardX + 5, yPos + 15);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(kpi.value, cardX + 5, yPos + 28);
    });

    yPos += 50;

    // Revenue Breakdown
    yPos = drawSectionHeader(doc, 'Revenue Breakdown', 14, yPos);

    // Left side:  Revenue sources
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(14, yPos, pageWidth / 2 - 20, 55, 3, 3, 'F');

    const revenueItems = [
        { label: 'Direct Sales', value: data.platformRevenue?.directSalesRevenue || 0 },
        { label: 'Seller Revenue', value: data.platformRevenue?.sellerRevenue || 0 },
        { label: 'Commission', value: data.platformRevenue?.commissionRevenue || 0 },
    ];

    revenueItems.forEach((item, index) => {
        const itemY = yPos + 15 + index * 14;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(item.label, 20, itemY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(formatCurrency(item.value), pageWidth / 2 - 30, itemY, { align: 'right' });
    });

    // Right side: Month comparison
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(pageWidth / 2 + 5, yPos, pageWidth / 2 - 20, 55, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Monthly Comparison', pageWidth / 2 + 15, yPos + 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('This Month:', pageWidth / 2 + 15, yPos + 30);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.success);
    doc.text(formatCurrency(data.platformRevenue?.thisMonthRevenue || 0), pageWidth - 25, yPos + 30, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.gray);
    doc.text('Last Month:', pageWidth / 2 + 15, yPos + 44);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text(formatCurrency(data.platformRevenue?.lastMonthRevenue || 0), pageWidth - 25, yPos + 44, { align: 'right' });

    yPos += 70;

    // Top 3 Best Sellers Section
    yPos = drawSectionHeader(doc, 'Top 3 Best Sellers', 14, yPos);

    if (data.top3Sellers && data.top3Sellers.length > 0) {
        const medalColors = [COLORS.gold, COLORS.silver, COLORS.bronze];
        const medalLabels = ['#1', '#2', '#3'];

        data.top3Sellers.slice(0, 3).forEach((seller, index) => {
            const cardY = yPos + index * 26;

            doc.setFillColor(...COLORS.lightGray);
            doc.roundedRect(14, cardY, pageWidth - 28, 23, 3, 3, 'F');

            // Medal indicator
            doc.setFillColor(...medalColors[index]);
            doc.roundedRect(14, cardY, 5, 23, 2, 2, 'F');
            doc.rect(17, cardY, 2, 23, 'F');

            // Rank badge
            doc.setFillColor(...medalColors[index]);
            doc.circle(30, cardY + 11, 8, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.white);
            doc.text(medalLabels[index], 30, cardY + 14, { align: 'center' });

            // Seller info
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(truncateText(seller.storeName || seller.sellerName || 'Unknown', 30), 45, cardY + 10);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.gray);
            doc.text(`${formatNumber(seller.productsSold || 0)} products sold | ${formatNumber(seller.totalOrders || 0)} orders`, 45, cardY + 18);

            // Revenue
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.success);
            doc.text(formatCurrency(seller.totalRevenue || 0), pageWidth - 20, cardY + 14, { align: 'right' });
        });

        yPos += 90;
    }

    // Top 3 Categories Section
    yPos = drawSectionHeader(doc, 'Top 3 Revenue Categories', 14, yPos);

    if (data.top3Categories && data.top3Categories.length > 0) {
        const totalCategoryRevenue = data.top3Categories.reduce((sum, cat) => sum + (cat.revenue || 0), 0);

        data.top3Categories.slice(0, 3).forEach((category, index) => {
            const cardY = yPos + index * 20;
            const percentage = totalCategoryRevenue > 0 ? ((category.revenue || 0) / totalCategoryRevenue) * 100 : 0;
            const barWidth = ((pageWidth - 120) * percentage) / 100;
            const barColor = CHART_COLORS[index % CHART_COLORS.length];

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(`${index + 1}.${truncateText(category.categoryName || 'Unknown', 20)}`, 14, cardY + 7);

            // Progress bar background
            doc.setFillColor(230, 230, 230);
            doc.roundedRect(14, cardY + 10, pageWidth - 120, 6, 2, 2, 'F');

            // Progress bar fill
            doc.setFillColor(...barColor);
            doc.roundedRect(14, cardY + 10, Math.max(barWidth, 5), 6, 2, 2, 'F');

            // Stats
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.gray);
            doc.text(`${formatNumber(category.unitsSold || 0)} units`, pageWidth - 95, cardY + 7);

            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(formatCurrency(category.revenue || 0), pageWidth - 50, cardY + 7);
            doc.text(`${percentage.toFixed(1)}%`, pageWidth - 20, cardY + 15, { align: 'right' });
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`MouadVision Analytics Report | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // ==================== PAGE 3: REVENUE ANALYTICS ====================
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFillColor(...COLORS.secondary);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Analytics', 14, 23);
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 23);

    yPos = 50;

    // Monthly Revenue Trend Chart
    yPos = drawSectionHeader(doc, 'Monthly Revenue Trend (Last 12 Months)', 14, yPos);

    if (data.monthlyRevenueTrend && data.monthlyRevenueTrend.length > 0) {
        const chartData = data.monthlyRevenueTrend.map(item => ({
            label: item.month || '',
            value: item.revenue || 0
        }));

        drawLineChart(doc, chartData, 14, yPos, pageWidth - 28, 65, '');
        yPos += 75;
    }

    // Weekly Sales Performance
    yPos = drawSectionHeader(doc, 'Weekly Sales Performance', 14, yPos);

    if (data.weeklySalesTrend && data.weeklySalesTrend.length > 0) {
        const weeklyData = data.weeklySalesTrend.map((item, index) => ({
            label: item.dayName || '',
            value: item.revenue || 0,
            color:  CHART_COLORS[index % CHART_COLORS.length]
        }));

        drawBarChart(doc, weeklyData, 14, yPos, pageWidth / 2 - 15, 60, '');
    }

    // Performance Metrics box
    doc.setFillColor(...COLORS.lightGray);
    doc.roundedRect(pageWidth / 2 + 5, yPos - 5, pageWidth / 2 - 20, 65, 3, 3, 'F');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.dark);
    doc.text('Performance Metrics', pageWidth / 2 + 12, yPos + 8);

    const perfMetrics = [
        { label: 'Today', value: formatCurrency(data.salesPerformance?.todayRevenue || 0) },
        { label: 'This Week', value: formatCurrency(data.salesPerformance?.weekRevenue || 0) },
        { label: 'This Month', value: formatCurrency(data.salesPerformance?.monthRevenue || 0) },
        { label: 'Year to Date', value: formatCurrency(data.salesPerformance?.yearRevenue || 0) },
        { label: 'Conversion Rate', value: `${(data.salesPerformance?.conversionRate || 0).toFixed(1)}%` },
    ];

    perfMetrics.forEach((metric, index) => {
        const metricY = yPos + 20 + index * 10;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...COLORS.gray);
        doc.text(metric.label, pageWidth / 2 + 12, metricY);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(metric.value, pageWidth - 20, metricY, { align: 'right' });
    });

    yPos += 80;

    // Category Revenue Distribution Table
    yPos = drawSectionHeader(doc, 'Category Revenue Distribution', 14, yPos);

    if (data.categoryRevenueDistribution && data.categoryRevenueDistribution.length > 0) {
        const categoryTableData = data.categoryRevenueDistribution.slice(0, 8).map((cat, index) => [
            `${index + 1}`,
            truncateText(cat.categoryName || 'Unknown', 25),
            formatNumber(cat.productCount || 0),
            formatCurrency(cat.revenue || 0),
            `${(cat.percentage || 0).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['#', 'Category', 'Products', 'Revenue', 'Share']],
            body: categoryTableData,
            theme: 'striped',
            headStyles: {
                fillColor:  COLORS.secondary,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: { fontSize: 8 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth: 55 },
                2: { cellWidth: 25, halign: 'center' },
                3: { cellWidth:  35, halign: 'right' },
                4: { cellWidth: 25, halign: 'center' },
            },
            margin: { left: 14, right: 14 },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`MouadVision Analytics Report | Generated:  ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // ==================== PAGE 4: TOP PRODUCTS ====================
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFillColor(...COLORS.success);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Selling Products', 14, 23);
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 23);

    yPos = 50;

    // Most Sold Products Table
    yPos = drawSectionHeader(doc, 'Most Sold Products', 14, yPos);

    if (data.mostSoldProducts && data.mostSoldProducts.length > 0) {
        const productTableData = data.mostSoldProducts.slice(0, 10).map((product, index) => [
            `${index + 1}`,
            truncateText(product.productName || 'Unknown', 32),
            truncateText(product.categoryName || 'N/A', 14),
            formatCurrency(product.price || 0),
            formatNumber(product.salesCount || 0),
            formatCurrency(product.revenue || 0),
            product.rating ?  `${Number(product.rating).toFixed(1)}` : 'N/A'
        ]);

        autoTable(doc, {
            startY:  yPos,
            head: [['Rank', 'Product Name', 'Category', 'Price', 'Units Sold', 'Revenue', 'Rating']],
            body: productTableData,
            theme: 'striped',
            headStyles: {
                fillColor:  COLORS.success,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 7
            },
            bodyStyles:  { fontSize: 7 },
            columnStyles: {
                0: { cellWidth: 12, halign: 'center' },
                1: { cellWidth:  50 },
                2: { cellWidth: 25 },
                3: { cellWidth: 22, halign: 'right' },
                4: { cellWidth: 20, halign: 'center' },
                5: { cellWidth: 26, halign: 'right' },
                6: { cellWidth: 16, halign: 'center' },
            },
            margin: { left:  14, right: 14 },
            alternateRowStyles:  { fillColor: [248, 250, 252] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 18;
    }

    // Product Performance Summary
    yPos = drawSectionHeader(doc, 'Product Performance Summary', 14, yPos);

    const totalProducts = data.mostSoldProducts?.length || 0;
    const totalUnitsSold = data.mostSoldProducts?.reduce((sum, p) => sum + (p.salesCount || 0), 0) || 0;
    const totalProductRevenue = data.mostSoldProducts?.reduce((sum, p) => sum + (p.revenue || 0), 0) || 0;
    const avgPrice = totalProducts > 0
        ? (data.mostSoldProducts?.reduce((sum, p) => sum + (p.price || 0), 0) || 0) / totalProducts
        : 0;

    const summaryCards = [
        { label: 'Total Products Listed', value: formatNumber(totalProducts), color: COLORS.primary },
        { label: 'Total Units Sold', value: formatNumber(totalUnitsSold), color: COLORS.success },
        { label: 'Product Revenue', value: formatCurrency(totalProductRevenue), color: COLORS.warning },
        { label: 'Avg Product Price', value: formatCurrency(avgPrice), color: COLORS.secondary },
    ];

    const summaryCardWidth = (pageWidth - 38) / 4;
    summaryCards.forEach((card, index) => {
        const cardX = 14 + index * (summaryCardWidth + 4);

        doc.setFillColor(...COLORS.lightGray);
        doc.roundedRect(cardX, yPos, summaryCardWidth, 30, 3, 3, 'F');

        doc.setFillColor(...card.color);
        doc.roundedRect(cardX, yPos, summaryCardWidth, 3, 2, 2, 'F');

        doc.setFontSize(7);
        doc.setTextColor(...COLORS.gray);
        doc.text(card.label, cardX + 5, yPos + 12);

        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...COLORS.dark);
        doc.text(card.value, cardX + 5, yPos + 23);
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`MouadVision Analytics Report | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // ==================== PAGE 5: SELLER ANALYTICS ====================
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFillColor(...COLORS.warning);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Seller Analytics', 14, 23);
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 23);

    yPos = 50;

    // Top Sellers Table
    yPos = drawSectionHeader(doc, 'Top Sellers Performance', 14, yPos);

    if (data.top3Sellers && data.top3Sellers.length > 0) {
        const sellerTableData = data.top3Sellers.map((seller, index) => {
            const rankLabel = index === 0 ? '#1 GOLD' : index === 1 ?  '#2 SILVER' : index === 2 ? '#3 BRONZE' : `#${index + 1}`;
            return [
                rankLabel,
                truncateText(seller.storeName || seller.sellerName || 'Unknown', 28),
                formatNumber(seller.productCount || 0),
                formatNumber(seller.productsSold || 0),
                formatNumber(seller.totalOrders || 0),
                formatCurrency(seller.totalRevenue || 0),
                formatCurrency(seller.avgOrderValue || 0)
            ];
        });

        autoTable(doc, {
            startY: yPos,
            head: [['Rank', 'Store Name', 'Products', 'Units Sold', 'Orders', 'Revenue', 'Avg Order']],
            body: sellerTableData,
            theme: 'striped',
            headStyles:  {
                fillColor: COLORS.warning,
                textColor: COLORS.white,
                fontStyle: 'bold',
                fontSize: 8
            },
            bodyStyles: { fontSize: 8 },
            columnStyles:  {
                0: { cellWidth: 22, halign: 'center' },
                1: { cellWidth: 40 },
                2: { cellWidth: 20, halign: 'center' },
                3: { cellWidth:  22, halign: 'center' },
                4: { cellWidth: 18, halign: 'center' },
                5: { cellWidth: 28, halign: 'right' },
                6: { cellWidth: 25, halign: 'right' },
            },
            margin: { left: 14, right: 14 },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 0) {
                    if (data.row.index === 0) {
                        data.cell.styles.fillColor = [254, 249, 195]; // Gold tint
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.row.index === 1) {
                        data.cell.styles.fillColor = [243, 244, 246]; // Silver tint
                        data.cell.styles.fontStyle = 'bold';
                    } else if (data.row.index === 2) {
                        data.cell.styles.fillColor = [254, 243, 199]; // Bronze tint
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;
    }

    // Seller Revenue Comparison Chart
    yPos = drawSectionHeader(doc, 'Seller Revenue Comparison', 14, yPos);

    if (data.top3Sellers && data.top3Sellers.length > 0) {
        const sellerChartData = data.top3Sellers.slice(0, 5).map((seller, index) => ({
            label: truncateText(seller.storeName || seller.sellerName || 'Unknown', 12),
            value: seller.totalRevenue || 0,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));

        drawBarChart(doc, sellerChartData, 14, yPos, pageWidth - 28, 55, '');
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`MouadVision Analytics Report | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    // ==================== PAGE 6: ORDER STATUS & INSIGHTS ====================
    doc.addPage();
    pageNumber++;

    // Header
    doc.setFillColor(...COLORS.danger);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(...COLORS.white);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Order Analytics & Insights', 14, 23);
    doc.setFontSize(9);
    doc.text(`Page ${pageNumber}`, pageWidth - 25, 23);

    yPos = 50;

    // Order Status Distribution
    yPos = drawSectionHeader(doc, 'Order Status Distribution', 14, yPos);

    if (data.orderStatusDistribution) {
        const statusColors:  { [key: string]: [number, number, number] } = {
            PENDING:  COLORS.warning,
            CONFIRMED: COLORS.primary,
            SHIPPED: COLORS.secondary,
            DELIVERED: COLORS.success,
            CANCELLED:  COLORS.danger
        };

        const statusData = Object.entries(data.orderStatusDistribution).map(([status, count]) => ({
            status,
            count:  count as number,
            color: statusColors[status] || COLORS.gray,
        }));

        const totalOrders = statusData.reduce((sum, item) => sum + item.count, 0);

        const statusCardWidth = (pageWidth - 38) / 3;
        statusData.forEach((item, index) => {
            const row = Math.floor(index / 3);
            const col = index % 3;
            const cardX = 14 + col * (statusCardWidth + 5);
            const cardY = yPos + row * 32;

            const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0;

            doc.setFillColor(...COLORS.lightGray);
            doc.roundedRect(cardX, cardY, statusCardWidth, 28, 3, 3, 'F');

            doc.setFillColor(...item.color);
            doc.roundedRect(cardX, cardY, 5, 28, 2, 2, 'F');
            doc.rect(cardX + 3, cardY, 2, 28, 'F');

            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...COLORS.dark);
            doc.text(item.status, cardX + 12, cardY + 11);

            doc.setFontSize(13);
            doc.text(formatNumber(item.count), cardX + 12, cardY + 23);

            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...COLORS.gray);
            doc.text(`${percentage.toFixed(1)}%`, cardX + statusCardWidth - 8, cardY + 17, { align: 'right' });
        });

        yPos += Math.ceil(statusData.length / 3) * 32 + 15;
    }
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.gray);
    doc.text(`MouadVision Analytics Report | Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.addPage();
    pageNumber++;

    doc.setFillColor(...COLORS.primaryDark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(...COLORS.white);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('Thank You', pageWidth / 2, 80, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('For reviewing this comprehensive business report', pageWidth / 2, 100, { align: 'center' });

    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(30, 120, pageWidth - 60, 100, 5, 5, 'F');

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary', pageWidth / 2, 138, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const summaryItems = [
        `Total Revenue: ${formatCurrency(data.platformRevenue?.totalRevenue || 0)}`,
        `Total Orders: ${formatNumber(data.platformRevenue?.totalOrders || 0)}`,
        `Top Performing Sellers: ${data.top3Sellers?.length || 0}`,
        `Categories Analyzed: ${data.top3Categories?.length || 0}`,
        `Products Tracked: ${data.mostSoldProducts?.length || 0}`
    ];

    summaryItems.forEach((item, index) => {
        doc.text(`• ${item}`, pageWidth / 2, 158 + index * 12, { align: 'center' });
    });

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MouadVision', pageWidth / 2, pageHeight - 35, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Empowering Business Intelligence', pageWidth / 2, pageHeight - 25, { align: 'center' });
    doc.setFontSize(7);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 15, { align: 'center' });

    const filename = `MouadVision_Executive_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    console.log('Advanced PDF generated successfully:', filename);
};

export default { generateAdvancedPDF };