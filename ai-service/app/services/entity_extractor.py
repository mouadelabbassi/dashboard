import logging
import re
from typing import List
from app.models.search_models import ExtractedEntities
from app.utils.french_patterns import FrenchPatterns

logger = logging.getLogger(__name__)


class EntityExtractor:
    def __init__(self):
        self.patterns = FrenchPatterns()
    
    def extract(self, query: str) -> ExtractedEntities:
        entities = ExtractedEntities()
        query_lower = query.lower().strip()
        
        # Extract ASIN (format: B0XXXXXXXX)
        asin = self._extract_asin(query)
        if asin:
            entities.keywords = [asin]
            logger.info(f"Detected ASIN search: {asin}")
            return entities
        
        # Extract product name (if searching by name)
        product_name = self._extract_product_name(query_lower)
        if product_name:
            entities.keywords = [product_name]
            logger.info(f"Detected product name search: {product_name}")
        
        # Extract filters
        min_price, max_price = self.patterns.extract_price(query_lower)
        entities.min_price = min_price
        entities.max_price = max_price
        entities.min_rating = self.patterns.extract_rating(query_lower)
        entities.min_reviews = self.patterns.extract_reviews(query_lower)
        entities.category = self.patterns.extract_category(query_lower)
        
        sort_by, sort_order = self.patterns.extract_sort(query_lower)
        entities.sort_by = sort_by
        entities.sort_order = sort_order
        
        if any(word in query_lower for word in ["bestseller", "best-seller", "best seller", "meilleure vente"]):
            entities.is_bestseller = True
        
        # If no specific keywords extracted, use general keywords
        if not entities.keywords:
            entities.keywords = self._extract_keywords(query)
        
        return entities
    
    def _extract_asin(self, query: str) -> str | None:
        """Extract ASIN from query (format: B0XXXXXXXX)"""
        # ASIN pattern: starts with B0, followed by 8 alphanumeric characters
        asin_pattern = r'\b(B0[A-Z0-9]{8})\b'
        match = re.search(asin_pattern, query.upper())
        if match:
            return match.group(1)
        return None
    
    def _extract_product_name(self, query: str) -> str | None:
        """Extract specific product name if present"""
        # Remove filter words but keep product-related terms
        filter_patterns = [
            r'sous\s*\$?\d+', r'moins\s*de\s*\$?\d+', r'under\s*\$?\d+',
            r'\d+\s*[eé]toiles?', r'\d+\s*stars?', r'bien\s*not[eé]',
            r'meilleur', r'best', r'pas\s*cher', r'cheap', r'nouveau', r'new'
        ]
        
        cleaned = query
        for pattern in filter_patterns:
            cleaned = re.sub(pattern, ' ', cleaned, flags=re.IGNORECASE)
        
        # Remove category keywords
        category_words = ['electronique', 'électronique', 'electronics', 'livre', 'livres', 
                         'books', 'vetement', 'vêtement', 'clothing', 'maison', 'home']
        for word in category_words:
            cleaned = re.sub(r'\b' + word + r's?\b', ' ', cleaned, flags=re.IGNORECASE)
        
        # Clean and extract
        cleaned = re.sub(r'\s+', ' ', cleaned).strip()
        
        # If remaining text is meaningful (not just stop words)
        if len(cleaned) > 2 and not all(word in ['le', 'la', 'les', 'un', 'une', 'des'] 
                                         for word in cleaned.split()):
            return cleaned
        
        return None
    
    def _extract_keywords(self, query: str) -> List[str]:
        """Extract general keywords from query"""
        stopwords = {
            "le", "la", "les", "un", "une", "des", "du", "de", "à", "au", "aux",
            "et", "ou", "mais", "pour", "par", "sur", "sous", "dans", "avec",
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
            "produit", "produits", "product", "products", "cherche", "recherche",
        }
        entity_words = {
            "euro", "euros", "dollar", "dollars", "$", "€",
            "étoile", "étoiles", "star", "stars", "avis", "review", "reviews",
            "sous", "moins", "plus", "entre", "under", "over", "cher", "cheap",
            "noté", "rated", "meilleur", "best", "top", "nouveau", "new",
        }
        
        query_clean = re.sub(r'[^\w\s]', ' ', query.lower())
        words = query_clean.split()
        
        keywords = []
        for word in words:
            word = word.strip()
            if len(word) >= 2 and word not in stopwords and word not in entity_words and not word.isdigit():
                keywords.append(word)
        return keywords


def get_entity_extractor():
    return EntityExtractor()