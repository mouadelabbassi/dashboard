import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import SmartSearchBar from '../components/SmartSearch/SmartSearchBar';
import SearchResults from '../components/SmartSearch/SearchResults';

const SearchResultsPage: React.FC = () => {
    const location = useLocation();
    const [searchData, setSearchData] = useState<any>(location.state || null);
    const [loading, setLoading] = useState(false);
    const [currentQuery, setCurrentQuery] = useState('');

    // Update search data when location state changes
    useEffect(() => {
        if (location.state) {
            setSearchData(location.state);
            setCurrentQuery(location.state.query || '');
        }
    }, [location.state]);

    const getBasePath = () => {
        if (location.pathname.startsWith('/admin')) return '/admin';
        if (location.pathname.startsWith('/seller')) return '/seller/shop';
        if (location.pathname.startsWith('/analyst')) return '/analyst';
        return '/shop';
    };

    const handleSearch = async (query: string, results?: any) => {
        // If results are already provided, use them directly
        if (results) {
            setSearchData({ query, results });
            setCurrentQuery(query);
            return;
        }

        // Otherwise fetch new results
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await axios.post(
                'http://localhost:8080/api/search/smart',
                {
                    query: query,  // Use the new query directly, not accumulated
                    userId: user?.id,
                    userRole: user?.role || 'BUYER',
                    page: 0,
                    size: 20
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSearchData({ query, results: response.data?.data });
            setCurrentQuery(query);
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    // When clicking a suggestion, use it as the NEW query (not append)
    const handleSuggestionClick = (suggestion: string) => {
        setCurrentQuery(suggestion);
        handleSearch(suggestion);
    };

    return (
        <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <SmartSearchBar
                    onSearch={handleSearch}
                    placeholder="Continuez votre recherche..."
                    initialQuery={currentQuery}
                />
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            )}

            {/* Results */}
            {! loading && searchData?.results && (
                <SearchResults
                    query={searchData.results.query}
                    results={searchData.results.results || []}
                    totalResults={searchData.results.totalResults || 0}
                    searchTimeMs={searchData.results.searchTimeMs || 0}
                    suggestions={searchData.results.suggestions || []}
                    onSuggestionClick={handleSuggestionClick}
                    basePath={getBasePath()}
                />
            )}

            {/* Empty State */}
            {!loading && !searchData && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Recherche Intelligente
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Utilisez la barre de recherche ci-dessus pour trouver des produits.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchResultsPage;