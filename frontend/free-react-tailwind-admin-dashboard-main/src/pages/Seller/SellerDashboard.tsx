import React, { useEffect, useState } from 'react';
import { sellerService } from '../../service/sellerService';
import { SellerDashboard as SellerDashboardType } from '../../types/seller';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const SellerDashboard: React.FC = () => {
    const [dashboard, setDashboard] = useState<SellerDashboardType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            const data = await sellerService.getDashboard();
            setDashboard(data);
        } catch (err: unknown) {
            const error = err as { response?: { data?: { message?: string } } };
            setError(error.response?.data?. message || 'Failed to load dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-red-500 text-center">
                    <p className="text-xl font-semibold">{error}</p>
                    <button onClick={fetchDashboard} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg">
                        Réessayer
                    </button>
                </div>
            </div>
        );
    }

    if (!dashboard) return null;

    const revenueChartData = {
        labels: dashboard.revenueTrend.map((point) =>
            new Date(point.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
        ),
        datasets: [
            {
                label: 'Revenue (MAD)',
                data: dashboard.revenueTrend.map((point) => point.revenue),
                fill: true,
                backgroundColor: 'rgba(59, 130, 246, 0. 1)',
                borderColor: 'rgb(59, 130, 246)',
                tension: 0.4,
            },
        ],
    };

    const topProductsChartData = {
        labels: dashboard.topProducts. map((p) =>
            p.productName. length > 20 ?  p.productName.substring(0, 20) + '...' : p.productName
        ),
        datasets: [
            {
                label: 'Revenue (MAD)',
                data: dashboard. topProducts.map((p) => p. revenue),
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                ],
            },
        ],
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                    Tableau de Bord Vendeur
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Bienvenue, {dashboard.storeName || 'Vendeur'}
                    {dashboard.isVerifiedSeller && (
                        <span className="ml-2 inline-flex items-center px-2. 5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              ✓ Vérifié
            </span>
                    )}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-blue-100 text-sm font-medium">Revenue Totale</p>
                    <p className="text-3xl font-bold mt-2">
                        {dashboard.totalRevenue.toLocaleString('fr-FR')} MAD
                    </p>
                    <p className="text-blue-200 text-xs mt-2">
                        Ce mois: {dashboard.monthlyRevenue.toLocaleString('fr-FR')} MAD
                    </p>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-green-100 text-sm font-medium">Aujourd'hui</p>
                    <p className="text-3xl font-bold mt-2">
                        {dashboard.todayRevenue.toLocaleString('fr-FR')} MAD
                    </p>
                    <p className="text-green-200 text-xs mt-2">
                        Cette semaine: {dashboard.weeklyRevenue.toLocaleString('fr-FR')} MAD
                    </p>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-purple-100 text-sm font-medium">Produits</p>
                    <p className="text-3xl font-bold mt-2">{dashboard.totalProducts}</p>
                    <p className="text-purple-200 text-xs mt-2">
                        ✓ {dashboard.approvedProducts} approuvés | ⏳ {dashboard.pendingProducts} en attente
                    </p>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
                    <p className="text-orange-100 text-sm font-medium">Ventes</p>
                    <p className="text-3xl font-bold mt-2">{dashboard. totalUnitsSold}</p>
                    <p className="text-orange-200 text-xs mt-2">
                        Unités vendues
                    </p>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Évolution des Revenus
                    </h3>
                    <div className="h-80">
                        <Line
                            data={revenueChartData}
                            options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false } },
                                scales: {
                                    y: {
                                        beginAtZero: true,
                                        ticks: {
                                            callback: (value: number | string) => `${value} MAD`,
                                        },
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                        Top Produits
                    </h3>
                    <div className="h-80">
                        {dashboard.topProducts.length > 0 ?  (
                            <Bar
                                data={topProductsChartData}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            ticks: {
                                                callback: (value: number | string) => `${value} MAD`,
                                            },
                                        },
                                    },
                                }}
                            />
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                                Aucune vente pour le moment
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerDashboard;
