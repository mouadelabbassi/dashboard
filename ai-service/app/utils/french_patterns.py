import re
from typing import Dict, List, Tuple, Optional


class FrenchPatterns:
    """French language patterns for query understanding - NO REGEX VERSION"""
    
    # Category keywords (French -> English mapping)
    CATEGORY_MAPPINGS: Dict[str, str] = {
        "electronique": "Electronics",
        "électronique": "Electronics",
        "electronics": "Electronics",
        "tech": "Electronics",
        "smartphone": "Electronics",
        "telephone": "Electronics",
        "téléphone": "Electronics",
        "ordinateur": "Electronics",
        "laptop": "Electronics",
        "pc": "Electronics",
        "tablette": "Electronics",
        "livre": "Books",
        "livres": "Books",
        "books": "Books",
        "book": "Books",
        "roman": "Books",
        "vetement": "Clothing",
        "vêtement": "Clothing",
        "vetements": "Clothing",
        "vêtements": "Clothing",
        "clothing": "Clothing",
        "mode": "Clothing",
        "fashion": "Clothing",
        "maison": "Home & Kitchen",
        "cuisine": "Home & Kitchen",
        "home": "Home & Kitchen",
        "kitchen": "Home & Kitchen",
        "decoration": "Home & Kitchen",
        "décoration": "Home & Kitchen",
        "meuble": "Home & Kitchen",
        "jouet": "Toys & Games",
        "jouets": "Toys & Games",
        "jeux": "Toys & Games",
        "jeu": "Toys & Games",
        "toys": "Toys & Games",
        "games": "Toys & Games",
        "sport": "Sports & Outdoors",
        "sports": "Sports & Outdoors",
        "fitness": "Sports & Outdoors",
        "beaute": "Beauty",
        "beauté": "Beauty",
        "beauty": "Beauty",
        "cosmetique": "Beauty",
        "maquillage": "Beauty",
    }
    
    # Intent keywords
    INTENT_KEYWORDS: Dict[str, List[str]] = {
        "top_rated": [
            "mieux note", "mieux noté", "meilleure note", "meilleures notes",
            "top rated", "highly rated", "best rated", "meilleur", "meilleurs",
            "top", "best"
        ],
        "bestsellers": [
            "best seller", "bestseller", "best-seller", "meilleure vente",
            "meilleures ventes", "plus vendu", "plus vendus", "populaire",
            "populaires", "tendance", "trending"
        ],
        "best_value": [
            "rapport qualite prix", "rapport qualité prix", "rapport qualité-prix",
            "quality price", "value for money", "bon rapport", "meilleur rapport",
            "worth", "valeur"
        ],
        "new_arrivals": [
            "nouveau", "nouveaux", "nouvelle", "nouvelles", "nouveaute",
            "nouveauté", "nouveautés", "new", "recent", "récent", "récents",
            "latest", "dernier", "derniers", "cette semaine", "this week"
        ],
        "low_stock": [
            "stock faible", "peu de stock", "low stock", "limited",
            "limite", "limité", "derniers disponibles", "presque epuise"
        ],
        "price_filter": [
            "sous", "moins de", "plus de", "entre", "under", "below",
            "above", "over", "cheap", "expensive", "pas cher", "cher",
            "budget", "premium", "luxe"
        ],
    }
    
    # Sort keywords
    SORT_KEYWORDS: Dict[str, Tuple[str, str]] = {
        "moins cher": ("price", "asc"),
        "pas cher": ("price", "asc"),
        "cheap": ("price", "asc"),
        "cheapest": ("price", "asc"),
        "prix croissant": ("price", "asc"),
        "low to high": ("price", "asc"),
        "plus cher": ("price", "desc"),
        "cher": ("price", "desc"),
        "expensive": ("price", "desc"),
        "prix decroissant": ("price", "desc"),
        "high to low": ("price", "desc"),
        "mieux note": ("rating", "desc"),
        "meilleure note": ("rating", "desc"),
        "top rated": ("rating", "desc"),
        "highest rated": ("rating", "desc"),
        "plus d avis": ("reviewsCount", "desc"),
        "plus populaire": ("reviewsCount", "desc"),
        "most reviews": ("reviewsCount", "desc"),
        "popular": ("reviewsCount", "desc"),
        "recent": ("createdAt", "desc"),
        "nouveau": ("createdAt", "desc"),
        "newest": ("createdAt", "desc"),
        "latest": ("createdAt", "desc"),
    }
    
    @classmethod
    def normalize_text(cls, text: str) -> str:
        """Normalize French text for better matching"""
        return text.lower().strip()
    
    @classmethod
    def extract_price(cls, text: str) -> Tuple[Optional[float], Optional[float]]:
        """Extract min and max price from text using simple string matching"""
        text = cls.normalize_text(text)
        min_price = None
        max_price = None
        
        # Simple patterns without complex regex
        # Pattern: "sous X" or "under X" or "< X"
        for prefix in ["sous ", "moins de ", "under ", "below ", "max ", "< "]:
            if prefix in text:
                idx = text.find(prefix) + len(prefix)
                # Extract number after prefix
                num_str = ""
                while idx < len(text) and (text[idx].isdigit() or text[idx] == '.'):
                    num_str += text[idx]
                    idx += 1
                if num_str:
                    try:
                        max_price = float(num_str)
                    except ValueError:
                        pass
                break
        
        # Pattern: "plus de X" or "over X" or "> X"
        for prefix in ["plus de ", "au dessus de ", "over ", "above ", "min ", "> "]:
            if prefix in text:
                idx = text.find(prefix) + len(prefix)
                num_str = ""
                while idx < len(text) and (text[idx].isdigit() or text[idx] == '.'):
                    num_str += text[idx]
                    idx += 1
                if num_str:
                    try:
                        min_price = float(num_str)
                    except ValueError:
                        pass
                break
        
        # Extract standalone numbers with currency symbols
        # Look for patterns like "$50" or "50$" or "50€"
        if max_price is None and min_price is None:
            # Find $ or € followed by number
            for i, char in enumerate(text):
                if char in ['$', '€']:
                    # Check if number follows
                    num_str = ""
                    j = i + 1
                    while j < len(text) and (text[j].isdigit() or text[j] == '.'):
                        num_str += text[j]
                        j += 1
                    # Or number precedes
                    if not num_str:
                        num_str = ""
                        j = i - 1
                        while j >= 0 and (text[j].isdigit() or text[j] == '.'):
                            num_str = text[j] + num_str
                            j -= 1
                    if num_str:
                        try:
                            max_price = float(num_str)
                        except ValueError:
                            pass
                        break
        
        # Check for cheap/expensive keywords
        if max_price is None:
            if any(word in text for word in ["pas cher", "cheap", "budget", "economique", "abordable"]):
                max_price = 50.0
        
        if min_price is None:
            if any(word in text for word in ["cher", "expensive", "luxe", "premium", "haut de gamme"]):
                min_price = 200.0
        
        return min_price, max_price
    
    @classmethod
    def extract_rating(cls, text: str) -> Optional[float]:
        """Extract minimum rating from text"""
        text = cls. normalize_text(text)
        
        # Look for patterns like "4 etoiles", "4 stars", "4+"
        for i, char in enumerate(text):
            if char.isdigit():
                num = float(char)
                # Check what follows
                remaining = text[i+1:i+15]
                if any(word in remaining for word in ["etoile", "étoile", "star", "+", " +"]):
                    if 1 <= num <= 5:
                        return num
        
        # Check for keywords
        if any(word in text for word in ["bien note", "bien noté", "mieux note", "mieux noté", "top rated", "highly rated"]):
            return 4.0
        
        return None
    
    @classmethod
    def extract_reviews(cls, text: str) -> Optional[int]:
        """Extract minimum review count from text"""
        text = cls. normalize_text(text)
        
        # Look for patterns like "+1000 reviews", "plus de 1000 avis"
        for prefix in ["+", "plus de ", "au moins ", "min "]:
            if prefix in text:
                idx = text. find(prefix) + len(prefix)
                num_str = ""
                while idx < len(text) and text[idx].isdigit():
                    num_str += text[idx]
                    idx += 1
                if num_str:
                    # Check if followed by review-related word
                    remaining = text[idx:idx+20]
                    if any(word in remaining for word in ["review", "avis", "commentaire"]):
                        try:
                            return int(num_str)
                        except ValueError:
                            pass
        
        # Check for keywords
        if any(word in text for word in ["beaucoup d avis", "beaucoup d'avis", "many reviews", "populaire", "popular"]):
            return 100
        
        return None
    
    @classmethod
    def extract_category(cls, text: str) -> Optional[str]:
        """Extract category from text"""
        text_lower = cls.normalize_text(text)
        
        for keyword, category in cls.CATEGORY_MAPPINGS. items():
            if keyword in text_lower:
                return category
        
        return None
    
    @classmethod
    def extract_sort(cls, text: str) -> Tuple[Optional[str], Optional[str]]:
        """Extract sort field and order from text"""
        text_lower = cls.normalize_text(text)
        
        for keyword, (field, order) in cls.SORT_KEYWORDS. items():
            if keyword in text_lower:
                return field, order
        
        return None, None
    
    @classmethod
    def detect_intent(cls, text: str) -> Tuple[str, float]:
        """Detect search intent from text"""
        text_lower = cls.normalize_text(text)
        
        intent_scores: Dict[str, int] = {}
        
        for intent, keywords in cls.INTENT_KEYWORDS.items():
            score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    score += 1
            if score > 0:
                intent_scores[intent] = score
        
        if intent_scores:
            best_intent = max(intent_scores, key=intent_scores.get)
            confidence = min(intent_scores[best_intent] / 3.0, 1.0)
            return best_intent, confidence
        
        return "product_search", 0.5