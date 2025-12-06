"""
🧠 NLP Engine - Natural Language Processing for Search
Supports: French & English
"""
import re
import logging
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass, field
from enum import Enum
from unidecode import unidecode

logger = logging.getLogger(__name__)


class SearchIntent(str, Enum):
    PRODUCT_SEARCH = "product_search"
    PRICE_FILTER = "price_filter"
    CATEGORY_SEARCH = "category_search"
    TOP_RATED = "top_rated"
    BEST_VALUE = "best_value"
    BESTSELLERS = "bestsellers"
    NEW_ARRIVALS = "new_arrivals"
    BRAND_SEARCH = "brand_search"
    REVIEWS_FILTER = "reviews_filter"


@dataclass
class ParsedQuery:
    original: str
    normalized: str
    intent: SearchIntent
    confidence: float
    keywords: List[str] = field(default_factory=list)
    search_terms: List[str] = field(default_factory=list)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    min_reviews: Optional[int] = None
    brand: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
    is_bestseller: bool = False


class NLPEngine:
    """
    🧠 Intelligent NLP Engine for E-commerce Search
    """

    # Category mappings (FR/EN -> DB category name)
    CATEGORIES = {
        "electronique": "Electronics", "électronique": "Electronics",
        "electronics": "Electronics", "tech": "Electronics",
        "telephone": "Electronics", "téléphone": "Electronics",
        "phone": "Electronics", "smartphone": "Electronics",
        "ordinateur": "Electronics", "computer": "Electronics",
        "laptop": "Electronics", "pc": "Electronics",
        "tablette": "Electronics", "tablet": "Electronics",
        "camera": "Electronics", "tv": "Electronics",
        "audio": "Electronics", "casque": "Electronics",
        "headphone": "Electronics", "speaker": "Electronics",
        "livre": "Books", "livres": "Books", "book": "Books",
        "books": "Books", "roman": "Books", "ebook": "Books",
        "vetement": "Clothing", "vêtement": "Clothing",
        "clothing": "Clothing", "clothes": "Clothing",
        "mode": "Clothing", "fashion": "Clothing",
        "chaussure": "Clothing", "shoes": "Clothing",
        "maison": "Home & Kitchen", "home": "Home & Kitchen",
        "cuisine": "Home & Kitchen", "kitchen": "Home & Kitchen",
        "jouet": "Toys & Games", "jouets": "Toys & Games",
        "toys": "Toys & Games", "jeux": "Toys & Games",
        "sport": "Sports & Outdoors", "sports": "Sports & Outdoors",
        "fitness": "Sports & Outdoors", "outdoor": "Sports & Outdoors",
        "beaute": "Beauty", "beauté": "Beauty", "beauty": "Beauty",
        "cosmetique": "Beauty", "maquillage": "Beauty",
    }

    # Popular brands
    BRANDS = {
        "apple", "samsung", "sony", "lg", "microsoft", "dell", "hp",
        "lenovo", "asus", "acer", "nike", "adidas", "puma", "crocs",
        "amazon", "logitech", "bose", "jbl", "philips", "panasonic",
        "canon", "nikon", "gopro", "xiaomi", "huawei", "google",
    }

    # Intent keywords
    INTENT_KEYWORDS = {
        SearchIntent.TOP_RATED: [
            "meilleur", "meilleurs", "meilleure", "meilleures", "best", "top",
            "mieux noté", "bien noté", "highly rated", "top rated", "excellent"
        ],
        SearchIntent.BEST_VALUE: [
            "rapport qualité prix", "value for money", "bon rapport", "best value",
            "qualité prix", "quality price"
        ],
        SearchIntent.PRICE_FILTER: [
            "pas cher", "cheap", "budget", "économique", "abordable", "affordable",
            "discount", "promo", "solde", "moins cher", "cheapest"
        ],
        SearchIntent.BESTSELLERS: [
            "bestseller", "best seller", "populaire", "popular", "tendance",
            "trending", "plus vendu", "top vente"
        ],
        SearchIntent.NEW_ARRIVALS: [
            "nouveau", "nouveaux", "nouvelle", "new", "latest", "récent", "recent"
        ],
        SearchIntent.REVIEWS_FILTER: [
            "reviews", "review", "avis", "commentaires", "commentaire",
            "évaluations", "évaluation", "notes"
        ],
    }

    # Stop words (FR/EN) - words to exclude from search terms
    STOP_WORDS = {
        # French articles and prepositions
        "le", "la", "les", "un", "une", "des", "du", "de", "d", "l",
        "à", "au", "aux", "et", "ou", "mais", "pour", "par", "sur", "sous",
        "dans", "avec", "sans", "ce", "cette", "ces", "mon", "ma", "mes",
        # French pronouns
        "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
        "qui", "que", "quoi", "dont", "où", "très", "plus", "moins",
        # French search words
        "produit", "produits", "article", "cherche", "recherche", "veux",
        # English articles and prepositions
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
        "for", "of", "with", "by", "from", "is", "are", "was", "were",
        # English pronouns
        "i", "you", "he", "she", "it", "we", "they", "me", "him", "her",
        "my", "your", "his", "its", "our", "their", "this", "that",
        # Search-related words
        "product", "products", "item", "items", "buy", "want", "need",
        "looking", "search", "find", "get", "show",
        # Category-related words (IMPORTANT: these should not be search terms)
        "category", "categories", "categorie", "catégorie", "catégories",
        "type", "types", "kind", "kinds", "genre", "genres",
        # Price-related words
        "dollar", "dollars", "euro", "euros", "price", "prix", "cost",
    }

    def __init__(self):
        logger.info("🧠 NLP Engine initialized")

    def parse(self, query: str) -> ParsedQuery:
        """Main parsing method"""
        original = query.strip()
        normalized = self._normalize(query)

        # Extract all entities
        min_price, max_price = self._extract_price(normalized)
        min_rating = self._extract_rating(normalized)
        min_reviews = self._extract_reviews(normalized)
        category = self._extract_category(normalized)
        brand = self._extract_brand(normalized)
        intent, confidence = self._detect_intent(normalized, min_reviews)
        sort_by, sort_order = self._extract_sort(normalized, intent)
        is_bestseller = self._is_bestseller_query(normalized)

        # Extract search terms
        search_terms = self._extract_search_terms(normalized, category, brand)
        keywords = self._extract_keywords(normalized)

        logger.info(f"📝 Parsed: '{original}'")
        logger.info(f"   → Intent: {intent.value} ({confidence:.0%})")
        logger.info(f"   → Search terms: {search_terms}")
        logger.info(f"   → Category: {category}, Brand: {brand}")
        logger.info(f"   → Price: {min_price}-{max_price}, Rating: {min_rating}+, Reviews: {min_reviews}+")

        return ParsedQuery(
            original=original,
            normalized=normalized,
            intent=intent,
            confidence=confidence,
            keywords=keywords,
            search_terms=search_terms,
            category=category,
            min_price=min_price,
            max_price=max_price,
            min_rating=min_rating,
            min_reviews=min_reviews,
            brand=brand,
            sort_by=sort_by,
            sort_order=sort_order,
            is_bestseller=is_bestseller,
        )

    def _normalize(self, text: str) -> str:
        """Normalize text for processing"""
        return text.lower().strip()

    def _extract_price(self, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extract price range from query"""
        min_price = None
        max_price = None

        # Pattern: sous 500, sous $500
        match = re.search(r'sous\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: moins de 500
        match = re.search(r'moins\s*de\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: under 500
        match = re.search(r'under\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: below 500
        match = re.search(r'below\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: < 500 or <500
        match = re.search(r'<\s*\$?\s*(\d+)', text)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: +50$ or 50$
        match = re.search(r'\+?(\d+)\s*\$', text)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: $500
        match = re.search(r'\$\s*(\d+)', text)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: 500 euros
        match = re.search(r'(\d+)\s*euros?', text, re.IGNORECASE)
        if match:
            max_price = float(match.group(1))
            return min_price, max_price

        # Pattern: plus de 500, over 500
        match = re.search(r'plus\s*de\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            min_price = float(match.group(1))
            return min_price, max_price

        match = re.search(r'over\s*\$?\s*(\d+)', text, re.IGNORECASE)
        if match:
            min_price = float(match.group(1))
            return min_price, max_price

        # Pattern: > 500
        match = re.search(r'>\s*\$?\s*(\d+)', text)
        if match:
            min_price = float(match.group(1))
            return min_price, max_price

        # Keyword-based price hints
        if any(w in text for w in ["pas cher", "cheap", "budget", "économique"]):
            max_price = 50.0
        elif any(w in text for w in ["luxe", "premium", "haut de gamme", "luxury"]):
            min_price = 200.0

        return min_price, max_price

    def _extract_rating(self, text: str) -> Optional[float]:
        """Extract minimum rating from query"""
        # Pattern: 4 étoiles, 4 etoiles
        match = re.search(r'(\d)\s*[éeè]toiles?', text, re.IGNORECASE)
        if match:
            rating = float(match.group(1))
            if 1 <= rating <= 5:
                return rating

        # Pattern: 4 stars
        match = re.search(r'(\d)\s*stars?', text, re.IGNORECASE)
        if match:
            rating = float(match.group(1))
            if 1 <= rating <= 5:
                return rating

        # Pattern: 4+ (but not for reviews like +1000 or prices like +50$)
        match = re.search(r'(\d)\s*\+(?!\d)(?!\s*\$)', text)
        if match:
            rating = float(match.group(1))
            if 1 <= rating <= 5:
                return rating

        # Keyword-based rating
        if any(w in text for w in ["bien noté", "mieux noté", "top rated", "highly rated", "excellent"]):
            return 4.0

        return None

    def _extract_reviews(self, text: str) -> Optional[int]:
        """Extract minimum reviews count from query"""
        # Pattern: +1000 reviews, +1000 avis
        match = re.search(r'\+\s*(\d+)\s*(reviews?|avis|commentaires?)', text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Pattern: 1000+ reviews
        match = re.search(r'(\d+)\s*\+\s*(reviews?|avis|commentaires?)', text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Pattern: avec plus de 1000 avis
        match = re.search(r'plus\s*de\s*(\d+)\s*(reviews?|avis|commentaires?)', text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Pattern: with more than 1000 reviews
        match = re.search(r'more\s*than\s*(\d+)\s*reviews?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Pattern: over 1000 reviews
        match = re.search(r'over\s*(\d+)\s*reviews?', text, re.IGNORECASE)
        if match:
            return int(match.group(1))

        # Pattern: highly reviewed, many reviews
        if any(w in text for w in ["highly reviewed", "beaucoup d'avis", "nombreux avis"]):
            return 100

        return None

    def _extract_category(self, text: str) -> Optional[str]:
        """Extract category from query"""
        text_ascii = unidecode(text)

        for keyword, category in self.CATEGORIES.items():
            if keyword in text or keyword in text_ascii:
                return category

        return None

    def _extract_brand(self, text: str) -> Optional[str]:
        """Extract brand name from query"""
        words = text.split()
        for word in words:
            clean_word = re.sub(r'[^\w]', '', word).lower()
            if clean_word in self.BRANDS:
                return clean_word.capitalize()
        return None

    def _detect_intent(self, text: str, min_reviews: Optional[int] = None) -> Tuple[SearchIntent, float]:
        """Detect search intent from query"""
        scores = {}

        for intent, keywords in self.INTENT_KEYWORDS.items():
            score = sum(1 for kw in keywords if kw in text)
            if score > 0:
                scores[intent] = score

        # If we extracted reviews, boost reviews_filter intent
        if min_reviews is not None:
            scores[SearchIntent.REVIEWS_FILTER] = scores.get(SearchIntent.REVIEWS_FILTER, 0) + 2

        if scores:
            best_intent = max(scores, key=scores.get)
            confidence = min(scores[best_intent] / 2.0, 1.0)
            return best_intent, max(0.6, confidence)

        # Check for price-related queries
        if any(w in text for w in ["sous", "under", "moins", "$", "<", "€"]):
            return SearchIntent.PRICE_FILTER, 0.7

        return SearchIntent.PRODUCT_SEARCH, 0.5

    def _extract_sort(self, text: str, intent: SearchIntent) -> Tuple[Optional[str], str]:
        """Extract sort preference"""
        if "moins cher" in text or "cheapest" in text or "low to high" in text:
            return "price", "asc"
        if "plus cher" in text or "expensive" in text or "high to low" in text:
            return "price", "desc"
        if "populaire" in text or "popular" in text:
            return "sales_count", "desc"
        if "récent" in text or "recent" in text or "nouveau" in text:
            return "created_at", "desc"

        # Intent-based defaults
        if intent == SearchIntent.TOP_RATED:
            return "rating", "desc"
        if intent == SearchIntent.BESTSELLERS:
            return "sales_count", "desc"
        if intent == SearchIntent.PRICE_FILTER:
            return "price", "asc"
        if intent == SearchIntent.REVIEWS_FILTER:
            return "reviews_count", "desc"

        return "ranking", "asc"

    def _is_bestseller_query(self, text: str) -> bool:
        """Check if query is looking for bestsellers"""
        return any(w in text for w in ["bestseller", "best seller", "plus vendu", "top vente", "populaire"])

    def _extract_search_terms(self, text: str, category: Optional[str], brand: Optional[str]) -> List[str]:
        """Extract actual product search terms"""
        cleaned = text

        # Remove price patterns
        cleaned = re.sub(r'sous\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'moins\s*de\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'under\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'below\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'plus\s*de\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'over\s*\$?\s*\d+', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'[<>]\s*\$?\s*\d+', ' ', cleaned)
        cleaned = re.sub(r'\$\s*\d+', ' ', cleaned)
        cleaned = re.sub(r'\+?\d+\s*\$', ' ', cleaned)
        cleaned = re.sub(r'\d+\s*euros?', ' ', cleaned, flags=re.IGNORECASE)

        # Remove rating patterns
        cleaned = re.sub(r'\d\s*[éeè]toiles?', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\d\s*stars?', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\d\s*\+(?!\d)', ' ', cleaned)

        # Remove reviews patterns
        cleaned = re.sub(r'\+\s*\d+\s*(reviews?|avis|commentaires?)', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'\d+\s*\+\s*(reviews?|avis|commentaires?)', ' ', cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r'plus\s*de\s*\d+\s*(reviews?|avis)', ' ', cleaned, flags=re.IGNORECASE)

        # Remove intent keywords
        for keywords in self.INTENT_KEYWORDS.values():
            for kw in keywords:
                cleaned = cleaned.replace(kw, " ")

        # Remove category keywords
        for kw in self.CATEGORIES.keys():
            pattern = r'\b' + re.escape(kw) + r's?\b'
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)

        # Extract remaining words
        words = cleaned.split()
        search_terms = []

        for word in words:
            word = re.sub(r'[^\w\-]', '', word).strip()
            if len(word) >= 2 and word.lower() not in self.STOP_WORDS and not word.isdigit():
                search_terms.append(word)

        return search_terms

    def _extract_keywords(self, text: str) -> List[str]:
        """Extract all meaningful keywords"""
        words = re.findall(r'\b\w+\b', text)
        return [w for w in words if len(w) >= 2 and w not in self.STOP_WORDS]


# Singleton instance
_nlp_engine = None

def get_nlp_engine() -> NLPEngine:
    global _nlp_engine
    if _nlp_engine is None:
        _nlp_engine = NLPEngine()
    return _nlp_engine