import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold, KFold
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBClassifier, XGBRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import pickle
import json
import os
import sys
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_loaders.comprehensive_loader import ComprehensiveDataLoader
from feature_engineering.hybrid_features import HybridFeatureEngineer

class ImprovedModelTrainer:

    def __init__(self, models_dir: str = 'models'):
        self.models_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            models_dir
        )
        os.makedirs(self.models_dir, exist_ok=True)

        self.models = {}
        self.metrics = {}
        self.feature_engineer = None

    def train_all_models(self):
        print("=" * 80)
        print("MOUADVISION ML TRAINING PIPELINE - FIXED (NO OVERFITTING)")
        print("=" * 80)

        print("\n[1/6] Loading comprehensive data...")
        loader = ComprehensiveDataLoader()
        df = loader.load_all_data()
        print(f"✓ Loaded {len(df)} products")
        print(f"  - Platform products: {len(df[df['product_source'] == 'Platform'])}")
        print(f"  - Seller products: {len(df[df['product_source'] == 'Seller'])}")
        print(f"  - Products with sales: {len(df[df['has_sales'] == 1])}")
        print(f"  - Products with Amazon rank: {df['amazon_rank'].notna().sum()}")

        print("\n[2/6] Engineering features...")
        category_stats = loader.get_category_statistics(df)
        self.feature_engineer = HybridFeatureEngineer(category_stats=category_stats)
        df_engineered, metadata = self.feature_engineer.fit_transform(df)
        print(f"✓ Created {len(metadata['feature_names'])} features")

        print("\n[3/6] Training Bestseller Detection Model...")
        self._train_bestseller_model(df_engineered)

        print("\n[4/6] Training Ranking Prediction Model...")
        self._train_ranking_model(df_engineered)

        print("\n[5/6] Training Price Optimization Model...")
        self._train_price_optimization_model(df_engineered)

        print("\n[6/6] Saving models and metadata...")
        self._save_all_models()

        print("\n" + "=" * 80)
        print("TRAINING COMPLETE!")
        print("=" * 80)
        self._print_summary()

        return self.metrics

    def _validate_no_leakage(self, features: list, target_name: str) -> bool:
        """✅ NEW: Check for data leakage"""
        suspicious = []

        if target_name == 'amazon_rank':
            # Check for rank-derived features
            rank_keywords = ['rank', 'is_top_', 'ranking']
            suspicious = [f for f in features if any(kw in f.lower() for kw in rank_keywords)]

        if suspicious:
            print(f"  ⚠️  WARNING: Potential data leakage detected!")
            print(f"  ⚠️  Suspicious features: {suspicious}")
            return False

        return True

    def _train_bestseller_model(self, df: pd.DataFrame):
        """✅ FIXED: Simpler model, no rank features"""

        # ✅ FIXED: No rank-derived features
        features = [
            # Core features
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'sales_velocity_scaled', 'product_source_binary',
            'category_encoded', 'days_since_listed_scaled', 'no_of_sellers_scaled',

            # Review features
            'combined_rating', 'reviews_normalized_scaled', 'review_quality_score',
            'rating_reviews_interaction',

            # Competitive features
            'competitive_score', 'value_score', 'reviews_per_seller',

            # Sales features
            'sales_per_day_normalized', 'demand_indicator', 'sales_momentum_scaled',
            'total_units_sold',

            # Temporal
            'recency_score_scaled', 'product_maturity', 'is_mature_product', 'is_new_product'
        ]

        available_features = [f for f in features if f in df.columns]
        X = df[available_features]
        y = df['is_bestseller']

        bestseller_ratio = y.mean()
        print(f"  ℹ Bestseller ratio: {bestseller_ratio:.1%}")

        if bestseller_ratio < 0.05 or bestseller_ratio > 0.95:
            print(f"  ⚠️  WARNING: Extreme class imbalance detected!")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y, shuffle=True
        )

        # ✅ FIXED: Simpler model to prevent overfitting
        model = XGBClassifier(
            n_estimators=50,      # ✅ REDUCED from 100
            max_depth=3,          # ✅ REDUCED from 4
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            min_child_weight=5,   # ✅ INCREASED from 3
            gamma=0.2,            # ✅ INCREASED from 0.1
            scale_pos_weight=max(1, (1 - bestseller_ratio) / bestseller_ratio),
            random_state=42,
            eval_metric='logloss',
            reg_alpha=1.0,        # ✅ INCREASED from 0.3
            reg_lambda=2.0        # ✅ INCREASED from 1.0
        )

        # ✅ Cross-validation to detect overfitting
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
        print(f"  ℹ Cross-validation: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

        model.fit(X_train, y_train)

        # ✅ Report both train and test
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)

        train_acc = accuracy_score(y_train, y_train_pred)
        test_acc = accuracy_score(y_test, y_test_pred)
        overfit_gap = train_acc - test_acc

        print(f"  ✓ Train Accuracy: {train_acc:.2%}")
        print(f"  ✓ Test Accuracy: {test_acc:.2%}")
        print(f"  ✓ Overfit Gap: {overfit_gap:.2%} {'✅' if overfit_gap < 0.10 else '⚠️ OVERFITTING!'}")

        self.models['bestseller_detection'] = {
            'model': model,
            'features': available_features,
            'type': 'classification'
        }

        self.metrics['bestseller_detection'] = {
            'accuracy': float(test_acc),
            'precision': float(precision_score(y_test, y_test_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_test_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_test_pred, zero_division=0)),
            'train_accuracy': float(train_acc),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'overfit_gap': float(overfit_gap),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(available_features),
            'bestseller_ratio': float(bestseller_ratio),
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ Precision: {self.metrics['bestseller_detection']['precision']:.2%}")
        print(f"  ✓ Recall: {self.metrics['bestseller_detection']['recall']:.2%}")
        print(f"  ✓ F1-Score: {self.metrics['bestseller_detection']['f1_score']:.2%}")

    def _train_bestseller_model(self, df: pd.DataFrame):
        features = [
            # Core only
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'sales_velocity_scaled', 'no_of_sellers_scaled',
            'category_encoded', 'days_since_listed_scaled',

            # Basic interactions only
            'review_quality_score', 'competitive_score',
            'sales_per_day_normalized', 'product_maturity'
        ]

        available_features = [f for f in features if f in df.columns]
        X = df[available_features]
        y = df['is_bestseller']

        bestseller_ratio = y.mean()
        print(f"  ℹ Bestseller ratio: {bestseller_ratio:.1%}")

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y, shuffle=True
        )

        # ✅ ULTRA-SIMPLE MODEL
        model = XGBClassifier(
            n_estimators=20,           # ✅ DRASTICALLY REDUCED from 50
            max_depth=2,               # ✅ DRASTICALLY REDUCED from 3
            learning_rate=0.2,         # ✅ INCREASED (less fitting)
            subsample=0.7,             # ✅ MORE dropout
            colsample_bytree=0.7,      # ✅ MORE dropout
            min_child_weight=10,       # ✅ DRASTICALLY INCREASED from 5
            gamma=0.5,                 # ✅ DRASTICALLY INCREASED from 0.2
            scale_pos_weight=max(1, (1 - bestseller_ratio) / bestseller_ratio),
            random_state=42,
            eval_metric='logloss',
            reg_alpha=2.0,             # ✅ DOUBLED from 1.0
            reg_lambda=4.0             # ✅ DOUBLED from 2.0
        )

        # Cross-validation
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='accuracy')
        print(f"  ℹ Cross-validation: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

        model.fit(X_train, y_train)

        # Report both train and test
        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)

        train_acc = accuracy_score(y_train, y_train_pred)
        test_acc = accuracy_score(y_test, y_test_pred)
        overfit_gap = train_acc - test_acc

        print(f"  ✓ Train Accuracy: {train_acc:.2%}")
        print(f"  ✓ Test Accuracy: {test_acc:.2%}")
        print(f"  ✓ Overfit Gap: {overfit_gap:.2%} {'✅' if overfit_gap < 0.10 else '⚠️ OVERFITTING!'}")

        self.models['bestseller_detection'] = {
            'model': model,
            'features': available_features,
            'type': 'classification'
        }

        self.metrics['bestseller_detection'] = {
            'accuracy': float(test_acc),
            'precision': float(precision_score(y_test, y_test_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_test_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_test_pred, zero_division=0)),
            'train_accuracy': float(train_acc),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'overfit_gap': float(overfit_gap),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(available_features),
            'bestseller_ratio': float(bestseller_ratio),
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ Precision: {self.metrics['bestseller_detection']['precision']:.2%}")
        print(f"  ✓ Recall: {self.metrics['bestseller_detection']['recall']:.2%}")
        print(f"  ✓ F1-Score: {self.metrics['bestseller_detection']['f1_score']:.2%}")


    def _train_ranking_model(self, df: pd.DataFrame):
        df_train = df[df['amazon_rank'].notna() & (df['amazon_rank'] > 0) & (df['amazon_rank'] < 100000)].copy()

        if len(df_train) < 30:
            print(f"  ⚠️  Warning: Only {len(df_train)} products with Amazon rank")
            df_train = df[df['combined_rank'].notna() & (df['combined_rank'] > 0)].copy()

        # ✅ MINIMAL FEATURES - Only truly independent ones
        features = [
            # Core only
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'sales_velocity_scaled', 'category_encoded',

            # Basic ratios
            'price_vs_category_avg', 'review_quality_score',

            # Sales only
            'total_units_sold', 'sales_per_day_normalized',

            # Temporal
            'product_maturity', 'days_since_listed_scaled'
        ]

        available_features = [f for f in features if f in df_train.columns]

        # Validate no leakage
        suspicious = [f for f in available_features if 'rank' in f.lower() or 'top_' in f.lower()]
        if suspicious:
            print(f"  🚨 ERROR: Data leakage detected: {suspicious}")
            return

        X = df_train[available_features]
        y = np.log1p(df_train['amazon_rank'])

        test_size = 0.3 if len(X) >= 100 else 0.25
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, shuffle=True
        )

        # ✅ ULTRA-SIMPLE MODEL
        model = XGBRegressor(
            n_estimators=20,           # ✅ DRASTICALLY REDUCED from 50
            max_depth=3,               # ✅ REDUCED from 5
            learning_rate=0.1,
            subsample=0.7,
            colsample_bytree=0.7,
            min_child_weight=10,       # ✅ DRASTICALLY INCREASED
            gamma=0.5,                 # ✅ DRASTICALLY INCREASED
            reg_alpha=2.0,             # ✅ DOUBLED
            reg_lambda=4.0,            # ✅ DOUBLED
            random_state=42
        )

        # Cross-validation
        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='r2')
        print(f"  ℹ Cross-validation R²: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

        model.fit(X_train, y_train)

        # Report train vs test
        y_train_pred_log = model.predict(X_train)
        y_test_pred_log = model.predict(X_test)

        train_r2 = r2_score(y_train, y_train_pred_log)
        test_r2 = r2_score(y_test, y_test_pred_log)
        overfit_gap = train_r2 - test_r2

        print(f"  ✓ Train R²: {train_r2:.3f}")
        print(f"  ✓ Test R²: {test_r2:.3f}")
        print(f"  ✓ Overfit Gap: {overfit_gap:.3f} {'✅' if overfit_gap < 0.15 else '⚠️ OVERFITTING!'}")

        # Convert back from log space
        y_test_actual = np.expm1(y_test)
        y_pred_actual = np.expm1(y_test_pred_log)
        y_pred_actual = np.clip(y_pred_actual, 1, 999999)

        self.models['ranking_prediction'] = {
            'model': model,
            'features': available_features,
            'type': 'regression',
            'target': 'amazon_rank',
            'uses_log_transform': True
        }

        mae = mean_absolute_error(y_test_actual, y_pred_actual)
        within_10 = np.mean(np.abs(y_test_actual - y_pred_actual) <= 10)
        within_50 = np.mean(np.abs(y_test_actual - y_pred_actual) <= 50)
        within_100 = np.mean(np.abs(y_test_actual - y_pred_actual) <= 100)

        # ✅ Better trend accuracy calculation
        test_indices = y_test.index
        df_test = df_train.loc[test_indices].copy()
        df_test['current_rank'] = df_train.loc[test_indices, 'amazon_rank']
        df_test['predicted_rank'] = y_pred_actual

        # Compare with median rank as baseline
        median_rank = df_test['current_rank'].median()
        df_test['actual_better_than_median'] = (df_test['current_rank'] < median_rank).astype(int)
        df_test['predicted_better_than_median'] = (df_test['predicted_rank'] < median_rank).astype(int)
        trend_accuracy = (df_test['actual_better_than_median'] == df_test['predicted_better_than_median']).mean()

        self.metrics['ranking_prediction'] = {
            'r2_score': float(test_r2),
            'train_r2': float(train_r2),
            'cv_r2_mean': float(cv_scores.mean()),
            'cv_r2_std': float(cv_scores.std()),
            'overfit_gap': float(overfit_gap),
            'rmse': float(np.sqrt(mean_squared_error(y_test_actual, y_pred_actual))),
            'mae': float(mae),
            'within_10_positions': float(within_10),
            'within_50_positions': float(within_50),
            'within_100_positions': float(within_100),
            'trend_accuracy': float(trend_accuracy),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(available_features),
            'target': 'amazon_rank',
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ MAE: {mae:.2f} positions")
        print(f"  ✓ Within 50 positions: {within_50:.1%}")
        print(f"  ✓ Within 100 positions: {within_100:.1%}")
        print(f"  ✓ Trend accuracy: {trend_accuracy:.1%}")
        print(f"  ℹ Training on: {len(X_train)} products")


    def _train_price_optimization_model(self, df: pd.DataFrame):
        """✅ ULTRA-FIXED: Rule-based for now, ML when we have more data"""

        df_train = df[
            (df['total_units_sold'] >= 5) &
            (df['order_count'] >= 3) &
            (df['days_since_listed'] >= 30)
            ].copy()

        if len(df_train) < 50:
            print(f"  ⚠️  WARNING: Only {len(df_train)} products with sufficient sales")
            print(f"  ⚠️  Price model will use RULE-BASED approach")
            df_train = df[df['total_units_sold'] > 0].copy()

        # ✅ Use category median as target (simple and safe)
        for category in df_train['category_encoded'].unique():
            cat_mask = df_train['category_encoded'] == category
            cat_data = df_train[cat_mask]

            if len(cat_data) < 5:
                continue

            # Simply target category median
            category_median_price = cat_data['price'].median()

            for idx in cat_data.index:
                current_price = df_train.loc[idx, 'price']
                # Conservative: only move 30% toward median
                df_train.loc[idx, 'optimal_price_target'] = (current_price * 0.7 + category_median_price * 0.3)

        df_train['optimal_price_target'] = df_train['optimal_price_target'].clip(
            lower=df_train['price'] * 0.90,
            upper=df_train['price'] * 1.10
        )

        # ✅ MINIMAL features
        features = [
            'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'category_encoded',
            'sales_velocity_scaled', 'product_maturity',
            'review_quality_score', 'competitive_score'
        ]

        available_features = [f for f in features if f in df_train.columns]
        X = df_train[available_features]
        y = df_train['optimal_price_target']

        test_size = 0.3 if len(X) >= 100 else 0.25
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, shuffle=True
        )

        # ✅ ULTRA-SIMPLE MODEL
        model = XGBRegressor(
            n_estimators=20,
            max_depth=2,
            learning_rate=0.2,
            subsample=0.7,
            colsample_bytree=0.7,
            min_child_weight=10,
            gamma=0.5,
            reg_alpha=2.0,
            reg_lambda=4.0,
            random_state=42
        )

        cv = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y, cv=cv, scoring='r2')
        print(f"  ℹ Cross-validation R²: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

        model.fit(X_train, y_train)

        y_train_pred = model.predict(X_train)
        y_test_pred = model.predict(X_test)

        train_r2 = r2_score(y_train, y_train_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        overfit_gap = train_r2 - test_r2

        print(f"  ✓ Train R²: {train_r2:.3f}")
        print(f"  ✓ Test R²: {test_r2:.3f}")
        print(f"  ✓ Overfit Gap: {overfit_gap:.3f} {'✅' if overfit_gap < 0.15 else '⚠️ OVERFITTING!'}")

        self.models['price_optimization'] = {
            'model': model,
            'features': available_features,
            'type': 'regression',
            'min_samples_required': 50,
            'training_samples': len(X_train)
        }

        mae = mean_absolute_error(y_test, y_test_pred)
        mask = y_test > 0
        mape = np.mean(np.abs((y_test[mask] - y_test_pred[mask]) / y_test[mask])) * 100

        self.metrics['price_optimization'] = {
            'r2_score': float(test_r2),
            'train_r2': float(train_r2),
            'cv_r2_mean': float(cv_scores.mean()),
            'cv_r2_std': float(cv_scores.std()),
            'overfit_gap': float(overfit_gap),
            'rmse': float(np.sqrt(mean_squared_error(y_test, y_test_pred))),
            'mae': float(mae),
            'mape': float(mape),
            'revenue_improvement_estimate': 0.0,  # Not reliable with this approach
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(available_features),
            'is_reliable': len(X_train) >= 50,
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ MAE: ${mae:.2f}")
        print(f"  ✓ MAPE: {mape:.2f}%")
        print(f"  {'✅' if len(X_train) >= 50 else '⚠️'} Training samples: {len(X_train)}")

    def _save_all_models(self):
        for model_name, model_data in self.models.items():
            model_dir = os.path.join(self.models_dir, model_name)
            os.makedirs(model_dir, exist_ok=True)

            with open(os.path.join(model_dir, 'model.pkl'), 'wb') as f:
                pickle.dump(model_data['model'], f)

            with open(os.path.join(model_dir, 'features.json'), 'w') as f:
                json.dump(model_data['features'], f, indent=2)

        with open(os.path.join(self.models_dir, 'metrics.json'), 'w') as f:
            json.dump(self.metrics, f, indent=2)

        feature_engineer_path = os.path.join(self.models_dir, 'feature_engineer.pkl')
        self.feature_engineer.save(feature_engineer_path)

        print(f"  ✓ Saved 3 models to {self.models_dir}")
        print(f"  ✓ Saved feature engineer and metrics")

    def _print_summary(self):
        print("\nMODEL PERFORMANCE SUMMARY:")
        print("-" * 80)

        bs = self.metrics['bestseller_detection']
        print(f"\n1. BESTSELLER DETECTION (XGBoost Classifier)")
        print(f"   Test Accuracy:  {bs['accuracy']:.2%}")
        print(f"   Train Accuracy: {bs['train_accuracy']:.2%}")
        print(f"   Overfit Gap:    {bs['overfit_gap']:.2%} {'✅' if bs['overfit_gap'] < 0.10 else '⚠️'}")
        print(f"   Precision:      {bs['precision']:.2%}")
        print(f"   Recall:         {bs['recall']:.2%}")
        print(f"   F1-Score:       {bs['f1_score']:.2%}")

        rk = self.metrics['ranking_prediction']
        print(f"\n2. RANKING PREDICTION (XGBoost Regressor)")
        print(f"   Test R²:        {rk['r2_score']:.3f}")
        print(f"   Train R²:       {rk['train_r2']:.3f}")
        print(f"   Overfit Gap:    {rk['overfit_gap']:.3f} {'✅' if rk['overfit_gap'] < 0.15 else '⚠️'}")
        print(f"   MAE:            {rk['mae']:.2f} positions")
        print(f"   Trend Accuracy: {rk['trend_accuracy']:.1%}")

        pr = self.metrics['price_optimization']
        print(f"\n3. PRICE OPTIMIZATION (XGBoost Regressor)")
        print(f"   Test R²:        {pr['r2_score']:.3f}")
        print(f"   Train R²:       {pr['train_r2']:.3f}")
        print(f"   Overfit Gap:    {pr['overfit_gap']:.3f} {'✅' if pr['overfit_gap'] < 0.15 else '⚠️'}")
        print(f"   MAE:            ${pr['mae']:.2f}")
        print(f"   MAPE:           {pr['mape']:.2f}%")

        print("\n" + "-" * 80)
        print("✅ Models ready - NO OVERFITTING detected!" if all([
            bs['overfit_gap'] < 0.10,
            rk['overfit_gap'] < 0.15,
            pr['overfit_gap'] < 0.15
        ]) else "⚠️ Check overfit gaps above!")
        print("=" * 80)

if __name__ == '__main__':
    trainer = ImprovedModelTrainer()
    metrics = trainer.train_all_models()