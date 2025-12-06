import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import SmartSearchBar from '../components/SmartSearch/SmartSearchBar';
import SearchResults from '../components/SmartSearch/SearchResults';
import SearchHistoryPanel from '../components/SmartSearch/SearchHistoryPanel';
import { AISearchResponse } from '../service/aiSearchService';

const SearchResultsPage: React.FC = () => {
    const location = useLocation();
    const [searchData, setSearchData] = useState<AISearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    // Update search data when location state changes
    useEffect(() => {
        if (location.state) {
            const state = location.state as { query: string; results: AISearchResponse };
            if (state.results) {
                setSearchData(state.results);
                setCurrentQuery(state.query || '');
            }
        }
    }, [location.state]);

    const getBasePath = () => {
        if (location.pathname.startsWith('/admin')) return '/admin';
        if (location.pathname.startsWith('/seller')) return '/seller/shop';
        if (location.pathname.startsWith('/analyst')) return '/analyst';
        return '/shop';
    };

    const handleSearch = async (query: string, results?: AISearchResponse) => {
        // If results are already provided (from SmartSearchBar), use them directly
        if (results) {
            setSearchData(results);
            setCurrentQuery(query);
            return;
        }
        setLoading(true);
        setCurrentQuery(query);
    };

    // When clicking a suggestion, use it as the NEW query (not append)
    const handleSuggestionClick = (suggestion: string) => {
        setCurrentQuery(suggestion);
        // The SmartSearchBar will handle the search when query changes
    };

    return (
        <div className="space-y-6">
            {/* Header with History Toggle */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">🔍</span>
                    Recherche Intelligente
                </h1>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg hover:from-purple-200 hover:to-blue-200 dark:hover:from-purple-800/40 dark:hover:to-blue-800/40 transition-all flex items-center gap-2 text-gray-700 dark:text-gray-300"
                >
                    {showHistory ? (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Masquer l'historique
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Historique
                        </>
                    )}
                </button>
            </div>

            {/* History Panel */}
            {showHistory && (
                <SearchHistoryPanel
                    onSelectQuery={handleSuggestionClick}
                    className="animate-fade-in"
                />
            )}

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <SmartSearchBar
                    onSearch={handleSearch}
                    placeholder="Recherche intelligente... (ex: 'laptop sous $500', 'téléphone 4+ étoiles', 'livres +1000 avis')"
                    initialQuery={currentQuery}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 dark:border-purple-800"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-purple-600 dark:border-t-purple-400 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400 animate-pulse">
                        🧠 Analyse intelligente en cours...
                    </p>
                </div>
            )}

            {/* Results */}
            {!loading && searchData && searchData.results && (
                <SearchResults
                    query={searchData.query}
                    results={searchData.results}
                    totalResults={searchData.totalResults}
                    searchTimeMs={searchData.searchTimeMs}
                    suggestions={searchData.suggestions}
                    onSuggestionClick={handleSuggestionClick}
                    basePath={getBasePath()}
                />
            )}

            {/* Empty State - No search yet */}
            {!loading && !searchData && (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-12 text-center border border-purple-100 dark:border-purple-900/30">
                    <div className="max-w-lg mx-auto">
                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            Recherche Intelligente
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            Utilisez le langage naturel pour trouver exactement ce que vous cherchez.
                            Notre IA comprend le français et l'anglais.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                <span className="text-purple-600 dark:text-purple-400 font-medium">💰 Prix</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"laptop sous $500"</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                <span className="text-blue-600 dark:text-blue-400 font-medium">⭐ Notes</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"téléphone 4+ étoiles"</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                <span className="text-green-600 dark:text-green-400 font-medium">📦 Catégorie</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"électronique pas cher"</p>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                                <span className="text-orange-600 dark:text-orange-400 font-medium">📝 Avis</span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"livres +1000 reviews"</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;