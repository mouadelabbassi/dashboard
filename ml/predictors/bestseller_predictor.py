"""
Bestseller Prediction Service
MouadVision ML Service - Mini Projet JEE 2025

Handles bestseller probability predictions using trained XGBoost model.
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

from config import MODEL_PATHS, CONFIDENCE_THRESHOLDS, PREDICTION_THRESHOLDS
from utils.model_utils import (
    get_confidence_level,
    get_bestseller_potential_level,
    generate_recommendation
)

logger = logging.getLogger(__name__)


class BestsellerPredictor:
    """
    Bestseller detection predictor using trained XGBoost model.
    """

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metrics = None
        self._loaded = False

        # Try to load model on initialization
        self._load_model()

    def _load_model(self):
        """Load the trained model and scaler"""
        model_path = MODEL_PATHS['bestseller']
        scaler_path = MODEL_PATHS['bestseller_scaler']
        metadata_path = model_path.replace('.pkl', '_metadata.json')

        try:
            if not os.path.exists(model_path):
                logger.warning(f"Model not found: {model_path}")
                return

            self.model = joblib.load(model_path)
            logger.info(f"✅ Loaded bestseller model from {model_path}")

            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                logger.info(f"✅ Loaded scaler from {scaler_path}")

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
            return self.metrics
        return {
            'accuracy': 0.0,
            'precision': 0.0,
            'recall': 0.0,
            'f1_score': 0.0,
            'auc_roc': 0.0
        }

    def _prepare_features(self, product_data: Dict) -> np.ndarray:
        """
        Prepare features for prediction from raw product data.

        Args:
            product_data: Dictionary with product attributes

        Returns:
            Feature array ready for prediction
        """
        # Map various possible field names to our feature names
        field_mapping = {
            'price': ['price', 'Price', 'unit_price'],
            'rating': ['rating', 'Rating', 'average_rating', 'avgRating'],
            'reviews_count': ['reviews_count', 'reviewsCount', 'reviews', 'total_reviews'],
            'sales_count': ['sales_count', 'salesCount', 'sales', 'total_sales'],
            'discount_percentage': ['discount_percentage', 'discountPercentage', 'discount'],
            'days_since_listed': ['days_since_listed', 'daysSinceListed', 'age_days'],
            'stock_quantity': ['stock_quantity', 'stockQuantity', 'stock'],
            'category_avg_price': ['category_avg_price', 'categoryAvgPrice'],
            'category_avg_reviews': ['category_avg_reviews', 'categoryAvgReviews']
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
        price = get_value(product_data, 'price', 50.0)
        rating = get_value(product_data, 'rating', 3.5)
        reviews_count = get_value(product_data, 'reviews_count', 0)
        sales_count = get_value(product_data, 'sales_count', 0)
        discount_pct = get_value(product_data, 'discount_percentage', 0)
        days_listed = get_value(product_data, 'days_since_listed', 30)
        stock = get_value(product_data, 'stock_quantity', 100)

        # Category statistics (with defaults)
        cat_avg_price = get_value(product_data, 'category_avg_price', price)
        cat_avg_reviews = get_value(product_data, 'category_avg_reviews', reviews_count)

        # Calculate derived features
        price_ratio = price / cat_avg_price if cat_avg_price > 0 else 1.0
        reviews_ratio = reviews_count / cat_avg_reviews if cat_avg_reviews > 0 else 1.0
        rating_normalized = rating / 5.0

        # Build feature vector in the expected order
        features = {
            'price': price,
            'rating': rating,
            'reviews_count': reviews_count,
            'sales_count': sales_count,
            'discount_percentage': discount_pct,
            'days_since_listed': days_listed,
            'stock_quantity': stock,
            'price_to_category_avg_ratio': price_ratio,
            'reviews_to_category_avg_ratio': reviews_ratio,
            'rating_normalized': rating_normalized
        }

        # If we have stored feature names, use them
        if self.feature_names:
            feature_vector = []
            for fname in self.feature_names:
                if fname in features:
                    feature_vector.append(features[fname])
                else:
                    # Default to 0 for unknown features
                    feature_vector.append(0.0)
            return np.array([feature_vector])
        else:
            # Return all features in a consistent order
            return np.array([[
                features['price'],
                features['rating'],
                features['reviews_count'],
                features['sales_count'],
                features['discount_percentage'],
                features['days_since_listed'],
                features['stock_quantity'],
                features['price_to_category_avg_ratio'],
                features['reviews_to_category_avg_ratio'],
                features['rating_normalized']
            ]])

    def predict_single(self, product_data: Dict) -> Dict[str, Any]:
        """
        Predict bestseller probability for a single product.

        Args:
            product_data: Dictionary with product attributes

        Returns:
            Prediction result dictionary
        """
        if not self.is_loaded():
            return {
                'error': 'Model not loaded',
                'bestseller_probability': 0.0,
                'is_potential_bestseller': False,
                'confidence': 0.0
            }

        try:
            # Prepare features
            X = self._prepare_features(product_data)

            # Scale if scaler is available
            if self.scaler is not None:
                X = self.scaler.transform(X)

            # Predict
            probability = float(self.model.predict_proba(X)[0][1])

            # Determine potential level and confidence
            is_potential = probability >= PREDICTION_THRESHOLDS['bestseller_probability']
            confidence_level = get_confidence_level(probability, 'bestseller')
            potential_level = get_bestseller_potential_level(probability)

            # Generate recommendation
            recommendation = generate_recommendation('bestseller', probability, probability)

            return {
                'bestseller_probability': round(probability, 4),
                'is_potential_bestseller': is_potential,
                'potential_level': potential_level,
                'confidence': round(probability, 4),
                'confidence_level': confidence_level,
                'recommendation': recommendation
            }

        except Exception as e:
            logger.error(f"Prediction error: {e}")
            return {
                'error': str(e),
                'bestseller_probability': 0.0,
                'is_potential_bestseller': False,
                'confidence': 0.0
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
            return [{'error': 'Model not loaded'} for _ in products]

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
                    'error': str(e)
                })

        return results


# Singleton instance
_predictor = None

def get_predictor() -> BestsellerPredictor:
    """Get or create singleton predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = BestsellerPredictor()
    return _predictor


if __name__ == '__main__':
    # Test the predictor
    predictor = BestsellerPredictor()

    if predictor.is_loaded():
        print("✅ Model loaded successfully")

        # Test prediction
        test_product = {
            'price': 29.99,
            'rating': 4.5,
            'reviews_count': 150,
            'sales_count': 50,
            'discount_percentage': 10,
            'stock_quantity': 100
        }

        result = predictor.predict_single(test_product)
        print(f"Prediction: {result}")
    else:
        print("❌ Model not loaded - train the model first")