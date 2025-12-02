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
        
        entities.keywords = self._extract_keywords(query)
        return entities
    
    def _extract_keywords(self, query: str) -> List[str]:
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