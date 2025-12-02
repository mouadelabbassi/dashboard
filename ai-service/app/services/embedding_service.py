import logging
import hashlib
from typing import List, Optional
import numpy as np
from cachetools import TTLCache
from app.config import settings

logger = logging.getLogger(__name__)

# Try to load sentence-transformers
EMBEDDINGS_AVAILABLE = False
SentenceTransformerModel = None

try:
    from sentence_transformers import SentenceTransformer
    SentenceTransformerModel = SentenceTransformer
    EMBEDDINGS_AVAILABLE = True
    logger.info("sentence-transformers loaded successfully")
except Exception as e:
    logger.warning(f"sentence-transformers not available: {e}")


class EmbeddingService:
    def __init__(self):
        self._model = None
        self._cache = TTLCache(maxsize=settings.MAX_CACHE_SIZE, ttl=settings.CACHE_TTL)
        self._load_model()
    
    def _load_model(self):
        if not EMBEDDINGS_AVAILABLE:
            logger.warning("Embeddings not available - using fallback mode")
            return
        try:
            logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL}")
            self._model = SentenceTransformerModel(settings.EMBEDDING_MODEL)
            logger.info("Embedding model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            self._model = None
    
    def is_available(self) -> bool:
        return self._model is not None
    
    def get_embedding(self, text: str) -> List[float]:
        if not self.is_available():
            return self._fallback_embedding(text)
        
        cache_key = hash(text)
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        try:
            embedding = self._model.encode(text, convert_to_numpy=True)
            embedding_list = embedding.tolist()
            self._cache[cache_key] = embedding_list
            return embedding_list
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            return self._fallback_embedding(text)
    
    def _fallback_embedding(self, text: str) -> List[float]:
        hash_obj = hashlib.md5(text.lower().encode())
        hash_bytes = hash_obj.digest()
        embedding = []
        for i in range(384):
            byte_idx = i % 16
            embedding.append((hash_bytes[byte_idx] - 128) / 128.0)
        return embedding
    
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(text) for text in texts]
    
    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        if norm1 == 0 or norm2 == 0:
            return 0.0
        return float(dot_product / (norm1 * norm2))


def get_embedding_service():
    return EmbeddingService()