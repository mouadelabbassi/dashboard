from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ConfidenceLevel(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class PotentialLevel(str, Enum):
    VERY_HIGH = "VERY_HIGH"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    VERY_LOW = "VERY_LOW"


class TrendType(str, Enum):
    IMPROVING = "IMPROVING"
    STABLE = "STABLE"
    DECLINING = "DECLINING"


class PriceAction(str, Enum):
    INCREASE = "INCREASE"
    DECREASE = "DECREASE"
    MAINTAIN = "MAINTAIN"


class Positioning(str, Enum):
    BUDGET = "BUDGET"
    VALUE = "VALUE"
    MID_RANGE = "MID_RANGE"
    PREMIUM = "PREMIUM"
    LUXURY = "LUXURY"


class ProductInput(BaseModel):
    asin: str
    product_name: Optional[str] = None
    price: float
    rating: Optional[float] = 3.0
    reviews_count: Optional[int] = 0
    sales_count: Optional[int] = 0
    ranking: Optional[int] = 999
    stock_quantity: Optional[int] = 0
    discount_percentage: Optional[float] = 0.0
    days_since_listed: Optional[int] = 0
    category_avg_price: Optional[float] = None
    category_avg_reviews: Optional[float] = None
    category_min_price: Optional[float] = None
    category_max_price: Optional[float] = None


class BestsellerPrediction(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    bestseller_probability: float = Field(..., ge=0.0, le=1.0)
    is_potential_bestseller: bool
    confidence_level: ConfidenceLevel
    potential_level: PotentialLevel
    recommendation: str
    predicted_at: datetime


class RankingTrendPrediction(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    current_rank: int
    predicted_trend: TrendType
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    estimated_change: int
    predicted_rank: int
    recommendation: str
    is_experimental: bool = True
    predicted_at: datetime


class PriceIntelligence(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    current_price: float
    recommended_price: float
    price_difference: float
    price_change_percentage: float
    price_action: PriceAction
    positioning: Positioning
    category_avg_price: float
    category_min_price: float
    category_max_price: float
    analysis_method: str = "STATISTICAL"
    should_notify_seller: bool = False
    analyzed_at: datetime


class CompletePrediction(BaseModel):
    product_id: str
    product_name: Optional[str] = None
    bestseller: BestsellerPrediction
    ranking_trend: RankingTrendPrediction
    price_intelligence: PriceIntelligence
    predicted_at: datetime


class BatchPredictionRequest(BaseModel):
    products: List[ProductInput]


class BatchPredictionResponse(BaseModel):
    predictions: List[BestsellerPrediction]
    total_count: int
    predicted_at: datetime


class TrainingResult(BaseModel):
    status: str
    model_type: str
    samples_trained: int
    samples_tested: int
    metrics: dict
    trained_at: datetime
    warnings: Optional[List[str]] = []


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: datetime
    database_connected: bool
    models_loaded: dict


class ModelMetrics(BaseModel):
    bestseller: dict
    ranking: dict
    metadata: dict