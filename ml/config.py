import os
from pathlib import Path

class Config:
    # Répertoire de base (où se trouve ce fichier)
    BASE_DIR = Path(__file__).parent.absolute()

    # Configuration du serveur
    HOST = os.getenv('FLASK_HOST', '0.0.0.0')
    PORT = int(os.getenv('FLASK_PORT', 5001))
    DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

    # Chemins des modèles ML entraînés
    MODELS_DIR = os.path.join(BASE_DIR, 'models')

    # Noms des fichiers de modèles
    RANKING_MODEL_FILE = 'ranking_model.pkl'
    BESTSELLER_MODEL_FILE = 'bestseller_model.pkl'
    PRICE_MODEL_FILE = 'price_recommendation_model.pkl'
    SCALER_FILE = 'feature_scaler.pkl'
    LABEL_ENCODERS_FILE = 'label_encoders.pkl'
    METRICS_FILE = 'training_metrics.json'

    # Seuils de décision
    BESTSELLER_THRESHOLD = 0.7
    PRICE_VARIATION_THRESHOLD = 0.15

    # URL du backend Spring Boot
    SPRING_BOOT_URL = os.getenv('SPRING_BOOT_URL', 'http://localhost:8080')

    @classmethod
    def get_model_path(cls, model_name):
        """Retourne le chemin complet d'un fichier de modèle"""
        return os.path.join(cls.MODELS_DIR, model_name)

    @classmethod
    def ensure_models_dir(cls):
        """Crée le répertoire models s'il n'existe pas"""
        os.makedirs(cls.MODELS_DIR, exist_ok=True)