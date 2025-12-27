from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from app.core.schemas import (
    ProductInput, BestsellerPrediction, RankingTrendPrediction,
    PriceIntelligence, CompletePrediction, BatchPredictionRequest, BatchPredictionResponse
)
from app.ml.bestseller_model import BestsellerModel
from app.ml.ranking_model import RankingModel
from app.ml.price_optimizer import PriceOptimizer
from app.core.database import save_bestseller_prediction, save_ranking_prediction, save_price_intelligence
from app.core.exceptions import ModelNotLoadedException, PredictionException

logger = logging.getLogger(__name__)
router = APIRouter()

bestseller_model = BestsellerModel()
ranking_model = RankingModel()


@router.on_event("startup")
async def load_models():
    logger.info("Loading ML models")
    bestseller_model.load()
    ranking_model.load()


@router.post("/bestseller", response_model=BestsellerPrediction)
async def predict_bestseller(product: ProductInput):
    try:
        product_dict = product.dict()

        result = bestseller_model.predict(product_dict)

        response = BestsellerPrediction(
            product_id=product.asin,
            product_name=product.product_name,
            bestseller_probability=result['bestseller_probability'],
            is_potential_bestseller=result['is_potential_bestseller'],
            confidence_level=result['confidence_level'],
            potential_level=result['potential_level'],
            recommendation=result['recommendation'],
            predicted_at=datetime.now()
        )

        save_bestseller_prediction(product.asin, result)

        return response

    except ModelNotLoadedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Bestseller prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/bestseller/batch", response_model=BatchPredictionResponse)
async def predict_bestseller_batch(request: BatchPredictionRequest):
    try:
        predictions = []

        for product in request.products:
            product_dict = product.dict()
            result = bestseller_model.predict(product_dict)

            prediction = BestsellerPrediction(
                product_id=product.asin,
                product_name=product.product_name,
                bestseller_probability=result['bestseller_probability'],
                is_potential_bestseller=result['is_potential_bestseller'],
                confidence_level=result['confidence_level'],
                potential_level=result['potential_level'],
                recommendation=result['recommendation'],
                predicted_at=datetime.now()
            )

            predictions.append(prediction)
            save_bestseller_prediction(product.asin, result)

        return BatchPredictionResponse(
            predictions=predictions,
            total_count=len(predictions),
            predicted_at=datetime.now()
        )

    except ModelNotLoadedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ranking", response_model=RankingTrendPrediction)
async def predict_ranking(product: ProductInput):
    try:
        product_dict = product.dict()

        result = ranking_model.predict(product_dict)

        response = RankingTrendPrediction(
            product_id=product.asin,
            product_name=product.product_name,
            current_rank=result['current_rank'],
            predicted_trend=result['predicted_trend'],
            confidence_score=result['confidence_score'],
            estimated_change=result['estimated_change'],
            predicted_rank=result['predicted_rank'],
            recommendation=result['recommendation'],
            is_experimental=True,
            predicted_at=datetime.now()
        )

        save_ranking_prediction(product.asin, result)

        return response

    except ModelNotLoadedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Ranking prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/price-intelligence", response_model=PriceIntelligence)
async def analyze_price(product: ProductInput):
    try:
        product_dict = product.dict()

        result = PriceOptimizer.analyze(product_dict)

        response = PriceIntelligence(
            product_id=product.asin,
            product_name=product.product_name,
            current_price=result['current_price'],
            recommended_price=result['recommended_price'],
            price_difference=result['price_difference'],
            price_change_percentage=result['price_change_percentage'],
            price_action=result['price_action'],
            positioning=result['positioning'],
            category_avg_price=result['category_avg_price'],
            category_min_price=result['category_min_price'],
            category_max_price=result['category_max_price'],
            analysis_method=result['analysis_method'],
            should_notify_seller=result['should_notify_seller'],
            analyzed_at=datetime.now()
        )

        save_price_intelligence(product.asin, result)

        return response

    except Exception as e:
        logger.error(f"Price intelligence error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/complete", response_model=CompletePrediction)
async def predict_complete(product: ProductInput):
    try:
        product_dict = product.dict()

        bestseller_result = bestseller_model.predict(product_dict)
        ranking_result = ranking_model.predict(product_dict)
        price_result = PriceOptimizer.analyze(product_dict)

        bestseller_pred = BestsellerPrediction(
            product_id=product.asin,
            product_name=product.product_name,
            bestseller_probability=bestseller_result['bestseller_probability'],
            is_potential_bestseller=bestseller_result['is_potential_bestseller'],
            confidence_level=bestseller_result['confidence_level'],
            potential_level=bestseller_result['potential_level'],
            recommendation=bestseller_result['recommendation'],
            predicted_at=datetime.now()
        )

        ranking_pred = RankingTrendPrediction(
            product_id=product.asin,
            product_name=product.product_name,
            current_rank=ranking_result['current_rank'],
            predicted_trend=ranking_result['predicted_trend'],
            confidence_score=ranking_result['confidence_score'],
            estimated_change=ranking_result['estimated_change'],
            predicted_rank=ranking_result['predicted_rank'],
            recommendation=ranking_result['recommendation'],
            is_experimental=True,
            predicted_at=datetime.now()
        )

        price_intel = PriceIntelligence(
            product_id=product.asin,
            product_name=product.product_name,
            current_price=price_result['current_price'],
            recommended_price=price_result['recommended_price'],
            price_difference=price_result['price_difference'],
            price_change_percentage=price_result['price_change_percentage'],
            price_action=price_result['price_action'],
            positioning=price_result['positioning'],
            category_avg_price=price_result['category_avg_price'],
            category_min_price=price_result['category_min_price'],
            category_max_price=price_result['category_max_price'],
            analysis_method=price_result['analysis_method'],
            should_notify_seller=price_result['should_notify_seller'],
            analyzed_at=datetime.now()
        )

        save_bestseller_prediction(product.asin, bestseller_result)
        save_ranking_prediction(product.asin, ranking_result)
        save_price_intelligence(product.asin, price_result)

        return CompletePrediction(
            product_id=product.asin,
            product_name=product.product_name,
            bestseller=bestseller_pred,
            ranking_trend=ranking_pred,
            price_intelligence=price_intel,
            predicted_at=datetime.now()
        )

    except ModelNotLoadedException as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"Complete prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))