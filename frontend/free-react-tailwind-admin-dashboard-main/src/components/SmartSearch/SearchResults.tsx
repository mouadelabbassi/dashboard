import React from 'react';
import { Link } from 'react-router-dom';
import { ProductResult, ParsedQuery } from '../../service/aiSearchService';

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
        const labels: Record<string, { emoji: string; text: string; color: string }> = {
            product_search: { emoji: '🔍', text: 'Recherche produit', color: 'from-blue-500 to-blue-600' },
            price_filter: { emoji: '💰', text: 'Filtre par prix', color: 'from-green-500 to-green-600' },
            top_rated: { emoji: '⭐', text: 'Mieux notés', color: 'from-yellow-500 to-yellow-600' },
            best_value: { emoji: '💎', text: 'Meilleur rapport qualité-prix', color: 'from-purple-500 to-purple-600' },
            new_arrivals: { emoji: '🆕', text: 'Nouveautés', color: 'from-cyan-500 to-cyan-600' },
            bestsellers: { emoji: '🏆', text: 'Best-sellers', color: 'from-orange-500 to-orange-600' },
            category_search: { emoji: '📁', text: 'Catégorie', color: 'from-indigo-500 to-indigo-600' },
            reviews_filter: { emoji: '📝', text: 'Filtre par avis', color: 'from-pink-500 to-pink-600' },
        };
        return labels[intent] || { emoji: '🔍', text: 'Recherche', color: 'from-gray-500 to-gray-600' };
    };

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
        if (confidence >= 0.5) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
        return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400';
    };

    const intentInfo = getIntentLabel(query.intent);

    return (
        <div className="space-y-6">
            {/* Search Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 border border-gray-100 dark:border-gray-700">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span>Résultats pour</span>
                            <span className="text-purple-600 dark:text-purple-400">"{query.originalQuery}"</span>
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{totalResults}</span>
                            produits trouvés en
                            <span className="font-medium text-green-600 dark:text-green-400">{searchTimeMs.toFixed(0)}ms</span>
                            <span className="text-xs">⚡</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${intentInfo.color} text-white shadow-sm`}>
                            {intentInfo.emoji} {intentInfo.text}
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${getConfidenceColor(query.confidence)}`}>
                            {Math.round(query.confidence * 100)}% confiance
                        </span>
                    </div>
                </div>

                {/* Extracted Entities */}
                {query.entities && (
                    <div className="mt-4 flex flex-wrap gap-2">
                        {query.entities.keywords && query.entities.keywords.length > 0 && (
                            <span className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm flex items-center gap-1">
                                <span>🔤</span> Mots-clés: {query.entities.keywords.join(', ')}
                            </span>
                        )}
                        {query.entities.category && (
                            <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm flex items-center gap-1">
                                <span>📦</span> {query.entities.category}
                            </span>
                        )}
                        {query.entities.maxPrice && (
                            <span className="px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-lg text-sm flex items-center gap-1">
                                <span>💰</span> Max: ${query.entities.maxPrice}
                            </span>
                        )}
                        {query.entities.minRating && (
                            <span className="px-3 py-1.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg text-sm flex items-center gap-1">
                                <span>⭐</span> Min: {query.entities.minRating}+
                            </span>
                        )}
                        {query.entities.minReviews && (
                            <span className="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-lg text-sm flex items-center gap-1">
                                <span>📝</span> +{query.entities.minReviews} avis
                            </span>
                        )}
                        {query.entities.brand && (
                            <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm flex items-center gap-1">
                                <span>🏷️</span> {query.entities.brand}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {suggestions && suggestions.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                        <span className="text-lg">💡</span> Suggestions de recherche:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {suggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSuggestionClick(suggestion)}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full text-sm text-gray-700 dark:text-gray-300 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 hover:shadow-md transition-all"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results Grid */}
            {results.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {results.map((product, index) => (
                        <Link
                            key={product.asin}
                            to={`${basePath}/product/${product.asin}`}
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100 dark:border-gray-700 hover:border-purple-200 dark:hover:border-purple-700"
                        >
                            {/* Image Container */}
                            <div className="relative">
                                <div className="aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.productName}
                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-300"
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
                                <div className="absolute top-2 left-2 flex flex-col gap-1.5">
                                    {index < 3 && (
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                            <span>🎯</span> Top Match
                                        </span>
                                    )}
                                    {product.isBestseller && (
                                        <span className="px-2.5 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                                            <span>🏆</span> Best Seller
                                        </span>
                                    )}
                                </div>

                                {/* Relevance Score */}
                                <div className="absolute top-2 right-2">
                                    <span className="px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs rounded-full font-medium">
                                        {Math.round(product.relevanceScore * 100)}%
                                    </span>
                                </div>

                                {/* Stock indicator */}
                                {product.stockQuantity !== undefined && product.stockQuantity < 10 && product.stockQuantity > 0 && (
                                    <div className="absolute bottom-2 left-2">
                                        <span className="px-2 py-1 bg-red-500/90 text-white text-xs rounded-full">
                                            Plus que {product.stockQuantity} !
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">
                                    {product.categoryName || 'Non catégorisé'}
                                </p>
                                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                    {product.productName}
                                </h3>

                                <div className="flex items-center gap-2 mb-3">
                                    {product.rating && (
                                        <div className="flex items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-0.5 rounded">
                                            <span className="text-yellow-500">★</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
                                                {product.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                    {product.reviewsCount && (
                                        <span className="text-sm text-gray-500 dark:text-gray-400">
                                            ({product.reviewsCount.toLocaleString()} avis)
                                        </span>
                                    )}
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {product.sellerName && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]">
                                            {product.sellerName}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        Aucun résultat trouvé
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Essayez de modifier votre recherche ou utilisez des termes différents.
                        Notre IA comprend le langage naturel en français et anglais.
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchResults;