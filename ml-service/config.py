from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "kali"
    DB_NAME: str = "dashboard_db"

    ML_SERVICE_HOST: str = "0.0.0.0"
    ML_SERVICE_PORT: int = 5001

    SPRING_BOOT_URL: str = "http://localhost:8080"

    MODEL_PATH: str = "app/models"
    LOG_LEVEL: str = "INFO"

    ENABLE_CORS: bool = True

    @property
    def CORS_ORIGINS(self) -> List[str]:
        return [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:8080"
        ]

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}?charset=utf8mb4"

    @property
    def MODEL_DIR(self) -> str:
        path = os.path.join(os.getcwd(), self.MODEL_PATH)
        os.makedirs(path, exist_ok=True)
        return path

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


settings = Settings()


MODEL_CONFIG = {
    "bestseller": {
        "n_estimators": 100,
        "max_depth": 4,
        "learning_rate": 0.05,
        "min_child_weight": 5,
        "subsample": 0.8,
        "colsample_bytree": 0.8,
        "reg_alpha": 1.0,
        "reg_lambda": 2.0,
        "scale_pos_weight": 3,
        "random_state": 42
    },
    "ranking": {
        "n_estimators": 100,
        "max_depth": 5,
        "min_samples_split": 10,
        "min_samples_leaf": 5,
        "max_features": "sqrt",
        "class_weight": "balanced",
        "random_state": 42
    }
}

CONFIDENCE_THRESHOLDS = {
    "bestseller": {
        "high": 0.85,
        "medium": 0.70,
        "low": 0.50
    },
    "ranking": {
        "high": 0.80,
        "medium": 0.65,
        "low": 0.50
    }
}