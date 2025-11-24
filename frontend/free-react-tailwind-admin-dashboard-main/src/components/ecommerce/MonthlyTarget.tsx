import React, { useEffect, useState } from 'react';
import { salesAPI } from '../../service/api';

const MonthlyTarget: React.FC = () => {
    const [revenue, setRevenue] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRevenue = async () => {
            try {
                setLoading(true);
                const response = await salesAPI.getRevenue();
                if (response.data.success) {
                    setRevenue(response.data.data);
                }
            } catch (err) {
                console.error('Error fetching revenue:', err);
                setRevenue(3287);
            } finally {
                setLoading(false);
            }
        };

        fetchRevenue();
    }, []);

    if (loading) {
        return (
            <div className="rounded-lg border border-stroke bg-white dark:bg-boxdark px-7.5 py-6 shadow-default dark:border-strokedark">
                <div className="flex items-center justify-center h-80">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    const target = 20000;
    const percentage = ((revenue / target) * 100).toFixed(2);
    const circumference = 2 * Math.PI * 110;
    const progress = (parseFloat(percentage) / 100) * circumference;

    return (
        <div className="rounded-lg border border-stroke bg-white dark:bg-gray-900 px-7.5 py-6 shadow-default dark:border-gray-800">
            <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-black dark:text-white">
                    Monthly Target
                </h4>
                <div className="relative">
                    <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                    </button>
                </div>
            </div>

            <p className="mb-8 text-sm text-gray-600 dark:text-gray-400">
                Target you've set for each month
            </p>

            <div className="flex items-center justify-center mb-8">
                <div className="relative w-64 h-64">
                    <svg className="transform -rotate-90 w-full h-full">
                        {/* Background circle */}
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="currentColor"
                            strokeWidth="20"
                            fill="none"
                            className="text-gray-200 dark:text-gray-700"
                        />
                        {/* Progress circle */}
                        <circle
                            cx="128"
                            cy="128"
                            r="110"
                            stroke="url(#gradient)"
                            strokeWidth="20"
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - progress}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#8b5cf6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-black dark:text-white">
              {percentage}%
            </span>
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium mt-2">
              +10%
            </span>
                    </div>
                </div>
            </div>

            <div className="text-center mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    You earn <span className="font-bold text-black dark:text-white">${revenue.toLocaleString()}</span> today,
                    it's higher than last month.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Keep up your good work!
                </p>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-stroke dark:border-gray-800">
                <div className="text-center flex-1">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Target</p>
                    <p className="text-lg font-bold text-black dark:text-white flex items-center justify-center gap-1">
                        $20K
                        <span className="text-xs text-red-500">↓</span>
                    </p>
                </div>
                <div className="text-center flex-1 border-l border-stroke dark:border-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Revenue</p>
                    <p className="text-lg font-bold text-black dark:text-white flex items-center justify-center gap-1">
                        $20K
                        <span className="text-xs text-green-500">↑</span>
                    </p>
                </div>
                <div className="text-center flex-1 border-l border-stroke dark:border-gray-800">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Today</p>
                    <p className="text-lg font-bold text-black dark:text-white flex items-center justify-center gap-1">
                        $20K
                        <span className="text-xs text-green-500">↑</span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default MonthlyTarget;