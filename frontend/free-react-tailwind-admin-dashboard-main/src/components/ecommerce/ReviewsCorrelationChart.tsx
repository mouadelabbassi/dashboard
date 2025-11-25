import React, { useEffect, useState } from 'react';
import { dashboardAPI, CorrelationPoint } from '../../service/api';

const ReviewsCorrelationChart: React.FC = () => {
    const [data, setData] = useState<CorrelationPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [hoveredPoint, setHoveredPoint] = useState<CorrelationPoint | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await dashboardAPI.getCorrelationData();
                if (response.data.success) {
                    setData(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching correlation data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const maxReviews = Math.max(...data.map(d => d.reviews), 1);
    const maxRanking = Math.max(...data.map(d => d.ranking), 1);

    const getPointColor = (rating: number) => {
        if (rating >= 4.5) return 'bg-green-500';
        if (rating >= 4.0) return 'bg-lime-500';
        if (rating >= 3.5) return 'bg-yellow-500';
        if (rating >= 3.0) return 'bg-orange-500';
        return 'bg-red-500';
    };

    if (loading) {
        return (
            <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-2xl border border-gray-200 bg-white dark:bg-white/[0.03] dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                        📈 Reviews vs Ranking Correlation
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        How reviews impact product ranking (Top 100 products)
                    </p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        <span className="text-gray-500 dark:text-gray-400">4.5+ ⭐</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                        <span className="text-gray-500 dark:text-gray-400">3.5-4.5 ⭐</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        <span className="text-gray-500 dark:text-gray-400">&lt;3.5 ⭐</span>
                    </div>
                </div>
            </div>

            {/* Scatter Plot */}
            <div className="relative h-80 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                {/* Y-Axis Label */}
                <div className="absolute -left-2 top-1/2 -rotate-90 transform origin-center">
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Reviews Count →
                    </span>
                </div>

                {/* X-Axis Label */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        Ranking (Lower is Better) →
                    </span>
                </div>

                {/* Grid Lines */}
                <div className="absolute inset-4 border-l border-b border-gray-200 dark:border-gray-700">
                    {[0, 25, 50, 75, 100].map((percent) => (
                        <div
                            key={`h-${percent}`}
                            className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-700 border-dashed"
                            style={{ bottom: `${percent}%` }}
                        />
                    ))}
                    {[0, 25, 50, 75, 100].map((percent) => (
                        <div
                            key={`v-${percent}`}
                            className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-700 border-dashed"
                            style={{ left: `${percent}%` }}
                        />
                    ))}
                </div>

                {/* Data Points */}
                <div className="absolute inset-4">
                    {data.map((point) => {
                        const x = (point.ranking / maxRanking) * 100;
                        const y = (point.reviews / maxReviews) * 100;

                        return (
                            <div
                                key={point.asin}
                                className={`absolute w-3 h-3 rounded-full ${getPointColor(point.rating)} cursor-pointer transform -translate-x-1/2 -translate-y-1/2 hover:scale-150 transition-transform duration-200 hover:z-10`}
                                style={{ left: `${x}%`, bottom: `${y}%` }}
                                onMouseEnter={() => setHoveredPoint(point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                            />
                        );
                    })}
                </div>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div className="absolute top-4 right-4 bg-white dark:bg-gray-900 rounded-lg shadow-lg p-3 z-20 border border-gray-200 dark:border-gray-700 max-w-xs">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white mb-1">
                            {hoveredPoint.name}
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-500">Rank:</span>
                                <span className="ml-1 font-medium text-gray-800 dark:text-white">#{hoveredPoint.ranking}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Reviews:</span>
                                <span className="ml-1 font-medium text-gray-800 dark:text-white">{hoveredPoint.reviews.toLocaleString()}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Rating:</span>
                                <span className="ml-1 font-medium text-yellow-600">⭐ {hoveredPoint.rating}</span>
                            </div>
                            <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="ml-1 font-medium text-green-600">${hoveredPoint.price}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{hoveredPoint.category}</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ReviewsCorrelationChart;