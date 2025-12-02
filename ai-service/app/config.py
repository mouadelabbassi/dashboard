import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # API Settings
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Model Settings
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    SPACY_MODEL: str = "fr_core_news_md"

    # Cache Settings
    CACHE_TTL: int = 3600  # 1 hour
    MAX_CACHE_SIZE: int = 10000

    # Search Settings
    MAX_RESULTS: int = 50
    SIMILARITY_THRESHOLD: float = 0.3

    # Spring Boot Backend
    SPRING_BOOT_URL: str = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")

settings = Settings()