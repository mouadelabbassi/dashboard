from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from config import settings
from app.api import health, predictions, training

logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="MouadVision ML Service",
    description="Predictive Analytics",
    version="1.0.0"
)

if settings.ENABLE_CORS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(health.router, prefix="", tags=["Health"])
app.include_router(predictions.router, prefix="/predict", tags=["Predictions"])
app.include_router(training.router, prefix="/train", tags=["Training"])


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("MouadVision Starting")
    logger.info("=" * 60)
    logger.info(f"Service URL: http://{settings.ML_SERVICE_HOST}:{settings.ML_SERVICE_PORT}")
    logger.info(f"Database: {settings.DB_NAME}")
    logger.info(f"Model Path: {settings.MODEL_DIR}")
    logger.info("=" * 60)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("MouadVision Shutting Down")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.ML_SERVICE_HOST,
        port=settings.ML_SERVICE_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )