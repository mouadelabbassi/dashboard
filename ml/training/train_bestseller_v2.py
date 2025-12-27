import os
import sys
import logging
import json
from datetime import datetime
from typing import Dict, Any
import numpy as np
import pandas as pd

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)
import xgboost as xgb
import joblib


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from config import MODEL_CONFIG, MODEL_PATHS, TRAINING_CONFIG
from utils.enhanced_data_loader import EnhancedDataLoader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def train_model(use_api: bool = True) -> Dict[str, Any]:
    """
    Train the bestseller detection model with proper validation.

    Args:
        use_api: If True, fetch data from Spring API. If False, use database.

    Returns:
        Dictionary with training results and metrics
    """
    logger.info("=" * 80)
    logger.info("🚀 BESTSELLER MODEL TRAINING - PRODUCTION MODE")
    logger.info("=" * 80)
    logger.info(f"Data Source: {'Spring Boot API' if use_api else 'Database'}")
    logger.info(f"Timestamp: {datetime.now().isoformat()}")
    logger.info("=" * 80)

    # =========================================================================
    # STEP 1: LOAD AND PREPARE DATA
    # =========================================================================

    logger.info("\n📊 STEP 1: LOADING DATA FROM SOURCE")
    logger.info("-" * 80)

    loader = EnhancedDataLoader(use_api=use_api, use_cache=False)
    df = loader.load_training_data(force_refresh=True)

    if df.empty:
        logger.error("❌ CRITICAL: No training data available!")
        return {
            'status': 'error',
            'error': 'No training data available',
            'data_source': 'Spring API' if use_api else 'Database'
        }

    # Prepare features and target
    X, y = loader.prepare_bestseller_data(df)

    if X.empty:
        logger.error("❌ CRITICAL: Feature preparation failed!")
        return {
            'status': 'error',
            'error': 'Feature preparation failed'
        }

    # =========================================================================
    # STEP 2: DATASET ANALYSIS
    # =========================================================================

    logger.info("\n📈 STEP 2: DATASET ANALYSIS")
    logger.info("-" * 80)

    dataset_info = {
        'total_samples': len(X),
        'n_features': len(X.columns),
        'feature_names': X.columns.tolist(),
        'class_distribution': {
            'bestsellers': int((y == 1).sum()),
            'non_bestsellers': int((y == 0).sum()),
            'bestseller_ratio': float((y == 1).sum() / len(y))
        }
    }

    logger.info(f"   Total Samples: {dataset_info['total_samples']}")
    logger.info(f"   Features: {dataset_info['n_features']}")
    logger.info(f"   Bestsellers: {dataset_info['class_distribution']['bestsellers']} ({dataset_info['class_distribution']['bestseller_ratio']*100:.1f}%)")
    logger.info(f"   Non-bestsellers: {dataset_info['class_distribution']['non_bestsellers']}")

    # Check minimum sample requirement
    if len(X) < TRAINING_CONFIG['min_samples_for_training']:
        logger.warning(f"⚠️ WARNING: Small dataset ({len(X)} < {TRAINING_CONFIG['min_samples_for_training']})")
        logger.warning("   Model may not generalize well!")

    # =========================================================================
    # STEP 3: TRAIN/TEST SPLIT
    # =========================================================================

    logger.info("\n🔀 STEP 3: SPLITTING DATA")
    logger.info("-" * 80)

    # Stratified split to maintain class balance
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=TRAINING_CONFIG['test_size'],
        random_state=TRAINING_CONFIG['random_state'],
        stratify=y
    )

    logger.info(f"   Training set: {len(X_train)} samples")
    logger.info(f"   Test set: {len(X_test)} samples")
    logger.info(f"   Train bestseller ratio: {(y_train == 1).sum() / len(y_train):.2%}")
    logger.info(f"   Test bestseller ratio: {(y_test == 1).sum() / len(y_test):.2%}")

    # =========================================================================
    # STEP 4: FEATURE SCALING
    # =========================================================================

    logger.info("\n📏 STEP 4: SCALING FEATURES")
    logger.info("-" * 80)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Save scaler
    joblib.dump(scaler, MODEL_PATHS['bestseller_scaler'])
    logger.info(f"   ✅ Scaler saved to {MODEL_PATHS['bestseller_scaler']}")

    # =========================================================================
    # STEP 5: MODEL CONFIGURATION
    # =========================================================================

    logger.info("\n⚙️ STEP 5: CONFIGURING MODEL")
    logger.info("-" * 80)

    model_params = MODEL_CONFIG['bestseller'].copy()

    # Adjust for small datasets
    if len(X_train) < 200:
        logger.info("   🔧 Adjusting for small dataset...")
        model_params.update({
            'max_depth': 3,
            'n_estimators': 50,
            'min_child_weight': 10,
            'reg_alpha': 2.0,
            'reg_lambda': 5.0
        })

    # Calculate class weight for imbalance
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()

    if pos_count > 0:
        scale_pos_weight = neg_count / pos_count
        model_params['scale_pos_weight'] = scale_pos_weight
        logger.info(f"   ⚖️ Class imbalance ratio: {scale_pos_weight:.2f}")

    logger.info(f"\n   Model Parameters:")
    for param, value in model_params.items():
        logger.info(f"      {param}: {value}")

    # =========================================================================
    # STEP 6: MODEL TRAINING
    # =========================================================================

    logger.info("\n🏋️ STEP 6: TRAINING MODEL")
    logger.info("-" * 80)

    model = xgb.XGBClassifier(**model_params)

    # Train with early stopping
    eval_set = [(X_train_scaled, y_train), (X_test_scaled, y_test)]
    eval_names = ['train', 'test']

    model.fit(
        X_train_scaled, y_train,
        eval_set=eval_set,
        verbose=False
    )

    logger.info("   ✅ Training complete")

    # =========================================================================
    # STEP 7: MODEL EVALUATION
    # =========================================================================

    logger.info("\n📊 STEP 7: EVALUATING MODEL")
    logger.info("-" * 80)

    # Predictions
    y_pred_train = model.predict(X_train_scaled)
    y_pred_test = model.predict(X_test_scaled)
    y_proba_test = model.predict_proba(X_test_scaled)[:, 1]

    # Calculate metrics
    metrics = {
        'train': {
            'accuracy': float(accuracy_score(y_train, y_pred_train)),
            'precision': float(precision_score(y_train, y_pred_train, zero_division=0)),
            'recall': float(recall_score(y_train, y_pred_train, zero_division=0)),
            'f1_score': float(f1_score(y_train, y_pred_train, zero_division=0))
        },
        'test': {
            'accuracy': float(accuracy_score(y_test, y_pred_test)),
            'precision': float(precision_score(y_test, y_pred_test, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred_test, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred_test, zero_division=0)),
            'auc_roc': float(roc_auc_score(y_test, y_proba_test)) if len(np.unique(y_test)) > 1 else 0.5
        }
    }

    # Log metrics
    logger.info("\n   📈 Training Set Metrics:")
    logger.info(f"      Accuracy:  {metrics['train']['accuracy']:.4f}")
    logger.info(f"      Precision: {metrics['train']['precision']:.4f}")
    logger.info(f"      Recall:    {metrics['train']['recall']:.4f}")
    logger.info(f"      F1 Score:  {metrics['train']['f1_score']:.4f}")

    logger.info("\n   📉 Test Set Metrics:")
    logger.info(f"      Accuracy:  {metrics['test']['accuracy']:.4f}")
    logger.info(f"      Precision: {metrics['test']['precision']:.4f}")
    logger.info(f"      Recall:    {metrics['test']['recall']:.4f}")
    logger.info(f"      F1 Score:  {metrics['test']['f1_score']:.4f}")
    logger.info(f"      AUC-ROC:   {metrics['test']['auc_roc']:.4f}")

    # Confusion matrix
    cm = confusion_matrix(y_test, y_pred_test)
    logger.info("\n   📊 Confusion Matrix:")
    logger.info(f"      TN: {cm[0, 0]:>4} | FP: {cm[0, 1]:>4}")
    logger.info(f"      FN: {cm[1, 0]:>4} | TP: {cm[1, 1]:>4}")

    # Check for overfitting
    train_test_gap = metrics['train']['f1_score'] - metrics['test']['f1_score']
    if train_test_gap > 0.1:
        logger.warning(f"   ⚠️ Possible overfitting! Train-test gap: {train_test_gap:.3f}")
    else:
        logger.info(f"   ✅ Good generalization. Train-test gap: {train_test_gap:.3f}")

    # =========================================================================
    # STEP 8: CROSS-VALIDATION
    # =========================================================================

    logger.info("\n🔄 STEP 8: CROSS-VALIDATION")
    logger.info("-" * 80)

    try:
        cv_folds = min(5, len(X_train) // 20)  # At least 20 samples per fold
        cv = StratifiedKFold(n_splits=cv_folds, shuffle=True, random_state=42)

        cv_scores = cross_val_score(
            model, X_train_scaled, y_train,
            cv=cv, scoring='f1', n_jobs=-1
        )

        metrics['cv'] = {
            'f1_mean': float(cv_scores.mean()),
            'f1_std': float(cv_scores.std()),
            'f1_scores': [float(s) for s in cv_scores],
            'n_folds': cv_folds
        }

        logger.info(f"   {cv_folds}-Fold CV F1: {metrics['cv']['f1_mean']:.4f} (+/- {metrics['cv']['f1_std']:.4f})")
        logger.info(f"   Fold scores: {[f'{s:.3f}' for s in cv_scores]}")

    except Exception as e:
        logger.warning(f"   ⚠️ Cross-validation failed: {e}")
        metrics['cv'] = {'error': str(e)}

    # =========================================================================
    # STEP 9: FEATURE IMPORTANCE
    # =========================================================================

    logger.info("\n🔍 STEP 9: FEATURE IMPORTANCE ANALYSIS")
    logger.info("-" * 80)

    feature_importance = dict(zip(X.columns, model.feature_importances_))
    feature_importance = dict(sorted(feature_importance.items(), key=lambda x: x[1], reverse=True))

    metrics['feature_importance'] = {k: float(v) for k, v in feature_importance.items()}

    logger.info("\n   Top 10 Most Important Features:")
    for i, (feat, imp) in enumerate(list(feature_importance.items())[:10], 1):
        logger.info(f"      {i:>2}. {feat:<35} {imp:.4f}")

    # =========================================================================
    # STEP 10: SAVE MODEL
    # =========================================================================

    logger.info("\n💾 STEP 10: SAVING MODEL")
    logger.info("-" * 80)

    # Save model
    model_path = MODEL_PATHS['bestseller']
    joblib.dump(model, model_path)
    logger.info(f"   ✅ Model saved to {model_path}")

    # Save metadata
    metadata = {
        'model_type': 'XGBoost Classifier',
        'version': '2.0.0',
        'trained_at': datetime.now().isoformat(),
        'data_source': 'Spring Boot API' if use_api else 'Direct Database',
        'dataset': dataset_info,
        'training_samples': len(X_train),
        'test_samples': len(X_test),
        'feature_names': X.columns.tolist(),
        'metrics': metrics,
        'parameters': model_params,
        'warnings': []
    }

    # Add warnings
    if len(X) < 100:
        metadata['warnings'].append('Very small dataset - model may not generalize well')
    if train_test_gap > 0.15:
        metadata['warnings'].append('Significant overfitting detected')
    if metrics['test']['f1_score'] < 0.6:
        metadata['warnings'].append('Low F1 score - consider feature engineering')

    metadata_path = model_path.replace('.pkl', '_metadata.json')
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    logger.info(f"   ✅ Metadata saved to {metadata_path}")

    # Save to combined metrics
    try:
        metrics_path = MODEL_PATHS['metrics']
        all_metrics = {}

        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                all_metrics = json.load(f)

        all_metrics['bestseller'] = metrics['test']
        all_metrics['bestseller']['cv_f1_mean'] = metrics['cv'].get('f1_mean', 0)
        all_metrics['metadata'] = {
            'trained_at': datetime.now().isoformat(),
            'version': '2.0.0',
            'real_data_count': len(X),
            'data_source': 'Spring Boot API' if use_api else 'Database'
        }

        with open(metrics_path, 'w') as f:
            json.dump(all_metrics, f, indent=2)

        logger.info(f"   ✅ Combined metrics saved to {metrics_path}")

    except Exception as e:
        logger.warning(f"   ⚠️ Could not save combined metrics: {e}")

    # =========================================================================
    # TRAINING COMPLETE
    # =========================================================================

    logger.info("\n" + "=" * 80)
    logger.info("✅ BESTSELLER MODEL TRAINING COMPLETE!")
    logger.info("=" * 80)
    logger.info(f"\n📊 Final Summary:")
    logger.info(f"   Dataset: {len(X)} products from {('Spring API' if use_api else 'Database')}")
    logger.info(f"   Test F1 Score: {metrics['test']['f1_score']:.4f}")
    logger.info(f"   Test AUC-ROC: {metrics['test']['auc_roc']:.4f}")
    logger.info(f"   CV F1 Score: {metrics['cv'].get('f1_mean', 0):.4f}")
    logger.info(f"   Warnings: {len(metadata['warnings'])}")

    if metadata['warnings']:
        logger.info("\n⚠️ Warnings:")
        for warning in metadata['warnings']:
            logger.info(f"   - {warning}")

    logger.info("\n" + "=" * 80)

    return {
        'status': 'success',
        'data_source': 'Spring Boot API' if use_api else 'Database',
        'metrics': metrics['test'],
        'cv_metrics': metrics['cv'],
        'samples_trained': len(X_train),
        'samples_tested': len(X_test),
        'features_used': len(X.columns),
        'warnings': metadata['warnings']
    }


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Train Bestseller Detection Model')
    parser.add_argument(
        '--source',
        choices=['api', 'db'],
        default='api',
        help='Data source: api (Spring Boot) or db (direct database)'
    )

    args = parser.parse_args()

    result = train_model(use_api=(args.source == 'api'))
    print("\n" + json.dumps(result, indent=2))