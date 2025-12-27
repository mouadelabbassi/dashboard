"""
Model Utilities for MouadVision ML Service
Mini Projet JEE 2025 - ENSA Khouribga

Utilities for model evaluation, metrics calculation, and visualization.
"""

import numpy as np
import pandas as pd
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report,
    mean_squared_error, mean_absolute_error, r2_score
)
import joblib

from config import MODEL_PATHS, CONFIDENCE_THRESHOLDS

logger = logging.getLogger(__name__)


class ModelMetrics:
    """
    Utility class for calculating and storing model metrics.
    """

    def __init__(self):
        self.metrics = {}

    def calculate_classification_metrics(
            self,
            y_true: np.ndarray,
            y_pred: np.ndarray,
            y_proba: Optional[np.ndarray] = None,
            model_name: str = 'model'
    ) -> Dict[str, Any]:
        """
        Calculate comprehensive classification metrics.

        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_proba: Predicted probabilities (optional)
            model_name: Name of the model for logging

        Returns:
            Dictionary of metrics
        """
        metrics = {
            'accuracy': float(accuracy_score(y_true, y_pred)),
            'precision': float(precision_score(y_true, y_pred, average='weighted', zero_division=0)),
            'recall': float(recall_score(y_true, y_pred, average='weighted', zero_division=0)),
            'f1_score': float(f1_score(y_true, y_pred, average='weighted', zero_division=0))
        }

        # AUC-ROC for binary classification
        if y_proba is not None and len(np.unique(y_true)) == 2:
            try:
                if y_proba.ndim > 1:
                    # Use positive class probabilities
                    metrics['auc_roc'] = float(roc_auc_score(y_true, y_proba[:, 1]))
                else:
                    metrics['auc_roc'] = float(roc_auc_score(y_true, y_proba))
            except Exception as e:
                logger.warning(f"Could not calculate AUC-ROC: {e}")
                metrics['auc_roc'] = None

        # Confusion matrix
        cm = confusion_matrix(y_true, y_pred)
        metrics['confusion_matrix'] = cm.tolist()

        # Per-class metrics
        report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
        metrics['per_class'] = report

        # Store
        self.metrics[model_name] = metrics

        logger.info(f"{model_name} metrics: Acc={metrics['accuracy']:.4f}, "
                    f"F1={metrics['f1_score']:.4f}, Prec={metrics['precision']:.4f}, "
                    f"Recall={metrics['recall']:.4f}")

        return metrics

    def calculate_regression_metrics(
            self,
            y_true: np.ndarray,
            y_pred: np.ndarray,
            model_name: str = 'model'
    ) -> Dict[str, Any]:
        """
        Calculate regression metrics.
        """
        metrics = {
            'r2_score': float(r2_score(y_true, y_pred)),
            'rmse': float(np.sqrt(mean_squared_error(y_true, y_pred))),
            'mae': float(mean_absolute_error(y_true, y_pred)),
            'mape': float(np.mean(np.abs((y_true - y_pred) / (y_true + 1e-10))) * 100)
        }

        self.metrics[model_name] = metrics

        logger.info(f"{model_name} metrics: R²={metrics['r2_score']:.4f}, "
                    f"RMSE={metrics['rmse']:.4f}, MAE={metrics['mae']:.4f}")

        return metrics

    def save_metrics(self, filepath: str = None):
        """Save all metrics to JSON file"""
        if filepath is None:
            filepath = MODEL_PATHS['metrics']

        data = {
            'metrics': self.metrics,
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0'
        }

        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)

        logger.info(f"Metrics saved to {filepath}")

    def load_metrics(self, filepath: str = None) -> Dict[str, Any]:
        """Load metrics from JSON file"""
        if filepath is None:
            filepath = MODEL_PATHS['metrics']

        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
            self.metrics = data.get('metrics', {})
            return data
        except FileNotFoundError:
            logger.warning(f"Metrics file not found: {filepath}")
            return {}
        except Exception as e:
            logger.error(f"Error loading metrics: {e}")
            return {}


def get_confidence_level(probability: float, model_type: str = 'bestseller') -> str:
    """
    Convert probability to confidence level (HIGH, MEDIUM, LOW).

    Args:
        probability: Prediction probability (0-1)
        model_type: 'bestseller' or 'ranking_trend'

    Returns:
        Confidence level string
    """
    thresholds = CONFIDENCE_THRESHOLDS.get(model_type, CONFIDENCE_THRESHOLDS['bestseller'])

    if probability >= thresholds['high']:
        return 'HIGH'
    elif probability >= thresholds['medium']:
        return 'MEDIUM'
    elif probability >= thresholds['low']:
        return 'LOW'
    else:
        return 'VERY_LOW'


def get_bestseller_potential_level(probability: float) -> str:
    """
    Convert bestseller probability to potential level description.
    """
    if probability >= 0.85:
        return 'TRÈS ÉLEVÉ'
    elif probability >= 0.70:
        return 'ÉLEVÉ'
    elif probability >= 0.50:
        return 'MODÉRÉ'
    elif probability >= 0.30:
        return 'FAIBLE'
    else:
        return 'TRÈS FAIBLE'


def get_trend_description(trend: str) -> str:
    """Get French description for trend"""
    descriptions = {
        'IMPROVING': 'Le classement devrait s\'améliorer',
        'AMÉLIORATION': 'Le classement devrait s\'améliorer',
        'STABLE': 'Le classement devrait rester stable',
        'DECLINING': 'Le classement risque de baisser',
        'DÉCLIN': 'Le classement risque de baisser'
    }
    return descriptions.get(trend.upper(), 'Tendance inconnue')


