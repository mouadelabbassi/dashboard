from fastapi import APIRouter
from datetime import datetime
import logging
import os

from app.core.schemas import HealthResponse, ModelMetrics
from app.core.database import test_connection
from config import settings

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    db_connected = test_connection()

    models_status = {
        "bestseller": "loaded" if os.path.exists(os.path.join(settings.MODEL_DIR, "bestseller_model.pkl")) else "not_trained",
        "ranking": "loaded" if os.path.exists(os.path.join(settings.MODEL_DIR, "ranking_model.pkl")) else "not_trained",
        "price": "statistical"
    }

    return HealthResponse(
        status="healthy" if db_connected else "degraded",
        service="MouadVision ML Service",
        version="1.0.0",
        timestamp=datetime.now(),
        database_connected=db_connected,
        models_loaded=models_status
    )


@router.get("/metrics", response_model=ModelMetrics)
async def get_metrics():
    import json

    metrics = {
        "bestseller": {},
        "ranking": {},
        "metadata": {
            "retrieved_at": datetime.now().isoformat(),
            "service_version": "1.0.0"
        }
    }

    bestseller_metadata_path = os.path.join(settings.MODEL_DIR, "bestseller_metadata.json")
    if os.path.exists(bestseller_metadata_path):
        with open(bestseller_metadata_path, 'r') as f:
            metadata = json.load(f)
            metrics["bestseller"] = metadata.get("metrics", {})

    ranking_metadata_path = os.path.join(settings.MODEL_DIR, "ranking_metadata.json")
    if os.path.exists(ranking_metadata_path):
        with open(ranking_metadata_path, 'r') as f:
            metadata = json.load(f)
            metrics["ranking"] = metadata.get("metrics", {})
            metrics["ranking"]["experimental"] = True

    return ModelMetrics(**metrics)