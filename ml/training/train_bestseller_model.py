"""
Bestseller Detection Model Training
MouadVision ML Service - Mini Projet JEE 2025

Trains an XGBoost classifier to predict bestseller potential.
Uses aggressive regularization to prevent overfitting on ~550 product dataset.
"""

import os
import sys
import logging
import json
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_CONFIG, MODEL_PATHS, TRAINING_CONFIG
from utils.data_loader import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_model() -> dict:
    """
    Train the bestseller detection model.

    Returns:
        Dictionary with training results and metrics
    """
    logger.info("=" * 60)
    logger.info("🚀 Starting Bestseller Model Training")
    logger.info("=" * 60)

    # Load and prepare data
    logger.info("📊 Loading training data...")
    loader = DataLoader()
    df = loader.load_training_data()

    if df.empty:
        logger.error("❌ No training data available!")
        return {'error': 'No training data available'}

    X, y = loader.prepare_bestseller_data(df)

    if X.empty:
        logger.error("❌ Feature preparation failed!")
        return {'error': 'Feature preparation failed'}

    logger.info(f"📈 Dataset: {len(X)} samples, {len(X.columns)} features")
    logger.info(f"📊 Target distribution: {y.value_counts().to_dict()}")

    # Check minimum sample requirement
    if len(X) < TRAINING_CONFIG['min_samples_for_training']:
        logger.warning(f"⚠️ Small dataset ({len(X)} < {TRAINING_CONFIG['min_samples_for_training']})")

    # Store feature names
    feature_names = X.columns.tolist()

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TRAINING_CONFIG['test_size'],
        random_state=TRAINING_CONFIG['random_state'],
        stratify=y
    )

    logger.info(f"📊 Train: {len(X_train)}, Test: {len(X_test)}")

    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler
    joblib.dump(scaler, MODEL_PATHS['bestseller_scaler'])
    logger.info(f"💾 Scaler saved to {MODEL_PATHS['bestseller_scaler']}")

    # Get model parameters with aggressive regularization
    model_params = MODEL_CONFIG['bestseller'].copy()

    # Adjust for small datasets
    if len(X_train) < 200:
        logger.info("🔧 Adjusting parameters for small dataset...")
        model_params['max_depth'] = 3  # Even shallower
        model_params['n_estimators'] = 50  # Fewer trees
        model_params['min_child_weight'] = 10  # Larger
        model_params['reg_alpha'] = 2.0  # Stronger L1
        model_params['reg_lambda'] = 5.0  # Stronger L2

    # Calculate scale_pos_weight for class imbalance
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    if pos_count > 0:
        model_params['scale_pos_weight'] = neg_count / pos_count
        logger.info(f"⚖️ Class balance: scale_pos_weight={model_params['scale_pos_weight']:.2f}")

    # Train XGBoost model
    logger.info("🏋️ Training XGBoost classifier...")
    model = xgb.XGBClassifier(**model_params)

    # Use early stopping
    eval_set = [(X_train_scaled, y_train), (X_test_scaled, y_test)]
    model.fit(
        X_train_scaled, y_train,
        eval_set=eval_set,
        verbose=False
    )

    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)[:, 1]

    # Calculate metrics
    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
        'auc_roc': float(roc_auc_score(y_test, y_proba)) if len(np.unique(y_test)) > 1 else 0.5
    }

    logger.info("📊 Test Set Metrics:")
    logger.info(f"   Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"   Precision: {metrics['precision']:.4f}")
    logger.info(f"   Recall:    {metrics['recall']:.4f}")
    logger.info(f"   F1 Score:  {metrics['f1_score']:.4f}")
    logger.info(f"   AUC-ROC:   {metrics['auc_roc']:.4f}")

    # Cross-validation for more robust estimate
    logger.info("🔄 Performing cross-validation...")
    cv = StratifiedKFold(n_splits=min(5, len(X_train) // 10), shuffle=True, random_state=42)

    try:
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='f1')
        metrics['cv_f1_mean'] = float(cv_scores.mean())
        metrics['cv_f1_std'] = float(cv_scores.std())
        logger.info(f"   CV F1:     {metrics['cv_f1_mean']:.4f} (+/- {metrics['cv_f1_std']:.4f})")
    except Exception as e:
        logger.warning(f"⚠️ Cross-validation failed: {e}")
        metrics['cv_f1_mean'] = metrics['f1_score']
        metrics['cv_f1_std'] = 0.0

    # Feature importance
    importance = dict(zip(feature_names, model.feature_importances_))
    importance = dict(sorted(importance.items(), key=lambda x: x[1], reverse=True))
    metrics['feature_importance'] = {k: float(v) for k, v in importance.items()}

    logger.info("📊 Top 5 Features:")
    for i, (feat, imp) in enumerate(list(importance.items())[:5]):
        logger.info(f"   {i+1}. {feat}: {imp:.4f}")

    # Save model
    model_path = MODEL_PATHS['bestseller']
    joblib.dump(model, model_path)
    logger.info(f"💾 Model saved to {model_path}")

    # Save metadata
    metadata = {
        'model_type': 'XGBoost Classifier',
        'trained_at': datetime.now().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'feature_names': feature_names,
        'metrics': metrics,
        'parameters': model_params,
        'version': '2.0.0'
    }

    metadata_path = model_path.replace('.pkl', '_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"💾 Metadata saved to {metadata_path}")

    # Save to combined metrics file
    try:
        metrics_path = MODEL_PATHS['metrics']
        all_metrics = {}
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                all_metrics = json.load(f)

        all_metrics['bestseller'] = metrics
        all_metrics['metadata'] = {
            'trained_at': datetime.now().isoformat(),
            'version': '2.0.0',
            'real_data_count': len(X)
        }

        with open(metrics_path, 'w') as f:
            json.dump(all_metrics, f, indent=2)
    except Exception as e:
        logger.warning(f"⚠️ Could not save combined metrics: {e}")

    logger.info("=" * 60)
    logger.info("✅ Bestseller Model Training Complete!")
    logger.info("=" * 60)

    return {
        'status': 'success',
        'metrics': metrics,
        'samples_trained': len(X_train),
        'samples_tested': len(X_test),
        'features_used': len(feature_names)
    }


def evaluate_on_holdout(model_path: str = None):
    """
    Evaluate the trained model on a holdout set.
    Useful for final validation before deployment.
    """
    if model_path is None:
        model_path = MODEL_PATHS['bestseller']

    if not os.path.exists(model_path):
        logger.error(f"Model not found: {model_path}")
        return None

    # Load model and scaler
    model = joblib.load(model_path)
    scaler = joblib.load(MODEL_PATHS['bestseller_scaler'])

    # Load fresh data
    loader = DataLoader()
    df = loader.load_training_data()
    X, y = loader.prepare_bestseller_data(df)

    # Scale
    X_scaled = scaler.transform(X)

    # Predict
    y_pred = model.predict(X_scaled)
    y_proba = model.predict_proba(X_scaled)[:, 1]

    # Metrics
    results = {
        'total_samples': len(X),
        'accuracy': accuracy_score(y, y_pred),
        'precision': precision_score(y, y_pred, zero_division=0),
        'recall': recall_score(y, y_pred, zero_division=0),
        'f1': f1_score(y, y_pred, zero_division=0),
        'auc_roc': roc_auc_score(y, y_proba) if len(np.unique(y)) > 1 else 0.5
    }

    logger.info(f"Holdout evaluation: {results}")
    return results


if __name__ == '__main__':
    result = train_model()
    print(json.dumps(result, indent=2))