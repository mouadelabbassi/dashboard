import logging
import time
import httpx
from typing import List, Dict, Any
from urllib.parse import urlencode
from app.config import settings
from app.models. search_models import (
    SmartSearchRequest, SmartSearchResponse, ParsedQuery,
    ProductResult, ExtractedEntities, SearchIntent
)
from app.services.embedding_service import get_embedding_service
from app.services. intent_classifier import get_intent_classifier
from app.services. entity_extractor import get_entity_extractor

logger = logging.getLogger(__name__)


class SearchService:
    def __init__(self):
        self.spring_boot_url = settings. SPRING_BOOT_URL
        self.embedding_service = get_embedding_service()
        self.intent_classifier = get_intent_classifier()
        self.entity_extractor = get_entity_extractor()
    
    async def smart_search(self, request: SmartSearchRequest) -> SmartSearchResponse:
        start_time = time. time()
        
        try:
            parsed_query = self._parse_query(request.query)
            search_params = self._build_search_params(parsed_query, request)
            products = await self._fetch_products(search_params)
            
            if parsed_query.embedding and products and self.embedding_service. is_available():
                products = self._rank_by_similarity(products, parsed_query.embedding)
            
            suggestions = self._generate_suggestions(request.query, parsed_query)
            search_time_ms = (time. time() - start_time) * 1000
            
            return SmartSearchResponse(
                success=True,
                query=parsed_query,
                results=products,
                total_results=len(products),
                search_time_ms=search_time_ms,
                suggestions=suggestions,
                filters_applied=search_params
            )
        except Exception as e:
            logger.error(f"Search failed: {e}")
            import traceback
            traceback.print_exc()
            
            return SmartSearchResponse(
                success=False,
                query=ParsedQuery(
                    original_query=request. query,
                    normalized_query=request.query. lower(),
                    intent=SearchIntent. PRODUCT_SEARCH,
                    confidence=0.0,
                    entities=ExtractedEntities()
                ),
                results=[],
                total_results=0,
                search_time_ms=(time.time() - start_time) * 1000,
                suggestions=[]
            )
    
    def _parse_query(self, query: str) -> ParsedQuery:
        normalized = query.lower(). strip()
        intent, confidence = self.intent_classifier.classify(query)
        entities = self.entity_extractor.extract(query)
        
        embedding = None
        if self. embedding_service.is_available():
            try:
                embedding = self.embedding_service.get_embedding(query)
            except Exception as e:
                logger.warning(f"Could not generate embedding: {e}")
        
        return ParsedQuery(
            original_query=query,
            normalized_query=normalized,
            intent=intent,
            confidence=confidence,
            entities=entities,
            embedding=embedding
        )
    
    def _build_search_params(self, parsed: ParsedQuery, request: SmartSearchRequest) -> Dict[str, Any]:
        params = {"page": request.page, "size": request.size}
        entities = parsed.entities
        
        if entities.keywords:
            params["keyword"] = " ".join(entities.keywords)
        if entities.min_price is not None:
            params["minPrice"] = entities. min_price
        if entities.max_price is not None:
            params["maxPrice"] = entities. max_price
        if entities.min_rating is not None:
            params["minRating"] = entities. min_rating
        if entities.min_reviews is not None:
            params["minReviews"] = entities.min_reviews
        if entities.category:
            params["category"] = entities. category
        if entities.is_bestseller:
            params["isBestseller"] = "true"
        
        if entities.sort_by:
            params["sortBy"] = entities. sort_by
            params["sortOrder"] = entities.sort_order or "desc"
        elif parsed.intent == SearchIntent.TOP_RATED:
            params["sortBy"] = "rating"
            params["sortOrder"] = "desc"
        elif parsed.intent == SearchIntent.BESTSELLERS:
            params["sortBy"] = "salesCount"
            params["sortOrder"] = "desc"
        
        return params
    
    async def _fetch_products(self, params: Dict[str, Any]) -> List[ProductResult]:
        try:
            # Clean params - remove None values
            clean_params = {k: v for k, v in params.items() if v is not None}
            
            # Build URL properly
            base_url = f"{self.spring_boot_url}/api/search/products/search/smart"
            
            logger.info(f"Fetching products from: {base_url}")
            logger.info(f"With params: {clean_params}")
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(base_url, params=clean_params)
                
                logger.info(f"Response status: {response.status_code}")
                
                if response.status_code == 200:
                    data = response. json()
                    products_data = []
                    
                    if isinstance(data, dict):
                        if "data" in data:
                            inner = data["data"]
                            if isinstance(inner, dict) and "content" in inner:
                                products_data = inner["content"]
                            elif isinstance(inner, list):
                                products_data = inner
                        elif "content" in data:
                            products_data = data["content"]
                    elif isinstance(data, list):
                        products_data = data
                    
                    logger.info(f"Found {len(products_data)} products")
                    
                    return [
                        ProductResult(
                            asin=str(p. get("asin", "")),
                            product_name=str(p.get("productName", "")),
                            price=float(p.get("price", 0) or 0),
                            rating=float(p.get("rating")) if p.get("rating") else None,
                            reviews_count=int(p.get("reviewsCount")) if p.get("reviewsCount") else None,
                            category_name=str(p. get("categoryName", "")) if p.get("categoryName") else None,
                            image_url=str(p.get("imageUrl", "")) if p.get("imageUrl") else None,
                            seller_name=str(p.get("sellerName", "")) if p.get("sellerName") else None,
                            is_bestseller=bool(p.get("isBestseller", False)),
                            stock_quantity=int(p.get("stockQuantity")) if p.get("stockQuantity") else None,
                            relevance_score=1.0
                        )
                        for p in products_data
                    ]
                elif response.status_code == 401:
                    logger.error("Unauthorized - Spring Boot requires authentication")
                    return []
                elif response.status_code == 404:
                    logger.error("Endpoint not found on Spring Boot")
                    return []
                else:
                    logger.error(f"Spring Boot returned {response.status_code}: {response.text[:200]}")
                    return []
                    
        except httpx.ConnectError as e:
            logger.error(f"Cannot connect to Spring Boot at {self.spring_boot_url}: {e}")
            return []
        except Exception as e:
            logger.error(f"Failed to fetch products: {e}")
            import traceback
            traceback.print_exc()
            return []
    
    def _rank_by_similarity(self, products: List[ProductResult], query_embedding: List[float]) -> List[ProductResult]:
        if not products:
            return products
        try:
            product_names = [p.product_name for p in products]
            product_embeddings = self.embedding_service. get_embeddings(product_names)
            for i, product in enumerate(products):
                similarity = self. embedding_service.compute_similarity(query_embedding, product_embeddings[i])
                product.relevance_score = (product.relevance_score + similarity) / 2
            products.sort(key=lambda p: p. relevance_score, reverse=True)
        except Exception as e:
            logger. warning(f"Could not rank by similarity: {e}")
        return products
    
    def _generate_suggestions(self, query: str, parsed: ParsedQuery) -> List[str]:
        suggestions = []
        if not parsed.entities.max_price:
            suggestions.append(f"{query} pas cher")
        if not parsed.entities. min_rating:
            suggestions. append(f"{query} bien noté")
        suggestions.append(f"{query} meilleur prix")
        return suggestions[:5]
    
    async def get_suggestions(self, partial_query: str, limit: int = 10) -> List[str]:
        if len(partial_query) >= 2:
            return [
                f"{partial_query} pas cher",
                f"{partial_query} meilleur prix",
                f"{partial_query} bien noté",
                f"meilleur {partial_query}",
            ][:limit]
        return []


def get_search_service():
    return SearchService()