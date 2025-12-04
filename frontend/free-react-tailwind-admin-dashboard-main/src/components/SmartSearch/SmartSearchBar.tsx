import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

interface Suggestion {
    text: string;
    type: 'suggestion' | 'trending' | 'recent';
}

interface SmartSearchBarProps {
    onSearch?: (query: string, results: any) => void;
    placeholder?: string;
    className?: string;
    initialQuery?: string;
}

function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
                                                           onSearch,
                                                           placeholder = "Recherche intelligente... (ex: 'laptop', 'B0XXXXXX', 'iPhone 13')",
                                                           className = "",
                                                           initialQuery = ""
                                                       }) => {
    const [query, setQuery] = useState(initialQuery);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const suggestionsRef = useRef<HTMLDivElement>(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Update query when initialQuery changes
    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);

    const getSearchResultsPath = () => {
        if (location.pathname.startsWith('/admin')) return '/admin/search';
        if (location.pathname.startsWith('/seller')) return '/seller/search';
        if (location.pathname.startsWith('/analyst')) return '/analyst/search';
        return '/shop/search';
    };

    // Fonction pour détecter le type de recherche
    const detectSearchType = (searchQuery: string): string => {
        // ASIN pattern: B0 + 8 alphanumeric
        if (/^B0[A-Z0-9]{8}$/i.test(searchQuery.trim())) {
            return 'ASIN';
        }
        // Product name: contains letters
        if (/[a-zA-Z]{3,}/.test(searchQuery)) {
            return 'Product Name';
        }
        return 'Keyword';
    };

    // Fonction pour afficher l'indicateur de type
    const getSearchTypeIndicator = () => {
        if (!query) return null;
        const type = detectSearchType(query);

        const indicators = {
            'ASIN': {
                icon: '🏷️',
                text: 'ASIN',
                color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
            },
            'Product Name': {
                icon: '📦',
                text: 'Nom',
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            },
            'Keyword': {
                icon: '🔍',
                text: 'Mot-clé',
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
            }
        };

        const indicator = indicators[type as keyof typeof indicators];
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${indicator.color}`}>
                {indicator.icon} {indicator.text}
            </span>
        );
    };

    const fetchSuggestionsDebounced = useCallback(
        debounce(async (searchQuery: string) => {
            if (searchQuery.length < 2) {
                setSuggestions([]);
                return;
            }

            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(
                    `http://localhost:8080/api/search/suggestions?q=${encodeURIComponent(searchQuery)}&limit=10`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const data = response.data?.data;
                const allSuggestions: Suggestion[] = [];

                if (data?.suggestions) {
                    data.suggestions.forEach((s: string) => {
                        allSuggestions.push({ text: s, type: 'suggestion' });
                    });
                }

                if (data?.trending && allSuggestions.length < 8) {
                    data.trending.slice(0, 3).forEach((s: string) => {
                        if (!allSuggestions.find(x => x.text === s)) {
                            allSuggestions.push({ text: s, type: 'trending' });
                        }
                    });
                }

                if (data?.recent && allSuggestions.length < 10) {
                    data.recent.slice(0, 3).forEach((s: string) => {
                        if (!allSuggestions.find(x => x.text === s)) {
                            allSuggestions.push({ text: s, type: 'recent' });
                        }
                    });
                }

                setSuggestions(allSuggestions);
            } catch (error) {
                console.error('Error fetching suggestions:', error);
            }
        }, 300),
        []
    );

    useEffect(() => {
        if (query) {
            fetchSuggestionsDebounced(query);
        } else {
            setSuggestions([]);
        }
    }, [query, fetchSuggestionsDebounced]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(event.target as Node) &&
                !inputRef.current?.contains(event.target as Node)
            ) {
                setShowSuggestions(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = async (searchQuery: string) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;

        setLoading(true);
        setShowSuggestions(false);

        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user') || '{}');

            const response = await axios.post(
                'http://localhost:8080/api/search/smart',
                {
                    query: trimmedQuery,
                    userId: user?.id,
                    userRole: user?.role || 'BUYER',
                    page: 0,
                    size: 20
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const searchResults = response.data?.data;

            if (onSearch) {
                onSearch(trimmedQuery, searchResults);
            } else {
                navigate(getSearchResultsPath(), {
                    state: { query: trimmedQuery, results: searchResults }
                });
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                const selectedSuggestion = suggestions[selectedIndex].text;
                setQuery(selectedSuggestion);
                handleSearch(selectedSuggestion);
            } else {
                handleSearch(query);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, -1));
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestionText: string) => {
        setQuery(suggestionText);
        handleSearch(suggestionText);
    };

    const handleExampleClick = (example: string) => {
        setQuery(example);
        handleSearch(example);
    };

    const getSuggestionIcon = (type: string) => {
        switch (type) {
            case 'trending':
                return (
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                );
            case 'recent':
                return (
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                );
            default:
                return (
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                );
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    ) : (
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    )}
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full pl-12 pr-32 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />

                <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-2">
                    {query && getSearchTypeIndicator()}
                    <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full">
                        AI
                    </span>
                </div>
            </div>

            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    <div className="py-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion.text)}
                                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                    selectedIndex === index ? 'bg-gray-100 dark:bg-gray-700' : ''
                                }`}
                            >
                                {getSuggestionIcon(suggestion.type)}
                                <span className="text-gray-900 dark:text-white text-left flex-1">
                                    {suggestion.text}
                                </span>
                                {suggestion.type === 'trending' && (
                                    <span className="text-xs text-orange-500 font-medium">Tendance</span>
                                )}
                                {suggestion.type === 'recent' && (
                                    <span className="text-xs text-gray-400">Récent</span>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            💡 <strong>Astuce:</strong> Tapez un ASIN (ex: B0XXXXXXXX), nom de produit ou mot-clé
                        </p>
                    </div>
                </div>
            )}

            {showSuggestions && query.length === 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                    <div className="p-4">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                            🔍 Exemples de recherche:
                        </p>
                        <div className="space-y-2">
                            {[
                                "iphone",
                                "laptop",
                                "B0ABCD1234",
                                "laptop sous $500",
                                "téléphone bien noté"
                            ].map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example)}
                                    className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm text-gray-700 dark:text-gray-300 transition-colors"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartSearchBar;