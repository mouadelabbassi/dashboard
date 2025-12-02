import React from 'react';
import { Link } from 'react-router-dom';

interface ProductResult {
    asin: string;
    productName: string;
    price: number;
    rating?: number;
    reviewsCount?: number;
    categoryName?: string;
    imageUrl?: string;
    sellerName?: string;
    isBestseller: boolean;
    stockQuantity?: number;
    relevanceScore: number;
}

interface ParsedQuery {
    originalQuery: string;
    normalizedQuery: string;
    intent: string;
    confidence: number;
    entities: {
        keywords?: string[];
        category?: string;
        minPrice?: number;
        maxPrice?: number;
        minRating?: number;
        minReviews?: number;
    };
}

interface SearchResultsProps {
    query: ParsedQuery;
    results: ProductResult[];
    totalResults: number;
    searchTimeMs: number;
    suggestions: string[];
    onSuggestionClick: (suggestion: string) => void;
    basePath?: string;
}

const SearchResults: React.FC<SearchResultsProps> = ({
                                                         query,
                                                         results,
                                                         totalResults,
                                                         searchTimeMs,
                                                         suggestions,
                                                         onSuggestionClick,
                                                         basePath = '/shop'
                                                     }) => {
    const getIntentLabel = (intent: string) => {
        const labels: Record<string, string> = {
            product_search: '🔍 Recherche produit',
            price_filter: '💰 Filtre par prix',
            top_rated: '⭐ Mieux notés',
            best_value: '💎 Meilleur rapport qualité-prix',
            new_arrivals: '🆕 Nouveautés',
            bestsellers: '🏆 Best-sellers',
            category_search: '📁 Catégorie',
        };
        return labels[intent] || '🔍 Recherche';
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-100';
        if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100';
        return 'text-red-600 bg-red-100';
    };

    return (
        <div className="space-y-6">
            {/* Search Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Résultats pour "{query.originalQuery}"
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {totalResults} produits trouvés en {searchTimeMs.toFixed(0)}ms
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            {getIntentLabel(query.intent)}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConfidenceColor(query.confidence)}`}>
                            {Math.round(query.confidence * 100)}% confiance
                        </span>
                    </div>
                </div>

                {/* Extracted Entities */}
                {query.entities && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {query.entities.keywords && query.entities.keywords.length > 0 && (
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                                Mots-clés: {query.entities.keywords.join(', ')}
                            </span>
                        )}
                        {query.entities.category && (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                                Catégorie: {query.entities.category}
                            </span>
                        )}
                        {query.entities.maxPrice && (
                            <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs">
                                Prix max: ${query.entities.maxPrice}
                            </span>
                        )}
                        {query.entities.minRating && (
                            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded text-xs">
                                Note min: {query.entities.minRating}⭐
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {suggestions && suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        💡 Suggestions de recherche:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {results.length > 0 ?  (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((product, index) => (
                        <Link
                            key={product.asin}
                            to={`${basePath}/product/${product.asin}`}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-lg transition-shadow overflow-hidden group"
                        >
                            {/* Relevance indicator */}
                            <div className="relative">
                                <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    {product.imageUrl ?  (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Badges */}
                                <div className="absolute top-2 left-2 flex flex-col gap-1">
                                    {index < 3 && (
                                        <span className="px-2 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full">
                                            🎯 Top Match
                                        </span>
                                    )}
                                    {product.isBestseller && (
                                        <span className="px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                                            Best Seller
                                        </span>
                                    )}
                                </div>

                                {/* Relevance Score */}
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 bg-black/60 text-white text-xs rounded-full">
                                        {Math.round(product.relevanceScore * 100)}% match
                                    </span>
                                </div>
                            </div>

                            <div className="p-4">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                                    {product.categoryName || 'Non catégorisé'}
                                </p>
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-blue-600">
                                    {product.productName}
                                </h3>

                                <div className="flex items-center gap-2 mb-2">
                                    {product.rating && (
                                        <div className="flex items-center">
                                            <span className="text-yellow-500">★</span>
                                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-1">
                                                {product.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                    {product.reviewsCount && (
                                        <span className="text-sm text-gray-500">
                                            ({product.reviewsCount.toLocaleString()})
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {product.sellerName && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            {product.sellerName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
                    <svg className="w-20 h-20 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Aucun résultat trouvé
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Essayez de modifier votre recherche ou utilisez des termes différents
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchResults;