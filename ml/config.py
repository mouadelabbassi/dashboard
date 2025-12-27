import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'kali'),
    'database': os.getenv('DB_NAME', 'dashboard_db'),
    'charset': 'utf8mb4'
}

# Connection string for SQLAlchemy
DATABASE_URL = f"mysql+pymysql://{DATABASE_CONFIG['user']}:{DATABASE_CONFIG['password']}@{DATABASE_CONFIG['host']}:{DATABASE_CONFIG['port']}/{DATABASE_CONFIG['database']}?charset=utf8mb4"

# ============================================================================
# MODEL CONFIGURATION
# ============================================================================

MODEL_CONFIG = {
    'bestseller': {
        # XGBoost parameters with aggressive regularization
        'n_estimators': 100,
        'max_depth': 4,  # Shallow trees to prevent overfitting
        'learning_rate': 0.05,
        'min_child_weight': 5,
        'subsample': 0.8,
        'colsample_bytree': 0.8,
        'reg_alpha': 1.0,  # L1 regularization
        'reg_lambda': 2.0,  # L2 regularization
        'scale_pos_weight': 3,  # Handle class imbalance
        'random_state': 42,
        'use_label_encoder': False,
        'eval_metric': 'logloss'
    },
    'ranking_trend': {
        # Random Forest parameters
        'n_estimators': 100,
        'max_depth': 5,  # Shallow to prevent overfitting
        'min_samples_split': 10,
        'min_samples_leaf': 5,
        'max_features': 'sqrt',
        'class_weight': 'balanced',
        'random_state': 42,
        'n_jobs': -1
    }
}

# ============================================================================
# CONFIDENCE THRESHOLDS
# ============================================================================

CONFIDENCE_THRESHOLDS = {
    'bestseller': {
        'high': 0.85,      # > 85% probability = HIGH confidence
        'medium': 0.70,    # 70-85% = MEDIUM confidence
        'low': 0.50        # 50-70% = LOW confidence
    },
    'ranking_trend': {
        'high': 0.80,
        'medium': 0.65,
        'low': 0.50
    }
}

# ============================================================================
# FEATURE CONFIGURATION
# ============================================================================

BESTSELLER_FEATURES = [
    'price',
    'rating',
    'reviews_count',
    'sales_count',
    'discount_percentage',
    'days_since_listed',
    'stock_quantity',
    'price_to_category_avg_ratio',
    'reviews_to_category_avg_ratio',
    'rating_normalized'
]

RANKING_TREND_FEATURES = [
    'current_rank',
    'price',
    'rating',
    'reviews_count',
    'sales_count',
    'price_change_7d',
    'review_velocity',
    'rating_trend',
    'category_rank_percentile'
]

# ============================================================================
# PATHS
# ============================================================================

PATHS = {
    'models_dir': os.path.join(os.path.dirname(__file__), 'models'),
    'logs_dir': os.path.join(os.path.dirname(__file__), 'logs'),
    'data_dir': os.path.join(os.path.dirname(__file__), 'data')
}

# Create directories if they don't exist
for path in PATHS.values():
    os.makedirs(path, exist_ok=True)

# Model file paths
MODEL_PATHS = {
    'bestseller': os.path.join(PATHS['models_dir'], 'bestseller_xgboost.pkl'),
    'ranking_trend': os.path.join(PATHS['models_dir'], 'ranking_trend_rf.pkl'),
    'bestseller_scaler': os.path.join(PATHS['models_dir'], 'bestseller_scaler.pkl'),
    'ranking_scaler': os.path.join(PATHS['models_dir'], 'ranking_scaler.pkl'),
    'label_encoder': os.path.join(PATHS['models_dir'], 'label_encoder.pkl'),
    'category_encoder': os.path.join(PATHS['models_dir'], 'category_encoder.pkl'),
    'metrics': os.path.join(PATHS['models_dir'], 'model_metrics.json')
}

# ============================================================================
# TRAINING CONFIGURATION
# ============================================================================

TRAINING_CONFIG = {
    'test_size': 0.2,
    'validation_size': 0.1,
    'random_state': 42,
    'cross_validation_folds': 5,
    'min_samples_for_training': 50,  # Minimum products required
    'batch_size': 100
}

# ============================================================================
# SERVICE CONFIGURATION
# ============================================================================

SERVICE_CONFIG = {
    'host': '0.0.0.0',
    'port': 5001,
    'debug': os.getenv('FLASK_DEBUG', 'true').lower() == 'true',
    'cors_origins': [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:8080'
    ]
}

# ============================================================================
# PREDICTION THRESHOLDS
# ============================================================================

PREDICTION_THRESHOLDS = {
    'bestseller_probability': 0.70,  # Threshold for "potential bestseller"
    'price_change_significant': 15,   # % change to trigger notification
    'ranking_change_significant': 10  # Positions change to flag
}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOGGING_CONFIG = {
    'level': os.getenv('LOG_LEVEL', 'INFO'),
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': os.path.join(PATHS['logs_dir'], 'ml_service.log')
}