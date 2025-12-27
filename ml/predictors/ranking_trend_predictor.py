"""
Ranking Trend Prediction Service
MouadVision ML Service - Mini Projet JEE 2025

Handles ranking trend predictions using trained Random Forest model.
Predicts: IMPROVING, STABLE, DECLINING

⚠️ EXPERIMENTAL: Uses synthetic labels - interpret with caution.
"""

import os
import sys
import logging
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
import joblib

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_PATHS, CONFIDENCE_THRESHOLDS
from utils.model_utils import (
    get_confidence_level,
    get_trend_description,
    generate_recommendation
)

logger = logging.getLogger(__name__)


class RankingTrendPredictor:
    """
    Ranking trend predictor using trained Random Forest model.

    ⚠️ EXPERIMENTAL: This model uses synthetic trend labels.
    Real ranking trend prediction requires historical data.
    """

    # Trend labels
    TREND_LABELS = ['DECLINING', 'STABLE', 'IMPROVING']
    TREND_LABELS_FR = {
        'DECLINING': 'DÉCLIN',
        'STABLE': 'STABLE',
        'IMPROVING': 'AMÉLIORATION'
    }

    def __init__(self):
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_names = None
        self.metrics = None
        self._loaded = False

        # Try to load model on initialization
        self._load_model()

    def _load_model(self):
        """Load the trained model, scaler, and label encoder"""
        model_path = MODEL_PATHS['ranking_trend']
        scaler_path = MODEL_PATHS['ranking_scaler']
        encoder_path = MODEL_PATHS['label_encoder']
        metadata_path = model_path.replace('.pkl', '_metadata.json')

        try:
            if not os.path.exists(model_path):
                logger.warning(f"Model not found: {model_path}")
                return

            self.model = joblib.load(model_path)
            logger.info(f"✅ Loaded ranking model from {model_path}")

            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✅ Loaded scaler from {scaler_path}")

            if os.path.exists(encoder_path):
                self.label_encoder = joblib.load(encoder_path)
                logger.info(f"✅ Loaded label encoder from {encoder_path}")

            if os.path.exists(metadata_path):
                with open(metadata_path, 'r') as f:
                    metadata = json.load(f)
                self.feature_names = metadata.get('feature_names', [])
                self.metrics = metadata.get('metrics', {})
                logger.info(f"✅ Loaded metadata with {len(self.feature_names)} features")

            self._loaded = True

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self._loaded = False

    def is_loaded(self) -> bool:
        """Check if model is loaded and ready"""
        return self._loaded and self.model is not None

    def get_metrics(self) -> Dict[str, Any]:
        """Get model metrics"""
        if self.metrics:
            return {
                'r2_score': self.metrics.get('accuracy', 0.0),
                'rmse': 1 - self.metrics.get('f1_score', 0.0),
                'mae': 1 - self.metrics.get('accuracy', 0.0),
                'feature_importance': self.metrics.get('feature_importance', {})
            }
        return {
            'r2_score': 0.0,
            'rmse': 1.0,
            'mae': 1.0,
            'feature_importance': {}
        }

    def _prepare_features(self, product_data: Dict) -> np.ndarray:
        """
        Prepare features for prediction from raw product data.

        Args:
            product_data: Dictionary with product attributes

        Returns:
            Feature array ready for prediction
        """
        # Field mapping
        field_mapping = {
            'current_rank': ['ranking', 'current_rank', 'currentRank', 'rank'],
            'price': ['price', 'Price', 'unit_price'],
            'rating': ['rating', 'Rating', 'average_rating'],
            'reviews_count': ['reviews_count', 'reviewsCount', 'reviews'],
            'sales_count': ['sales_count', 'salesCount', 'sales'],
            'price_change_7d': ['price_change_7d', 'priceChange7d', 'price_change'],
            'review_velocity': ['review_velocity', 'reviewVelocity'],
            'rating_trend': ['rating_trend', 'ratingTrend'],
            'category_rank_percentile': ['category_rank_percentile', 'categoryRankPercentile']
        }

        def get_value(data: Dict, field: str, default: float = 0.0) -> float:
            """Get value from data with multiple possible field names"""
            possible_names = field_mapping.get(field, [field])
            for name in possible_names:
                if name in data and data[name] is not None:
                    try:
                        return float(data[name])
                    except (ValueError, TypeError):
                        continue
            return default

        # Extract features
        current_rank = get_value(product_data, 'current_rank', 100)
        price = get_value(product_data, 'price', 50.0)
        rating = get_value(product_data, 'rating', 3.5)
        reviews_count = get_value(product_data, 'reviews_count', 0)
        sales_count = get_value(product_data, 'sales_count', 0)
        price_change = get_value(product_data, 'price_change_7d', 0)
        review_velocity = get_value(product_data, 'review_velocity', 0)
        rating_trend = get_value(product_data, 'rating_trend', 0)
        category_percentile = get_value(product_data, 'category_rank_percentile', 0.5)

        # Additional derived features
        price_ratio = get_value(product_data, 'price_to_category_avg_ratio', 1.0)

        # Build feature dictionary
        features = {
            'current_rank': current_rank,
            'ranking': current_rank,
            'price': price,
            'rating': rating,
            'reviews_count': reviews_count,
            'sales_count': sales_count,
            'price_change_7d': price_change,
            'review_velocity': review_velocity,
            'rating_trend': rating_trend,
            'category_rank_percentile': category_percentile,
            'price_to_category_avg_ratio': price_ratio
        }

        # If we have stored feature names, use them
        if self.feature_names:
            feature_vector = []
            for fname in self.feature_names:
                if fname in features:
                    feature_vector.append(features[fname])
                else:
                    feature_vector.append(0.0)
            return np.array([feature_vector])
        else:
            return np.array([[
                features['current_rank'],
                features['price'],
                features['rating'],
                features['reviews_count'],
                features['sales_count'],
                features['price_change_7d'],
                features['review_velocity'],
                features['category_rank_percentile']
            ]])

    def _estimate_rank_change(self, trend: str, probability: float, current_rank: int) -> int:
        """
        Estimate the expected rank change based on trend and confidence.

        Args:
            trend: Predicted trend (IMPROVING/STABLE/DECLINING)
            probability: Prediction probability
            current_rank: Current product rank

        Returns:
            Estimated rank change (positive = improvement, negative = decline)
        """
        # Base change based on trend
        if trend == 'IMPROVING' or trend == 'AMÉLIORATION':
            base_change = int(current_rank * 0.1)  # 10% improvement
            return max(1, int(base_change * probability))
        elif trend == 'DECLINING' or trend == 'DÉCLIN':
            base_change = int(current_rank * 0.15)  # 15% decline
            return -max(1, int(base_change * probability))
        else:
            return 0

    def predict_single(self, product_data: Dict) -> Dict[str, Any]:
        """
        Predict ranking trend for a single product.

        Args:
            product_data: Dictionary with product attributes

        Returns:
            Prediction result dictionary
        """
        if not self.is_loaded():
            return {
                'error': 'Model not loaded',
                'predicted_trend': 'STABLE',
                'confidence_score': 0.0,
                'estimated_change': 0,
                'experimental': True
            }

        try:
            # Prepare features
            X = self._prepare_features(product_data)

            # Scale if scaler is available
            if self.scaler is not None:
                X = self.scaler.transform(X)

            # Predict
            prediction = int(self.model.predict(X)[0])
            probabilities = self.model.predict_proba(X)[0]
            confidence = float(probabilities.max())

            # Decode label
            if self.label_encoder is not None:
                trend = self.label_encoder.inverse_transform([prediction])[0]
            else:
                trend = self.TREND_LABELS[prediction] if 0 <= prediction < len(self.TREND_LABELS) else 'STABLE'

            # Get French label
            trend_fr = self.TREND_LABELS_FR.get(trend, trend)

            # Get current rank for change estimation
            current_rank = product_data.get('ranking') or product_data.get('current_rank', 100)

            # Estimate rank change
            estimated_change = self._estimate_rank_change(trend, confidence, int(current_rank))

            # Get confidence level
            confidence_level = get_confidence_level(confidence, 'ranking_trend')

            # Generate recommendation
            recommendation = generate_recommendation('ranking', trend, confidence)

            return {
                'predicted_trend': trend_fr,
                'trend_english': trend,
                'trend_description': get_trend_description(trend),
                'current_rank': int(current_rank),
                'estimated_change': estimated_change,
                'predicted_rank': max(1, int(current_rank) - estimated_change),
                'confidence_score': round(confidence, 4),
                'confidence_level': confidence_level,
                'recommendation': recommendation,
                'experimental': True,
                'experimental_note': 'Ce modèle utilise des étiquettes synthétiques. Interpréter avec prudence.'
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'error': str(e),
                'predicted_trend': 'STABLE',
                'confidence_score': 0.0,
                'estimated_change': 0,
                'experimental': True
            }

    def predict_batch(self, products: List[Dict]) -> List[Dict]:
        """
        Batch prediction for multiple products.

        Args:
            products: List of product dictionaries

        Returns:
            List of prediction results
        """
        if not self.is_loaded():
            return [{'error': 'Model not loaded', 'experimental': True} for _ in products]

        results = []
        for product in products:
            try:
                prediction = self.predict_single(product)
                prediction['product_id'] = product.get('asin') or product.get('product_id')
                prediction['product_name'] = product.get('productName') or product.get('product_name')
                results.append(prediction)
            except Exception as e:
                logger.warning(f"Error predicting product: {e}")
                results.append({
                    'product_id': product.get('asin'),
                    'error': str(e),
                    'experimental': True
                })

        return results

    def get_declining_products(self, products: List[Dict], confidence_threshold: float = 0.7) -> List[Dict]:
        """
        Get products predicted to decline with high confidence.
        Useful for alerts and seller notifications.

        Args:
            products: List of product dictionaries
            confidence_threshold: Minimum confidence to include

        Returns:
            List of declining products with predictions
        """
        predictions = self.predict_batch(products)

        declining = [
            p for p in predictions
            if p.get('trend_english') == 'DECLINING'
               and p.get('confidence_score', 0) >= confidence_threshold
        ]

        # Sort by confidence (highest first)
        declining.sort(key=lambda x: x.get('confidence_score', 0), reverse=True)

        return declining


# Singleton instance
_predictor = None

def get_predictor() -> RankingTrendPredictor:
    """Get or create singleton predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = RankingTrendPredictor()
    return _predictor


if __name__ == '__main__':
    # Test the predictor
    predictor = RankingTrendPredictor()

    if predictor.is_loaded():
        print("✅ Model loaded successfully")

        # Test prediction
        test_product = {
            'ranking': 50,
            'price': 29.99,
            'rating': 4.5,
            'reviews_count': 150,
            'sales_count': 50
        }

        result = predictor.predict_single(test_product)
        print(f"Prediction: {result}")
    else:
        print("❌ Model not loaded - train the model first")