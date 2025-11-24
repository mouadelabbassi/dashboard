import React, { useEffect, useState } from 'react';
import { salesAPI } from '../../service/api';

interface MonthlySalesData {
    [month: string]: number;
}

const StatisticsChart: React.FC = () => {
    const [salesData, setSalesData] = useState<MonthlySalesData>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const currentYear = new Date().getFullYear();
                const response = await salesAPI.getMonthly(currentYear);

                if (response.data.success && response.data.data) {
                    setSalesData(response.data.data);
                } else {
                    setError('No sales data available');
                }
            } catch (err) {
                console.error('Error fetching monthly sales:', err);
                setError('Failed to load sales data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthKeys = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

    const values = monthKeys.map(monthKey => salesData[monthKey] || 0);
    const maxValue = Math.max(...values, 100);
    const hasData = values.some(v => v > 0);

    const generatePath = () => {
        const width = 100;
        const height = 100;
        const points = values.map((value, index) => {
            const x = (index / (values.length - 1)) * width;
            const y = height - (value / maxValue) * height;
            return `${x},${y}`;
        });
        return `M ${points.join(' L ')}`;
    };

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-black dark:text-white">
                    Monthly Sales Statistics
                </h4>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{new Date().getFullYear()}</span>
                </div>
            </div>

            {error && !hasData ? (
                <div className="flex items-center justify-center h-80">
                    <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-2">📊 No sales data available</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">Add some sales to see the chart</p>
                    </div>
                </div>
            ) : (
                <>
                    <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
                        Sales performance throughout the year
                    </p>

                    <div className="h-80 relative">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                            <span>{Math.round(maxValue)}</span>
                            <span>{Math.round(maxValue * 0.75)}</span>
                            <span>{Math.round(maxValue * 0.5)}</span>
                            <span>{Math.round(maxValue * 0.25)}</span>
                            <span>0</span>
                        </div>

                        {/* Chart area */}
                        <div className="ml-12 h-full">
                            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                                {/* Grid lines */}
                                <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeWidth="0.2" className="text-gray-300 dark:text-gray-700" />
                                <line x1="0" y1="25" x2="100" y2="25" stroke="currentColor" strokeWidth="0.2" className="text-gray-300 dark:text-gray-700" />
                                <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.2" className="text-gray-300 dark:text-gray-700" />
                                <line x1="0" y1="75" x2="100" y2="75" stroke="currentColor" strokeWidth="0.2" className="text-gray-300 dark:text-gray-700" />
                                <line x1="0" y1="100" x2="100" y2="100" stroke="currentColor" strokeWidth="0.2" className="text-gray-300 dark:text-gray-700" />

                                {hasData && (
                                    <>
                                        {/* Area fill - Primary line */}
                                        <defs>
                                            <linearGradient id="areaGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
                                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            d={`${generatePath()} L 100,100 L 0,100 Z`}
                                            fill="url(#areaGradient1)"
                                        />

                                        {/* Line - Primary line */}
                                        <path
                                            d={generatePath()}
                                            fill="none"
                                            stroke="#3b82f6"
                                            strokeWidth="0.8"
                                            vectorEffect="non-scaling-stroke"
                                        />

                                        {/* Data points */}
                                        {values.map((value, index) => {
                                            if (value > 0) {
                                                const x = (index / (values.length - 1)) * 100;
                                                const y = 100 - (value / maxValue) * 100;
                                                return (
                                                    <circle
                                                        key={index}
                                                        cx={x}
                                                        cy={y}
                                                        r="1"
                                                        fill="#3b82f6"
                                                        vectorEffect="non-scaling-stroke"
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                    </>
                                )}
                            </svg>
                        </div>

                        {/* X-axis labels */}
                        <div className="ml-12 flex justify-between mt-2">
                            {months.map((month, index) => (
                                <span
                                    key={month}
                                    className={`text-xs ${values[index] > 0 ? 'text-gray-700 dark:text-gray-300 font-medium' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    {month}
                                </span>
                            ))}
                        </div>

                        {/* Sales values on hover - Optional enhancement */}
                        <div className="ml-12 flex justify-between mt-1">
                            {values.map((value, index) => (
                                <span
                                    key={index}
                                    className="text-xs text-gray-400 dark:text-gray-500"
                                    title={`${months[index]}: ${value} sales`}
                                >
                                    {value > 0 ? value : ''}
                                </span>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default StatisticsChart;