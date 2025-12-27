"""
Utilities Package for MouadVision ML Service
"""

from utils.database import DatabaseManager, db, get_products_for_training
from utils.enhanced_data_loader import DataLoader, load_and_prepare_data
from utils.model_utils import (
    ModelMetrics,
    metrics_calculator,
    get_confidence_level,
    get_bestseller_potential_level,
    get_feature_importance,
    generate_recommendation
)

__all__ = [
    'DatabaseManager',
    'db',
    'get_products_for_training',
    'DataLoader',
    'load_and_prepare_data',
    'ModelMetrics',
    'metrics_calculator',
    'get_confidence_level',
    'get_bestseller_potential_level',
    'get_feature_importance',
    'generate_recommendation'
]