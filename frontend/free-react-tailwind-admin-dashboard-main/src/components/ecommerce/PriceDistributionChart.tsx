import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../service/api';

interface PriceData {
    range: string;
    count: number;
    percentage: number;
}

const PriceDistributionChart: React.FC = () => {
    const [data, setData] = useState<PriceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await dashboardAPI.getPriceDistribution();
                if (response.data.success) {
                    const rawData = response.data.data;
                    const totalProducts = Object.values(rawData).reduce((a: number, b: any) => a + b, 0) as number;
                    setTotal(totalProducts);

                    const order = ['$0-$10', '$10-$25', '$25-$50', '$50-$100', '$100-$200', '$200+'];
                    const formattedData: PriceData[] = order.map(range => ({
                        range,
                        count: rawData[range] || 0,
                        percentage: totalProducts > 0 ? ((rawData[range] || 0) / totalProducts) * 100 : 0
                    }));

                    setData(formattedData);
                }
            } catch (error) {
                console.error('Error fetching price distribution:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const colors = [
        'bg-emerald-500',
        'bg-green-500',
        'bg-yellow-500',
        'bg-orange-500',
        'bg-red-500',
        'bg-purple-500'
    ];

    const maxCount = Math.max(...data.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                       Price Distribution
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Products by price range
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-800 dark:text-white">{total}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Total Products</p>
                </div>
            </div>

            <div className="space-y-4">
                {data.map((item, index) => (
                    <div key={item.range} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {item.range}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="relative h-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                            <div
                                className={`absolute left-0 top-0 h-full ${colors[index]} rounded-lg transition-all duration-500 group-hover:opacity-80`}
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xs font-semibold text-white drop-shadow-md">
                                    {item.count > 0 && item.count}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PriceDistributionChart;