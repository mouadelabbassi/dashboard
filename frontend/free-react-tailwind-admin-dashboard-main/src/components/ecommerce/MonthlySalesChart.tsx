import React, { useEffect, useState } from 'react';
import { salesAPI } from '../../service/api';

const MonthlySalesChart: React.FC = () => {
    const [salesData, setSalesData] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMonthlySales = async () => {
            try {
                setLoading(true);
                setError(null);
                const currentYear = new Date().getFullYear();
                const response = await salesAPI.getMonthly(currentYear);

                if (response.data.success) {
                    setSalesData(response.data.data);
                }
            } catch (err: any) {
                console.error('Error fetching monthly sales:', err);
                setError(err.message || 'Failed to load sales data');
                setSalesData({
                    1: 150, 2: 380, 3: 180, 4: 290, 5: 170, 6: 180,
                    7: 280, 8: 100, 9: 200, 10: 390, 11: 270, 12: 100
                });
            } finally {
                setLoading(false);
            }
        };

        fetchMonthlySales();
    }, []);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const maxValue = Math.max(...Object.values(salesData), 1);

    if (loading) {
        return (
            <div
                className="rounded-lg border border-stroke bg-white dark:bg-boxdark px-7.5 py-6 shadow-default dark:border-strokedark">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-black dark:text-white">
                    Monthly Sales
                </h4>
                <div className="relative">
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z"/>
                        </svg>
                    </button>
                </div>
            </div>

            {error && (
                <div
                    className="mb-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Using sample data - {error}
                    </p>
                </div>
            )}

            <div className="h-80">
                <div className="flex h-full items-end justify-between gap-2">
                    {months.map((month, index) => {
                        const monthNumber = index + 1;
                        const value = salesData[monthNumber] || 0;
                        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;

                        return (
                            <div key={month} className="flex flex-col items-center flex-1 group">
                                <div className="relative w-full flex items-end justify-center h-64">
                                    <div
                                        className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-lg transition-all duration-300 hover:opacity-80 cursor-pointer relative"
                                        style={{height: `${height}%`}}
                                    >
                                        <div
                                            className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap">
                                            ${value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                                    {month}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
export default MonthlySalesChart;