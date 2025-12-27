"""
Ranking Trend Detection Model Training
MouadVision ML Service - Mini Projet JEE 2025

Trains a Random Forest classifier to predict ranking trends.
Uses 3-class classification: IMPROVING, STABLE, DECLINING

Note: This is EXPERIMENTAL due to limited historical ranking data.
Synthetic trend labels are generated based on product metrics.
"""

import os
import sys
import logging
import json
from datetime import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
import joblib

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_CONFIG, MODEL_PATHS, TRAINING_CONFIG
from utils.enhanced_data_loader import DataLoader

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def train_model() -> dict:
    """
    Train the ranking trend prediction model.

    Returns:
        Dictionary with training results and metrics
    """
    logger.info("=" * 60)
    logger.info("🚀 Starting Ranking Trend Model Training")
    logger.info("⚠️  Note: This is EXPERIMENTAL - uses synthetic labels")
    logger.info("=" * 60)

    # Load and prepare data
    logger.info("📊 Loading training data...")
    loader = DataLoader()
    df = loader.load_training_data()

    if df.empty:
        logger.error("❌ No training data available!")
        return {'error': 'No training data available'}

    X, y = loader.prepare_ranking_data(df)

    if X.empty:
        logger.error("❌ Feature preparation failed!")
        return {'error': 'Feature preparation failed'}

    logger.info(f"📈 Dataset: {len(X)} samples, {len(X.columns)} features")

    # Get label distribution
    label_counts = y.value_counts()
    logger.info(f"📊 Label distribution:")
    for label, count in label_counts.items():
        logger.info(f"   {label}: {count} ({count/len(y)*100:.1f}%)")

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
    joblib.dump(scaler, MODEL_PATHS['ranking_scaler'])
    logger.info(f"💾 Scaler saved to {MODEL_PATHS['ranking_scaler']}")

    # Get model parameters
    model_params = MODEL_CONFIG['ranking_trend'].copy()

    # Adjust for small datasets
    if len(X_train) < 200:
        logger.info("🔧 Adjusting parameters for small dataset...")
        model_params['max_depth'] = 4
        model_params['n_estimators'] = 50
        model_params['min_samples_split'] = 15
        model_params['min_samples_leaf'] = 10

    # Train Random Forest model
    logger.info("🏋️ Training Random Forest classifier...")
    model = RandomForestClassifier(**model_params)
    model.fit(X_train_scaled, y_train)

    # Predictions
    y_pred = model.predict(X_test_scaled)
    y_proba = model.predict_proba(X_test_scaled)

    # Calculate metrics
    metrics = {
        'accuracy': float(accuracy_score(y_test, y_pred)),
        'precision': float(precision_score(y_test, y_pred, average='weighted', zero_division=0)),
        'recall': float(recall_score(y_test, y_pred, average='weighted', zero_division=0)),
        'f1_score': float(f1_score(y_test, y_pred, average='weighted', zero_division=0))
    }

    # Per-class metrics
    logger.info("📊 Per-class metrics:")
    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)

    # Load label encoder to get class names
    try:
        label_encoder = joblib.load(MODEL_PATHS['label_encoder'])
        class_names = label_encoder.classes_
    except:
        class_names = ['DECLINING', 'STABLE', 'IMPROVING']

    for i, class_name in enumerate(class_names):
        if str(i) in report:
            class_metrics = report[str(i)]
            logger.info(f"   {class_name}: P={class_metrics['precision']:.3f}, "
                        f"R={class_metrics['recall']:.3f}, F1={class_metrics['f1-score']:.3f}")

    logger.info("📊 Overall Test Set Metrics:")
    logger.info(f"   Accuracy:  {metrics['accuracy']:.4f}")
    logger.info(f"   Precision: {metrics['precision']:.4f}")
    logger.info(f"   Recall:    {metrics['recall']:.4f}")
    logger.info(f"   F1 Score:  {metrics['f1_score']:.4f}")

    # Cross-validation
    logger.info("🔄 Performing cross-validation...")
    cv = StratifiedKFold(n_splits=min(5, len(X_train) // 10 + 1), shuffle=True, random_state=42)

    try:
        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=cv, scoring='f1_weighted')
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

    # Add note about experimental nature
    metrics['experimental_note'] = (
        "This model uses synthetic trend labels based on product metrics. "
        "Actual ranking changes require historical data for accurate prediction. "
        "Results should be interpreted with caution."
    )

    # Save model
    model_path = MODEL_PATHS['ranking_trend']
    joblib.dump(model, model_path)
    logger.info(f"💾 Model saved to {model_path}")

    # Save metadata
    metadata = {
        'model_type': 'Random Forest Classifier (3-class)',
        'classes': ['DECLINING', 'STABLE', 'IMPROVING'],
        'trained_at': datetime.now().isoformat(),
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'feature_names': feature_names,
        'metrics': metrics,
        'parameters': model_params,
        'version': '2.0.0',
        'experimental': True
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

        all_metrics['ranking'] = {
            'r2_score': metrics['accuracy'],
            'rmse': 1 - metrics['f1_score'],
            'mae': 1 - metrics['accuracy'],
            'feature_importance': metrics['feature_importance']
        }

        if 'metadata' not in all_metrics:
            all_metrics['metadata'] = {}
        all_metrics['metadata']['trained_at'] = datetime.now().isoformat()
        all_metrics['metadata']['version'] = '2.0.0'

        with open(metrics_path, 'w') as f:
            json.dump(all_metrics, f, indent=2)
    except Exception as e:
        logger.warning(f"⚠️ Could not save combined metrics: {e}")

    logger.info("=" * 60)
    logger.info("✅ Ranking Trend Model Training Complete!")
    logger.info("⚠️  Remember: This model is EXPERIMENTAL")
    logger.info("=" * 60)

    return {
        'status': 'success',
        'metrics': metrics,
        'samples_trained': len(X_train),
        'samples_tested': len(X_test),
        'features_used': len(feature_names),
        'experimental': True
    }


if __name__ == '__main__':
    # Train the model
    result = train_model()
    print(json.dumps(result, indent=2))