import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # API
    API_HOST: str = os.getenv("API_HOST", "0.0.0.0")
    API_PORT: int = int(os.getenv("API_PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"

    # Database
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", "3306"))
    DB_NAME: str = os.getenv("DB_NAME", "dashboard_db")
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "kali")

    # Spring Boot fallback
    SPRING_BOOT_URL: str = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")

    # Cache Settings (AJOUTÉ)
    CACHE_TTL: int = 3600
    MAX_CACHE_SIZE: int = 10000

    # Embedding Model (AJOUTÉ)
    EMBEDDING_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"


settings = Settings()