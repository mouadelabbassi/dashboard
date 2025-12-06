from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ExtractedEntities(BaseModel):
    keywords: List[str] = Field(default_factory=list)
    search_terms: List[str] = Field(default_factory=list)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    min_reviews: Optional[int] = None
    brand: Optional[str] = None
    sort_by: Optional[str] = None
    sort_order: str = "desc"
    is_bestseller: bool = False


class SmartSearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    user_id: Optional[int] = None
    user_role: Optional[str] = "BUYER"
    language: str = "fr"
    page: int = 0
    size: int = 20


class ParsedQueryResponse(BaseModel):
    original_query: str
    normalized_query: str
    intent: str
    confidence: float
    entities: ExtractedEntities


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
    relevance_score: float = 1.0


class SmartSearchResponse(BaseModel):
    success: bool = True
    query: ParsedQueryResponse
    results: List[ProductResult] = Field(default_factory=list)
    total_results: int = 0
    search_time_ms: float = 0.0
    suggestions: List[str] = Field(default_factory=list)
    filters_applied: Dict[str, Any] = Field(default_factory=dict)


class SuggestionResponse(BaseModel):
    suggestions: List[str] = Field(default_factory=list)
    trending: List[str] = Field(default_factory=list)
    recent: List[str] = Field(default_factory=list)