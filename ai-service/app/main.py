import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import settings
from app.routers.search import router as search_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global reference to embedding service
_embedding_service = None

def get_embedding_service():
    global _embedding_service
    if _embedding_service is None:
        from app.services.embedding_service import get_embedding_service as create_service
        _embedding_service = create_service()
    return _embedding_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    logger.info("Starting AI Search Service...")
    logger.info("Loading AI models...")
    
    try:
        service = get_embedding_service()
        if service.is_available():
            service.get_embedding("test query warmup")
            logger.info("AI embedding model loaded successfully")
        else:
            logger.warning("AI embeddings not available - running in fallback mode")
    except Exception as e:
        logger.warning(f"Could not load AI models: {e} - running in fallback mode")
    
    logger.info("AI Search Service started successfully")
    
    yield
    
    logger.info("Shutting down AI Search Service...")

# Create FastAPI app
app = FastAPI(
    title="AI Search Service",
    description="Intelligent search with NLP capabilities for the Dashboard",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(search_router)

@app.get("/")
async def root():
    return {
        "service": "AI Search Service",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health():
    try:
        service = get_embedding_service()
        return {
            "status": "healthy",
            "embeddings_available": service.is_available()
        }
    except Exception as e:
        return {
            "status": "healthy",
            "embeddings_available": False,
            "note": str(e)
        }