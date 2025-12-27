from fastapi import APIRouter, HTTPException
from datetime import datetime
import logging

from app.core.schemas import TrainingResult
from app.ml.bestseller_model import BestsellerModel
from app.ml.ranking_model import RankingModel
from app.core.exceptions import TrainingException

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/bestseller", response_model=TrainingResult)
async def train_bestseller():
    try:
        logger.info("Starting bestseller model training")

        model = BestsellerModel()
        result = model.train()

        return TrainingResult(
            status=result['status'],
            model_type=result['model_type'],
            samples_trained=result['samples_trained'],
            samples_tested=result['samples_tested'],
            metrics=result['metrics'],
            trained_at=result['trained_at'],
            warnings=[]
        )

    except Exception as e:
        logger.error(f"Bestseller training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ranking", response_model=TrainingResult)
async def train_ranking():
    try:
        logger.info("Starting ranking model training")

        model = RankingModel()
        result = model.train()

        return TrainingResult(
            status=result['status'],
            model_type=result['model_type'],
            samples_trained=result['samples_trained'],
            samples_tested=result['samples_tested'],
            metrics=result['metrics'],
            trained_at=result['trained_at'],
            warnings=["Model uses synthetic labels - experimental"]
        )

    except Exception as e:
        logger.error(f"Ranking training error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/all")
async def train_all():
    results = {}

    try:
        logger.info("Training bestseller model")
        bestseller_model = BestsellerModel()
        results['bestseller'] = bestseller_model.train()
    except Exception as e:
        logger.error(f"Bestseller training failed: {e}")
        results['bestseller'] = {'status': 'error', 'error': str(e)}

    try:
        logger.info("Training ranking model")
        ranking_model = RankingModel()
        results['ranking'] = ranking_model.train()
    except Exception as e:
        logger.error(f"Ranking training failed: {e}")
        results['ranking'] = {'status': 'error', 'error': str(e)}

    return {
        'status': 'completed',
        'results': results,
        'trained_at': datetime.now().isoformat()
    }