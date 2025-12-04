import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface SearchHistoryItem {
    id: number;
    query: string;
    normalizedQuery: string;
    intent: string;
    resultsCount: number;
    searchTimeMs: number;
    createdAt: string;
}

interface SearchHistoryPanelProps {
    onSelectQuery: (query: string) => void;
    className?: string;
}

const SearchHistoryPanel: React.FC<SearchHistoryPanelProps> = ({
                                                                   onSelectQuery,
                                                                   className = ""
                                                               }) => {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [trending, setTrending] = useState<string[]>([]);

    useEffect(() => {
        fetchSearchHistory();
        fetchTrending();
    }, []);

    const fetchSearchHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:8080/api/search/recent?limit=10',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.data) {
                const historyItems = response.data.data.map((query: string, index: number) => ({
                    id: index,
                    query: query,
                    normalizedQuery: query.toLowerCase(),
                    intent: 'unknown',
                    resultsCount: 0,
                    searchTimeMs: 0,
                    createdAt: new Date().toISOString()
                }));
                setHistory(historyItems);
            }
        } catch (error) {
            console.error('Error fetching search history:', error);
        }
    };

    const fetchTrending = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                'http://localhost:8080/api/search/trending?limit=5',
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data?.data) {
                setTrending(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching trending:', error);
        }
    };

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;

        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Il y a ${diffHours}h`;

        const diffDays = Math.floor(diffHours / 24);
        return `Il y a ${diffDays}j`;
    };

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Trending Searches */}
            {trending.length > 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <h3 className="font-semibold text-orange-700 dark:text-orange-300">
                            🔥 Recherches Tendances
                        </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {trending.map((query, index) => (
                            <button
                                key={index}
                                onClick={() => onSelectQuery(query)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors border border-orange-200 dark:border-orange-700"
                            >
                                {query}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search History */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Historique de Recherche
                            </h3>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={fetchSearchHistory}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                            >
                                Actualiser
                            </button>
                        )}
                    </div>
                </div>

                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {history.length > 0 ? (
                        history.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onSelectQuery(item.query)}
                                className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {item.query}
                                            </span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                        {formatTimeAgo(item.createdAt)}
                                    </span>
                                </div>
                            </button>
                        ))
                    ) : (
                        <div className="px-4 py-12 text-center">
                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Aucun historique de recherche
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SearchHistoryPanel;