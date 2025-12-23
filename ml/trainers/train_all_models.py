import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, classification_report
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from xgboost import XGBClassifier, XGBRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
import pickle
import json
import os
import sys
from datetime import datetime
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
        print("MOUADVISION ML TRAINING PIPELINE - IMPROVED")
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

    def _train_bestseller_model(self, df: pd.DataFrame):
        features = [
            'price_scaled', 'sales_velocity_scaled', 'product_source_binary',
            'category_encoded', 'days_since_listed_scaled', 'rank_normalized_scaled',
            'combined_rating', 'reviews_normalized_scaled'
        ]

        X = df[features]
        y = df['is_bestseller']

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )

        model = XGBClassifier(
            n_estimators=50,
            max_depth=3,
            learning_rate=0.03,
            subsample=0.7,
            colsample_bytree=0.7,
            min_child_weight=5,
            gamma=0.1,
            random_state=42,
            eval_metric='logloss',
            reg_alpha=0.5,
            reg_lambda=2.0
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)
        y_pred_proba = model.predict_proba(X_test)[:, 1]

        self.models['bestseller_detection'] = {
            'model': model,
            'features': features,
            'type': 'classification'
        }

        self.metrics['bestseller_detection'] = {
            'accuracy': float(accuracy_score(y_test, y_pred)),
            'precision': float(precision_score(y_test, y_pred, zero_division=0)),
            'recall': float(recall_score(y_test, y_pred, zero_division=0)),
            'f1_score': float(f1_score(y_test, y_pred, zero_division=0)),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(features),
            'bestseller_ratio': float(y.mean()),
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ Accuracy: {self.metrics['bestseller_detection']['accuracy']:.2%}")
        print(f"  ✓ Precision: {self.metrics['bestseller_detection']['precision']:.2%}")
        print(f"  ✓ F1-Score: {self.metrics['bestseller_detection']['f1_score']:.2%}")
        print(f"  ℹ Bestseller ratio: {self.metrics['bestseller_detection']['bestseller_ratio']:.2%}")

    def _train_ranking_model(self, df: pd.DataFrame):
        df_train = df[df['total_units_sold'] > 0].copy()

        if len(df_train) < 30:
            print(f"  ⚠️  Warning: Only {len(df_train)} products with sales")
            print(f"  → Using all available data for training")

        features = [
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'sales_velocity_scaled', 'category_encoded',
            'price_vs_category_scaled', 'combined_rating', 'product_source_binary',
            'sales_momentum_scaled', 'reviews_normalized_scaled', 'product_maturity'
        ]

        X = df_train[features]
        y = df_train['total_units_sold']

        if len(X) < 20:
            test_size = 0.15
        else:
            test_size = 0.2

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=8,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        self.models['ranking_prediction'] = {
            'model': model,
            'features': features,
            'type': 'regression'
        }

        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)

        self.metrics['ranking_prediction'] = {
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'mae': float(mae),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(features),
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ R² Score: {self.metrics['ranking_prediction']['r2_score']:.3f}")
        print(f"  ✓ MAE: {self.metrics['ranking_prediction']['mae']:.2f} units")
        print(f"  ✓ RMSE: {self.metrics['ranking_prediction']['rmse']:.2f} units")
        print(f"  ℹ Training on: {len(X_train)} products with sales")

    def _train_price_optimization_model(self, df: pd.DataFrame):
        df_train = df[df['total_units_sold'] > 0].copy()

        df_train['price_performance_ratio'] = df_train['total_revenue'] / (df_train['price'] * df_train['days_since_listed'].replace(0, 1))

        median_performance = df_train.groupby('category_encoded')['price_performance_ratio'].transform('median')
        df_train['optimal_price_target'] = df_train['price'] * (1 + 0.2 * (df_train['price_performance_ratio'] / median_performance - 1))

        df_train['optimal_price_target'] = df_train['optimal_price_target'].clip(
            lower=df_train['price'] * 0.7,
            upper=df_train['price'] * 1.5
        )

        features = [
            'amazon_rank', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'sales_velocity_scaled', 'category_encoded',
            'product_source_binary', 'combined_rating', 'price_vs_category_scaled',
            'sales_momentum_scaled', 'revenue_per_order', 'order_count',
            'unique_customers', 'product_maturity'
        ]

        X = df_train[features]
        y = df_train['optimal_price_target']

        if len(X) < 20:
            test_size = 0.15
        else:
            test_size = 0.2

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            random_state=42
        )

        model.fit(X_train, y_train)

        y_pred = model.predict(X_test)

        self.models['price_optimization'] = {
            'model': model,
            'features': features,
            'type': 'regression'
        }

        mse = mean_squared_error(y_test, y_pred)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100

        self.metrics['price_optimization'] = {
            'r2_score': float(r2),
            'rmse': float(np.sqrt(mse)),
            'mae': float(mae),
            'mape': float(mape),
            'training_samples': len(X_train),
            'test_samples': len(X_test),
            'feature_count': len(features),
            'trained_at': datetime.now().isoformat()
        }

        print(f"  ✓ R² Score: {self.metrics['price_optimization']['r2_score']:.3f}")
        print(f"  ✓ MAE: ${self.metrics['price_optimization']['mae']:.2f}")
        print(f"  ✓ MAPE: {self.metrics['price_optimization']['mape']:.2f}%")
        print(f"  ℹ Training on: {len(X_train)} products with sales")

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
        print(f"\n1. BESTSELLER DETECTION (XGBoost Classifier)")
        print(f"   Accuracy:  {self.metrics['bestseller_detection']['accuracy']:.2%}")
        print(f"   Precision: {self.metrics['bestseller_detection']['precision']:.2%}")
        print(f"   Recall:    {self.metrics['bestseller_detection']['recall']:.2%}")
        print(f"   F1-Score:  {self.metrics['bestseller_detection']['f1_score']:.2%}")

        print(f"\n2. RANKING PREDICTION (Random Forest Regressor)")
        print(f"   R² Score:  {self.metrics['ranking_prediction']['r2_score']:.3f}")
        print(f"   MAE:       {self.metrics['ranking_prediction']['mae']:.2f} units")
        print(f"   RMSE:      {self.metrics['ranking_prediction']['rmse']:.2f} units")

        print(f"\n3. PRICE OPTIMIZATION (Gradient Boosting Regressor)")
        print(f"   R² Score:  {self.metrics['price_optimization']['r2_score']:.3f}")
        print(f"   MAE:       ${self.metrics['price_optimization']['mae']:.2f}")
        print(f"   MAPE:      {self.metrics['price_optimization']['mape']:.2f}%")

        print("\n" + "-" * 80)
        print(f"Models ready for production deployment! 🚀")

if __name__ == '__main__':
    trainer = ImprovedModelTrainer()
    metrics = trainer.train_all_models()