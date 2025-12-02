from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum

class SearchIntent(str, Enum):
    PRODUCT_SEARCH = "product_search"
    PRICE_FILTER = "price_filter"
    CATEGORY_SEARCH = "category_search"
    TOP_RATED = "top_rated"
    BEST_VALUE = "best_value"
    NEW_ARRIVALS = "new_arrivals"
    BESTSELLERS = "bestsellers"
    SELLER_PRODUCTS = "seller_products"
    LOW_STOCK = "low_stock"
    COMPARISON = "comparison"
    UNKNOWN = "unknown"

class ExtractedEntities(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    min_reviews: Optional[int] = None
    seller_name: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: Optional[str] = None
    limit: Optional[int] = None
    time_filter: Optional[str] = None
    is_bestseller: Optional[bool] = None

class SmartSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[int] = None
    user_role: Optional[str] = "BUYER"
    language: str = "fr"
    page: int = 0
    size: int = 20

class ParsedQuery(BaseModel):
    original_query: str
    normalized_query: str
    intent: SearchIntent
    confidence: float
    entities: ExtractedEntities
    embedding: Optional[List[float]] = None
    suggestions: List[str] = Field(default_factory=list)

class ProductResult(BaseModel):
    asin: str
    product_name: str
    price: float
    rating: Optional[float] = None
    reviews_count: Optional[int] = None
    category_name: Optional[str] = None
    image_url: Optional[str] = None
    seller_name: Optional[str] = None
    is_bestseller: bool = False
    stock_quantity: Optional[int] = None
    relevance_score: float = 0.0

class SmartSearchResponse(BaseModel):
    success: bool = True
    query: ParsedQuery
    results: List[ProductResult] = Field(default_factory=list)
    total_results: int = 0
    search_time_ms: float = 0.0
    suggestions: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)

class SuggestionRequest(BaseModel):
    partial_query: str
    user_id: Optional[int] = None
    limit: int = 10

class SuggestionResponse(BaseModel):
    suggestions: List[str]
    trending: List[str] = Field(default_factory=list)
    recent: List[str] = Field(default_factory=list)