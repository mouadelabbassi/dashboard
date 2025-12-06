"""
🔍 Smart Search Service - Direct Database Access (MySQL)
"""
import logging
import time
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from app.database import get_db
from app.services.nlp_engine import get_nlp_engine, ParsedQuery, SearchIntent
from app.models.search_models import (
    SmartSearchRequest, SmartSearchResponse, ProductResult,
    ParsedQueryResponse, ExtractedEntities
)

logger = logging.getLogger(__name__)


class SearchService:
    """
    🎯 Intelligent Search Service with Direct MySQL Access
    """

    def __init__(self):
        self.nlp = get_nlp_engine()
        logger.info("🔍 Search Service initialized with direct DB access")

    async def smart_search(self, request: SmartSearchRequest) -> SmartSearchResponse:
        """
        🚀 Main search method
        """
        start_time = time.time()

        try:
            # 1. Parse query with NLP
            parsed = self.nlp.parse(request.query)

            # 2. Search database directly
            products = self._search_database(parsed, request.page, request.size)

            # 3. Build response
            search_time_ms = (time.time() - start_time) * 1000

            return SmartSearchResponse(
                success=True,
                query=ParsedQueryResponse(
                    original_query=parsed.original,
                    normalized_query=parsed.normalized,
                    intent=parsed.intent.value,
                    confidence=parsed.confidence,
                    entities=ExtractedEntities(
                        keywords=parsed.keywords,
                        search_terms=parsed.search_terms,
                        category=parsed.category,
                        min_price=parsed.min_price,
                        max_price=parsed.max_price,
                        min_rating=parsed.min_rating,
                        min_reviews=parsed.min_reviews,
                        brand=parsed.brand,
                        sort_by=parsed.sort_by,
                        sort_order=parsed.sort_order,
                        is_bestseller=parsed.is_bestseller,
                    )
                ),
                results=products,
                total_results=len(products),
                search_time_ms=search_time_ms,
                suggestions=self._generate_suggestions(parsed),
                filters_applied={
                    "search_terms": parsed.search_terms,
                    "category": parsed.category,
                    "max_price": parsed.max_price,
                    "min_rating": parsed.min_rating,
                    "min_reviews": parsed.min_reviews,
                }
            )

        except Exception as e:
            logger.error(f"❌ Search failed: {e}", exc_info=True)
            return SmartSearchResponse(
                success=False,
                query=ParsedQueryResponse(
                    original_query=request.query,
                    normalized_query=request.query.lower(),
                    intent="product_search",
                    confidence=0.0,
                    entities=ExtractedEntities()
                ),
                results=[],
                total_results=0,
                search_time_ms=0,
                suggestions=[],
                filters_applied={}
            )

    def _search_database(self, parsed: ParsedQuery, page: int, size: int) -> List[ProductResult]:
        """
        🗄️ Search MySQL database directly
        """
        try:
            with get_db() as db:
                # Build dynamic SQL
                conditions = ["p.approval_status = 'APPROVED'"]
                params = {}

                # Search terms - search in product name
                if parsed.search_terms:
                    search_conditions = []
                    for i, term in enumerate(parsed.search_terms):
                        param_name = f"term_{i}"
                        search_conditions.append(f"LOWER(p.product_name) LIKE :{param_name}")
                        params[param_name] = f"%{term.lower()}%"

                    if search_conditions:
                        conditions.append(f"({' OR '.join(search_conditions)})")

                # Category filter
                if parsed.category:
                    conditions.append("LOWER(c.name) LIKE :category")
                    params["category"] = f"%{parsed.category.lower()}%"

                # Price filters
                if parsed.min_price is not None:
                    conditions.append("p.price >= :min_price")
                    params["min_price"] = parsed.min_price

                if parsed.max_price is not None:
                    conditions.append("p.price <= :max_price")
                    params["max_price"] = parsed.max_price

                # Rating filter
                if parsed.min_rating is not None:
                    conditions.append("p.rating >= :min_rating")
                    params["min_rating"] = parsed.min_rating

                # Reviews filter 🆕
                if parsed.min_reviews is not None:
                    conditions.append("p.reviews_count >= :min_reviews")
                    params["min_reviews"] = parsed.min_reviews

                # Brand filter
                if parsed.brand:
                    conditions.append("LOWER(p.product_name) LIKE :brand")
                    params["brand"] = f"%{parsed.brand.lower()}%"

                # Bestseller filter
                if parsed.is_bestseller:
                    conditions.append("p.is_bestseller = 1")

                # Build ORDER BY (MySQL compatible)
                order_by = self._build_order_by(parsed)

                # Build WHERE clause
                where_clause = " AND ".join(conditions)

                # MySQL compatible query
                query = f"""
                    SELECT 
                        p.asin,
                        p.product_name,
                        p.price,
                        p.rating,
                        p.reviews_count,
                        p.image_url,
                        p.stock_quantity,
                        p.is_bestseller,
                        p.sales_count,
                        p.ranking,
                        c.name as category_name,
                        COALESCE(u.store_name, 'MouadVision') as seller_name
                    FROM products p
                    LEFT JOIN categories c ON p.category_id = c.id
                    LEFT JOIN users u ON p.seller_id = u.id
                    WHERE {where_clause}
                    ORDER BY {order_by}
                    LIMIT :limit OFFSET :offset
                """

                params["limit"] = size
                params["offset"] = page * size

                logger.info(f"🔍 Executing search query...")
                logger.debug(f"   SQL: {query}")
                logger.debug(f"   Params: {params}")

                result = db.execute(text(query), params)
                rows = result.fetchall()

                logger.info(f"✅ Found {len(rows)} products")

                # Convert to ProductResult
                products = []
                for row in rows:
                    products.append(ProductResult(
                        asin=row.asin,
                        product_name=row.product_name,
                        price=float(row.price) if row.price else 0.0,
                        rating=float(row.rating) if row.rating else None,
                        reviews_count=row.reviews_count,
                        category_name=row.category_name,
                        image_url=row.image_url,
                        seller_name=row.seller_name,
                        is_bestseller=bool(row.is_bestseller) if row.is_bestseller else False,
                        stock_quantity=row.stock_quantity,
                        relevance_score=1.0
                    ))

                return products

        except Exception as e:
            logger.error(f"❌ Database search failed: {e}", exc_info=True)
            return []

    def _build_order_by(self, parsed: ParsedQuery) -> str:
        """
        Build ORDER BY clause - MySQL compatible
        MySQL does NOT support NULLS LAST, use ISNULL() instead
        """
        sort_map = {
            "price": "p.price",
            "rating": "p.rating",
            "sales_count": "p.sales_count",
            "ranking": "p.ranking",
            "reviews_count": "p.reviews_count",
            "created_at": "p.asin",
        }

        field = sort_map.get(parsed.sort_by, "p.ranking")

        # MySQL compatible NULL handling (ISNULL puts NULLs last)
        if parsed.sort_order == "desc":
            return f"ISNULL({field}), {field} DESC"
        else:
            return f"ISNULL({field}), {field} ASC"

    def _generate_suggestions(self, parsed: ParsedQuery) -> List[str]:
        """Generate search suggestions"""
        suggestions = []
        base = " ".join(parsed.search_terms) if parsed.search_terms else ""
        
        if not base and parsed.original:
            words = parsed.original.split()
            if words:
                base = words[0]

        if base and len(base) > 2:
            if not parsed.max_price:
                suggestions.append(f"{base} pas cher")
            if not parsed.min_rating:
                suggestions.append(f"{base} bien noté")
            if not parsed.min_reviews:
                suggestions.append(f"{base} +1000 avis")
            suggestions.append(f"{base} meilleur prix")
            suggestions.append(f"meilleur {base}")

        return suggestions[:5]

    async def get_suggestions(self, partial: str, limit: int = 10) -> List[str]:
        """Get autocomplete suggestions from database"""
        try:
            with get_db() as db:
                query = """
                    SELECT DISTINCT product_name
                    FROM products
                    WHERE LOWER(product_name) LIKE :search
                    AND approval_status = 'APPROVED'
                    LIMIT :limit
                """
                result = db.execute(text(query), {
                    "search": f"%{partial.lower()}%",
                    "limit": limit
                })
                return [row[0] for row in result.fetchall()]
        except Exception as e:
            logger.error(f"Suggestions error: {e}")
            return []


# Singleton instance
_search_service = None


def get_search_service() -> SearchService:
    global _search_service
    if _search_service is None:
        _search_service = SearchService()
    return _search_service