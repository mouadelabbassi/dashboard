import logging
from fastapi import APIRouter, HTTPException, Query
from app.models.search_models import (
    SmartSearchRequest, SmartSearchResponse,
    SuggestionResponse
)
from app.services.search_service import get_search_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI Search"])

# Create service instance
_search_service = None

def get_service():
    global _search_service
    if _search_service is None:
        _search_service = get_search_service()
    return _search_service


@router.post("/search", response_model=SmartSearchResponse)
async def smart_search(request: SmartSearchRequest):
    try:
        service = get_service()
        result = await service.smart_search(request)
        return result
    except Exception as e:
        logger.error(f"Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/suggestions")
async def get_suggestions(
    q: str = Query(..., min_length=1),
    limit: int = Query(10, ge=1, le=50)
):
    try:
        service = get_service()
        suggestions = await service.get_suggestions(q, limit)
        return SuggestionResponse(suggestions=suggestions, trending=[], recent=[])
    except Exception as e:
        logger.error(f"Suggestions error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "ai-search"}


@router.get("/analyze")
async def analyze_query(query: str = Query(..., min_length=1)):
    from app.services.intent_classifier import get_intent_classifier
    from app.services.entity_extractor import get_entity_extractor
    
    classifier = get_intent_classifier()
    extractor = get_entity_extractor()
    
    intent, confidence = classifier.classify(query)
    entities = extractor.extract(query)
    
    return {
        "query": query,
        "intent": intent.value,
        "confidence": confidence,
        "entities": entities.dict()
    }