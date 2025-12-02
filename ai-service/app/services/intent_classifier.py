import logging
from typing import Tuple
from app.models.search_models import SearchIntent
from app.utils.french_patterns import FrenchPatterns

logger = logging.getLogger(__name__)


class IntentClassifier:
    def __init__(self):
        self.patterns = FrenchPatterns()
    
    def classify(self, query: str) -> Tuple[SearchIntent, float]:
        query_lower = query.lower().strip()
        intent_str, confidence = self.patterns.detect_intent(query_lower)
        
        intent_mapping = {
            "product_search": SearchIntent.PRODUCT_SEARCH,
            "price_filter": SearchIntent.PRICE_FILTER,
            "category_search": SearchIntent.CATEGORY_SEARCH,
            "top_rated": SearchIntent.TOP_RATED,
            "best_value": SearchIntent.BEST_VALUE,
            "new_arrivals": SearchIntent.NEW_ARRIVALS,
            "bestsellers": SearchIntent.BESTSELLERS,
            "seller_products": SearchIntent.SELLER_PRODUCTS,
            "low_stock": SearchIntent.LOW_STOCK,
            "comparison": SearchIntent.COMPARISON,
        }
        
        intent = intent_mapping.get(intent_str, SearchIntent.PRODUCT_SEARCH)
        
        if any(word in query_lower for word in ["meilleur", "best", "top"]):
            if "prix" in query_lower or "price" in query_lower:
                intent = SearchIntent.BEST_VALUE
                confidence = max(confidence, 0.8)
            elif "noté" in query_lower or "rated" in query_lower:
                intent = SearchIntent.TOP_RATED
                confidence = max(confidence, 0.8)
        
        if any(word in query_lower for word in ["nouveau", "new", "récent", "latest"]):
            intent = SearchIntent.NEW_ARRIVALS
            confidence = max(confidence, 0.7)
        
        if any(word in query_lower for word in ["bestseller", "best seller", "populaire", "tendance"]):
            intent = SearchIntent.BESTSELLERS
            confidence = max(confidence, 0.8)
        
        return intent, confidence


def get_intent_classifier():
    return IntentClassifier()