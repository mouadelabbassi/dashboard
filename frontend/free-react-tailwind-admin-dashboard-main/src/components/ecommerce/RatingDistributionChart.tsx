import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../../service/api';

interface RatingData {
    label: string;
    count: number;
    percentage: number;
}

const RatingDistributionChart: React.FC = () => {
    const [data, setData] = useState<RatingData[]>([]);
    const [loading, setLoading] = useState(true);
    const [avgRating, setAvgRating] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ratingResponse, statsResponse] = await Promise.all([
                    dashboardAPI.getRatingDistribution(),
                    dashboardAPI.getStats()
                ]);

                if (ratingResponse.data.success) {
                    const rawData = ratingResponse.data.data;
                    const totalProducts = Object.values(rawData).reduce((a: number, b: any) => a + b, 0) as number;

                    const formattedData: RatingData[] = Object.entries(rawData).map(([label, count]) => ({
                        label,
                        count: count as number,
                        percentage: totalProducts > 0 ? ((count as number) / totalProducts) * 100 : 0
                    }));

                    setData(formattedData);
                }

                if (statsResponse.data.success) {
                    setAvgRating(statsResponse.data.data.avgRating || 0);
                }
            } catch (error) {
                console.error('Error fetching rating distribution:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getColor = (label: string) => {
        if (label.includes('4.5+')) return 'bg-green-500';
        if (label.includes('4.0-4.5')) return 'bg-lime-500';
        if (label.includes('3.0-4.0')) return 'bg-yellow-500';
        if (label.includes('2.0-3.0')) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const maxCount = Math.max(...data.map(d => d.count), 1);

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                        Rating Distribution
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Products by customer rating
                    </p>
                </div>
            </div>

            {/* Average Rating Display */}
            <div className="flex items-center justify-center mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl">
                <div className="text-center">
                    <div className="flex items-center justify-center gap-2">
                        <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">
                            {avgRating.toFixed(1)}
                        </span>
                        <span className="text-3xl">⭐</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Average Rating</p>
                </div>
            </div>

            {/* Rating Bars */}
            <div className="space-y-3">
                {data.map((item) => (
                    <div key={item.label} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {item.label}
                            </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {item.count} ({item.percentage.toFixed(1)}%)
                            </span>
                        </div>
                        <div className="relative h-6 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                className={`absolute left-0 top-0 h-full ${getColor(item.label)} rounded-full transition-all duration-500`}
                                style={{ width: `${(item.count / maxCount) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RatingDistributionChart;
