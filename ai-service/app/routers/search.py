import logging
from fastapi import APIRouter, HTTPException, Query
from app.models.search_models import (
    SmartSearchRequest, SmartSearchResponse, SuggestionResponse
)
from app.services.search_service import get_search_service
from app.services.nlp_engine import get_nlp_engine

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["🔍 AI Search"])


@router.post("/search", response_model=SmartSearchResponse)
async def smart_search(request: SmartSearchRequest):
    try:
        service = get_search_service()
        result = await service.smart_search(request)
        return result
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/search")
async def smart_search_get(
    query: str = Query(..., min_length=1),
    page: int = Query(0, ge=0),
    size: int = Query(20, ge=1, le=100)
):
    """GET version of smart search"""
    request = SmartSearchRequest(query=query, page=page, size=size)
    service = get_search_service()
    return await service.smart_search(request)


@router.get("/suggestions")
async def get_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50)
):
    """Get autocomplete suggestions"""
    try:
        service = get_search_service()
        suggestions = await service.get_suggestions(q, limit)
        return SuggestionResponse(suggestions=suggestions)
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        return SuggestionResponse(suggestions=[])


@router.get("/analyze")
async def analyze_query(query: str = Query(..., min_length=1)):
    """
    🧠 Analyze a query without searching
    Shows how NLP parses the query
    """
    nlp = get_nlp_engine()
    parsed = nlp.parse(query)
    
    return {
        "query": query,
        "parsed": {
            "intent": parsed.intent.value,
            "confidence": parsed.confidence,
            "search_terms": parsed.search_terms,
            "category": parsed.category,
            "brand": parsed.brand,
            "min_price": parsed.min_price,
            "max_price": parsed.max_price,
            "min_rating": parsed.min_rating,
            "sort_by": parsed.sort_by,
            "is_bestseller": parsed.is_bestseller,
        }
    }


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-search-v2"}