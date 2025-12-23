import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:

    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'database': os.getenv('DB_NAME', 'dashboard_db'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'kali')
    }

    MODELS_DIR = BASE_DIR / 'models'
    DATA_DIR = BASE_DIR / 'data'
    LOGS_DIR = BASE_DIR / 'logs'

    FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    FLASK_PORT = int(os.getenv('FLASK_PORT', 5001))
    FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    MODEL_VERSION = '1.0.0'

    BESTSELLER_THRESHOLDS = {
        'very_high': 80,
        'high': 60,
        'medium': 40,
        'low': 0
    }

    PRICE_CHANGE_THRESHOLD = 5.0
    RANKING_CHANGE_THRESHOLD = 100

    @classmethod
    def init_directories(cls):
        cls.MODELS_DIR.mkdir(exist_ok=True)
        cls.DATA_DIR.mkdir(exist_ok=True)
        cls.LOGS_DIR.mkdir(exist_ok=True)

Config.init_directories()