def get_price_action_description(action: str, percentage: float) -> str:
    """Get French description for price action"""
    if action == 'INCREASE' or action == 'AUGMENTER':
        return f'Envisagez d\'augmenter le prix de {abs(percentage):.1f}%'
    elif action == 'DECREASE' or action == 'DIMINUER':
        return f'Envisagez de réduire le prix de {abs(percentage):.1f}%'
    else:
        return 'Le prix actuel est bien positionné'


def get_feature_importance(model, feature_names: list) -> Dict[str, float]:
    """
    Extract feature importance from a trained model.

    Args:
        model: Trained model with feature_importances_ attribute
        feature_names: List of feature names

    Returns:
        Dictionary mapping feature names to importance values
    """
    try:
        importances = model.feature_importances_

        # Normalize to sum to 1
        importances = importances / importances.sum()

        # Create dictionary
        importance_dict = {
            name: float(imp)
            for name, imp in zip(feature_names, importances)
        }

        # Sort by importance
        importance_dict = dict(sorted(
            importance_dict.items(),
            key=lambda x: x[1],
            reverse=True
        ))

        return importance_dict

    except Exception as e:
        logger.error(f"Error extracting feature importance: {e}")
        return {}


def generate_recommendation(
        prediction_type: str,
        prediction_value: Any,
        confidence: float,
        additional_data: dict = None
) -> str:
    """
    Generate actionable recommendation based on prediction.

    Args:
        prediction_type: 'bestseller', 'ranking', or 'price'
        prediction_value: The prediction result
        confidence: Confidence score (0-1)
        additional_data: Additional context for the recommendation

    Returns:
        Recommendation string in French
    """
    if prediction_type == 'bestseller':
        prob = float(prediction_value)
        if prob >= 0.85:
            return "🎯 Fort potentiel bestseller! Mettez ce produit en avant dans vos promotions."
        elif prob >= 0.70:
            return "⭐ Bon potentiel. Optimisez le prix et les images pour maximiser les chances."
        elif prob >= 0.50:
            return "📈 Potentiel modéré. Améliorez les avis et la visibilité du produit."
        else:
            return "⚠️ Potentiel limité. Analysez la concurrence et ajustez votre stratégie."

    elif prediction_type == 'ranking':
        trend = str(prediction_value).upper()
        if 'IMPROVING' in trend or 'AMÉLIORATION' in trend:
            return "📈 Tendance positive! Maintenez votre stratégie actuelle."
        elif 'DECLINING' in trend or 'DÉCLIN' in trend:
            return "⚠️ Attention: déclin prévu. Revoyez prix, images et description."
        else:
            return "➡️ Stabilité prévue. Explorez de nouvelles opportunités de visibilité."

    elif prediction_type == 'price':
        action = str(prediction_value).upper()
        pct = additional_data.get('percentage', 0) if additional_data else 0
        if 'INCREASE' in action or 'AUGMENTER' in action:
            return f"💰 Opportunité de marge! Prix recommandé +{abs(pct):.0f}% vs actuel."
        elif 'DECREASE' in action or 'DIMINUER' in action:
            return f"🏷️ Prix trop élevé. Réduction de {abs(pct):.0f}% recommandée."
        else:
            return "✅ Prix bien positionné par rapport au marché."

    return "Pas de recommandation spécifique."


def validate_prediction_input(data: dict, required_fields: list) -> tuple:
    """
    Validate input data for prediction.

    Returns:
        (is_valid, error_message or None)
    """
    if not data:
        return False, "No data provided"

    missing = [f for f in required_fields if f not in data or data[f] is None]

    if missing:
        return False, f"Missing required fields: {missing}"

    return True, None


def format_prediction_response(
        product_id: str,
        product_name: str,
        bestseller: dict = None,
        ranking: dict = None,
        price: dict = None
) -> dict:
    """
    Format a complete prediction response.
    """
    response = {
        'productId': product_id,
        'productName': product_name,
        'generatedAt': datetime.now().isoformat()
    }

    if bestseller:
        response['bestsellerPrediction'] = {
            'bestsellerProbability': bestseller.get('probability', 0),
            'isPotentialBestseller': bestseller.get('is_potential', False),
            'potentialLevel': bestseller.get('level', 'FAIBLE'),
            'recommendation': bestseller.get('recommendation', ''),
            'confidence': bestseller.get('confidence', 0)
        }

    if ranking:
        response['rankingPrediction'] = {
            'predictedTrend': ranking.get('trend', 'STABLE'),
            'trendDescription': ranking.get('description', ''),
            'estimatedChange': ranking.get('change', 0),
            'confidence': ranking.get('confidence', 0)
        }

    if price:
        response['pricePrediction'] = {
            'currentPrice': price.get('current', 0),
            'recommendedPrice': price.get('recommended', 0),
            'priceDifference': price.get('difference', 0),
            'priceChangePercentage': price.get('change_pct', 0),
            'priceAction': price.get('action', 'MAINTAIN'),
            'actionDescription': price.get('action_desc', ''),
            'shouldNotifySeller': price.get('notify', False),
            'confidence': price.get('confidence', 0)
        }

    return response


# Singleton metrics instance
metrics_calculator = ModelMetrics()


if __name__ == '__main__':
    # Test utilities
    print("Testing model utilities...")

    # Test confidence levels
    for prob in [0.95, 0.80, 0.65, 0.40]:
        level = get_confidence_level(prob)
        potential = get_bestseller_potential_level(prob)
        print(f"Prob {prob:.2f}: Confidence={level}, Potential={potential}")

    # Test recommendations
    for prob in [0.90, 0.75, 0.55, 0.25]:
        rec = generate_recommendation('bestseller', prob, prob)
        print(f"Bestseller {prob:.2f}: {rec}")

    print("\n✅ Utilities working correctly")