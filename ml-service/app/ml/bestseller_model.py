import os
import logging
import joblib
import json
from datetime import datetime
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb

from config import settings, MODEL_CONFIG, CONFIDENCE_THRESHOLDS
from app.ml.data_loader import DataLoader
from app.ml.feature_engineering import FeatureEngineer
from app.core.exceptions import ModelNotLoadedException

logger = logging.getLogger(__name__)


class BestsellerModel:

    def __init__(self):
        self.model = None
        self.scaler = None
        self.feature_names = None
        self.metrics = None
        self._is_loaded = False

    def train(self) -> dict:
        logger.info("Training Bestseller Model")

        loader = DataLoader()
        df = loader.load_training_data(use_cache=False)

        if df.empty:
            raise ValueError("No training data available")

        X, y = FeatureEngineer.prepare_bestseller_features(df)

        if X.empty:
            raise ValueError("Feature preparation failed")

        logger.info(f"Dataset: {len(X)} samples, {len(X.columns)} features")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        logger.info(f"Train: {len(X_train)}, Test: {len(X_test)}")

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        model_params = MODEL_CONFIG['bestseller'].copy()

        if len(X_train) < 200:
            model_params.update({
                'max_depth': 3,
                'n_estimators': 50,
                'min_child_weight': 10
            })

        neg_count = (y_train == 0).sum()
        pos_count = (y_train == 1).sum()
        if pos_count > 0:
            model_params['scale_pos_weight'] = neg_count / pos_count

        logger.info("Training XGBoost model")
        self.model = xgb.XGBClassifier(**model_params)

        self.model.fit(
            X_train_scaled, y_train,
            eval_set=[(X_train_scaled, y_train), (X_test_scaled, y_test)],
            verbose=False
        )

        y_pred = self.model.predict(X_test_scaled)
        y_proba = self.model.predict_proba(X_test_scaled)[:, 1]

        self.metrics = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'auc_roc': float(roc_auc_score(y_test, y_proba)) if len(np.unique(y_test)) > 1 else 0.5
        }

        logger.info(f"Test Metrics - Accuracy: {self.metrics['accuracy']:.4f}, F1: {self.metrics['f1_score']:.4f}")

        self.feature_names = X.columns.tolist()
        self._is_loaded = True

        self._save_model()

        return {
            'status': 'success',
            'model_type': 'bestseller',
            'samples_trained': len(X_train),
            'samples_tested': len(X_test),
            'metrics': self.metrics,
            'trained_at': datetime.now()
        }

    def predict(self, product_data: dict) -> dict:
        if not self._is_loaded:
            self.load()

        if not self._is_loaded:
            raise ModelNotLoadedException("Bestseller model not loaded")

        loader = DataLoader()
        df = loader.prepare_single_product(product_data)
        df = FeatureEngineer.engineer_features(df)

        available_features = [f for f in self.feature_names if f in df.columns]
        X = df[available_features].fillna(0)

        X_scaled = self.scaler.transform(X)

        probability = float(self.model.predict_proba(X_scaled)[0][1])

        is_potential = probability >= 0.70

        if probability >= CONFIDENCE_THRESHOLDS['bestseller']['high']:
            confidence_level = "HIGH"
        elif probability >= CONFIDENCE_THRESHOLDS['bestseller']['medium']:
            confidence_level = "MEDIUM"
        else:
            confidence_level = "LOW"

        if probability >= 0.85:
            potential_level = "VERY_HIGH"
            recommendation = "Très fort potentiel bestseller - augmenter le stock"
        elif probability >= 0.75:
            potential_level = "HIGH"
            recommendation = "Fort potentiel bestseller - préparer la promotion"
        elif probability >= 0.60:
            potential_level = "MEDIUM"
            recommendation = "Potentiel modéré - surveiller les performances"
        elif probability >= 0.45:
            potential_level = "LOW"
            recommendation = "Faible potentiel - optimiser le prix et la visibilité"
        else:
            potential_level = "VERY_LOW"
            recommendation = "Très faible potentiel - revoir la stratégie produit"

        return {
            'bestseller_probability': round(probability, 4),
            'is_potential_bestseller': is_potential,
            'confidence_level': confidence_level,
            'potential_level': potential_level,
            'recommendation': recommendation
        }

    def _save_model(self):
        model_path = os.path.join(settings.MODEL_DIR, "bestseller_model.pkl")
        scaler_path = os.path.join(settings.MODEL_DIR, "bestseller_scaler.pkl")
        metadata_path = os.path.join(settings.MODEL_DIR, "bestseller_metadata.json")

        joblib.dump(self.model, model_path)
        joblib.dump(self.scaler, scaler_path)

        metadata = {
            'model_type': 'XGBoost',
            'feature_names': self.feature_names,
            'metrics': self.metrics,
            'trained_at': datetime.now().isoformat()
        }

        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)

        logger.info(f"Model saved to {model_path}")

    def load(self):
        model_path = os.path.join(settings.MODEL_DIR, "bestseller_model.pkl")
        scaler_path = os.path.join(settings.MODEL_DIR, "bestseller_scaler.pkl")
        metadata_path = os.path.join(settings.MODEL_DIR, "bestseller_metadata.json")

        if not os.path.exists(model_path):
            logger.warning("Bestseller model not found")
            return False

        self.model = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
            self.feature_names = metadata['feature_names']
            self.metrics = metadata['metrics']

        self._is_loaded = True
        logger.info("Bestseller model loaded successfully")
        return True

    def is_loaded(self) -> bool:
        return self._is_loaded