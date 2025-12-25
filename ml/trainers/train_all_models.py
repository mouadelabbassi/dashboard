import pandas as pd
import numpy as np
import requests
import joblib
import json
import warnings
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional

# ML Libraries
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler, LabelEncoder, RobustScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error, r2_score
)
from xgboost import XGBClassifier, XGBRegressor
from imblearn.over_sampling import SMOTE

warnings.filterwarnings('ignore')


class Config:
    SPRING_BOOT_URL = "http://localhost:8080"

    # Model paths
    MODELS_DIR = Path(__file__).parent.parent / "models"

    BESTSELLER_MODEL = "bestseller_model_v2.pkl"
    RANKING_MODEL = "ranking_model_v2.pkl"
    PRICE_MODEL = "price_model_v2.pkl"
    SCALER_FILE = "scaler_v2.pkl"
    LABEL_ENCODERS = "label_encoders_v2.pkl"
    METRICS_FILE = "training_metrics_v2.json"

    # Thresholds
    BESTSELLER_RANK_THRESHOLD = 100
    MIN_REVIEWS_FOR_BESTSELLER = 50
    MIN_SAMPLES = 50

    @classmethod
    def get_model_path(cls, filename: str) -> Path:
        cls.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        return cls.MODELS_DIR / filename


class ImprovedFeatureEngineer:

    def __init__(self):
        self.category_stats = {}
        self.global_stats = {}

    def fit_transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Fit on training data and transform."""
        df = df.copy()

        # Calculate global statistics
        self.global_stats = {
            'mean_price': df['price'].mean(),
            'mean_rating': df['rating'].mean(),
            'mean_reviews': df['reviewsCount'].mean(),
            'mean_ranking': df['ranking'].mean(),
        }

        # Calculate category-level statistics
        for cat in df['category'].unique():
            cat_data = df[df['category'] == cat]
            self.category_stats[cat] = {
                'mean_price': cat_data['price'].mean(),
                'std_price': cat_data['price'].std() or 1,
                'mean_rating': cat_data['rating'].mean(),
                'mean_reviews': cat_data['reviewsCount'].mean(),
                'mean_ranking': cat_data['ranking'].mean(),
                'count': len(cat_data)
            }

        return self._engineer_features(df)

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transform using fitted statistics."""
        return self._engineer_features(df)

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create all engineered features."""
        df = df.copy()

        # Handle missing values
        df['rating'] = df['rating'].fillna(3.0)
        df['reviewsCount'] = df['reviewsCount'].fillna(0)
        df['price'] = df['price'].fillna(df['price'].median())
        df['noOfSellers'] = df['noOfSellers'].fillna(1)
        df['ranking'] = df['ranking'].fillna(df['ranking'].median())

        # === PRICE FEATURES ===
        df['log_price'] = np.log1p(df['price'])
        df['price_normalized'] = df['price'] / self.global_stats['mean_price']

        # Category-relative price
        df['price_vs_category'] = df.apply(
            lambda x: x['price'] / self.category_stats.get(x['category'], {}).get('mean_price', x['price']),
            axis=1
        )

        # Price tier (1-5)
        df['price_tier'] = pd.qcut(df['price'], q=5, labels=[1, 2, 3, 4, 5], duplicates='drop').astype(float)
        df['price_tier'] = df['price_tier'].fillna(3)

        # === RATING FEATURES ===
        df['rating_normalized'] = df['rating'] / 5.0
        df['rating_vs_category'] = df.apply(
            lambda x: x['rating'] / self.category_stats.get(x['category'], {}).get('mean_rating', 3.0),
            axis=1
        )
        df['is_highly_rated'] = (df['rating'] >= 4.0).astype(int)

        # === REVIEW FEATURES ===
        df['log_reviews'] = np.log1p(df['reviewsCount'])
        df['has_reviews'] = (df['reviewsCount'] > 0).astype(int)
        df['reviews_vs_category'] = df.apply(
            lambda x: x['reviewsCount'] / max(1, self.category_stats.get(x['category'], {}).get('mean_reviews', 1)),
            axis=1
        )

        # === SELLER FEATURES ===
        df['reviews_per_seller'] = df['reviewsCount'] / df['noOfSellers'].clip(lower=1)
        df['is_multi_seller'] = (df['noOfSellers'] > 1).astype(int)

        # === COMPOSITE FEATURES ===
        # Quality-popularity score
        df['quality_popularity_score'] = df['rating'] * np.log1p(df['reviewsCount'])

        # Value score (rating per dollar)
        df['value_score'] = df['rating'] / df['price'].clip(lower=1) * 100

        # Competitive advantage (low price + high rating)
        df['competitive_advantage'] = (5 - df['price_normalized'].clip(upper=5)) + df['rating_normalized']

        # Market position score
        df['market_position'] = (
                df['rating_normalized'] * 0.3 +
                df['log_reviews'] / 10 * 0.3 +
                (1 - df['price_normalized'].clip(upper=2) / 2) * 0.2 +
                df['reviews_per_seller'] / 100 * 0.2
        )

        # === RANKING FEATURES (for price model) ===
        df['log_ranking'] = np.log1p(df['ranking'])
        df['ranking_normalized'] = df['ranking'] / df['ranking'].max()
        df['is_top_100'] = (df['ranking'] <= 100).astype(int)
        df['is_top_500'] = (df['ranking'] <= 500).astype(int)

        # Ranking vs category
        df['ranking_vs_category'] = df.apply(
            lambda x: x['ranking'] / max(1, self.category_stats.get(x['category'], {}).get('mean_ranking', x['ranking'])),
            axis=1
        )

        return df

    def get_feature_names(self) -> list:
        """Return list of engineered feature names."""
        return [
            # Price features
            'log_price', 'price_normalized', 'price_vs_category', 'price_tier',
            # Rating features
            'rating_normalized', 'rating_vs_category', 'is_highly_rated',
            # Review features
            'log_reviews', 'has_reviews', 'reviews_per_seller',
            # Seller features
            'is_multi_seller',
            # Composite features
            'quality_popularity_score', 'value_score', 'competitive_advantage', 'market_position',
            # Ranking features
            'log_ranking', 'ranking_normalized', 'is_top_100', 'is_top_500', 'ranking_vs_category',
            # Base features
            'category_encoded'
        ]


class ImprovedMLTrainer:
    """Improved ML trainer with better algorithms and validation."""

    def __init__(self):
        self.feature_engineer = ImprovedFeatureEngineer()
        self.scaler = RobustScaler()  # More robust to outliers
        self.label_encoders = {}
        self.models = {}
        self.metrics = {}

    def load_data_from_api(self) -> Optional[pd.DataFrame]:
        print("\n📡 Loading data from Spring Boot API...")

        try:
            response = requests.get(
                f"{Config.SPRING_BOOT_URL}/api/products",
                params={"page": 0, "size": 10000},
                timeout=30
            )

            if response.status_code != 200:
                print(f"❌ API returned status {response.status_code}")
                return None

            data = response.json()

            if not data.get("success"):
                print("❌ API returned error")
                return None

            content = data.get("data", {}).get("content", [])

            if not content:
                print("❌ No products found")
                return None

            df = pd.DataFrame(content)

            # Ensure required columns exist
            required_cols = ['price', 'rating', 'reviewsCount', 'ranking', 'categoryName']
            for col in required_cols:
                if col not in df.columns:
                    print(f"⚠️ Missing column: {col}")
                    return None

            # Rename for consistency
            df = df.rename(columns={'categoryName': 'category'})

            # Filter valid data
            df = df[df['price'] > 0]
            df = df[df['ranking'] > 0]

            print(f"✅ Loaded {len(df)} valid products")
            return df

        except Exception as e:
            print(f"❌ Error loading data: {e}")
            return None

    def prepare_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Prepare data with feature engineering."""
        print("\n🔧 Engineering features...")

        # Encode categories
        if 'category' not in self.label_encoders:
            self.label_encoders['category'] = LabelEncoder()
            df['category_encoded'] = self.label_encoders['category'].fit_transform(df['category'].fillna('Unknown'))
        else:
            # Handle unseen categories
            df['category_encoded'] = df['category'].apply(
                lambda x: self.label_encoders['category'].transform([x])[0]
                if x in self.label_encoders['category'].classes_
                else -1
            )

        # Apply feature engineering
        df = self.feature_engineer.fit_transform(df)

        print(f"✅ Created {len(self.feature_engineer.get_feature_names())} features")
        return df

    def train_bestseller_model(self, df: pd.DataFrame) -> Dict:
        """Train bestseller detection model with proper handling."""
        print("\n" + "="*70)
        print("🏆 TRAINING BESTSELLER DETECTION MODEL")
        print("="*70)

        # Define bestseller criteria (IMPORTANT: use ranking threshold, not the ranking itself as feature)
        df['is_bestseller'] = (
                (df['ranking'] <= Config.BESTSELLER_RANK_THRESHOLD) &
                (df['reviewsCount'] >= Config.MIN_REVIEWS_FOR_BESTSELLER)
        ).astype(int)

        # CRITICAL: Remove features that would cause data leakage
        feature_cols = [
            'log_price', 'price_normalized', 'price_vs_category', 'price_tier',
            'rating_normalized', 'rating_vs_category', 'is_highly_rated',
            'log_reviews', 'has_reviews', 'reviews_per_seller',
            'is_multi_seller',
            'quality_popularity_score', 'value_score', 'competitive_advantage',
            'category_encoded'
        ]
        # NOTE: Deliberately exclude ranking-based features to prevent leakage

        X = df[feature_cols].fillna(0)
        y = df['is_bestseller']

        print(f"  📊 Bestseller ratio: {y.mean():.1%}")
        print(f"  📊 Total samples: {len(y)}")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )

        # Handle class imbalance with SMOTE
        if y_train.sum() >= 5:  # Need at least 5 positive samples for SMOTE
            smote = SMOTE(random_state=42, k_neighbors=min(5, y_train.sum()-1))
            X_train_resampled, y_train_resampled = smote.fit_resample(X_train, y_train)
            print(f"  📊 After SMOTE: {len(y_train_resampled)} samples")
        else:
            X_train_resampled, y_train_resampled = X_train, y_train

        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train_resampled)
        X_test_scaled = self.scaler.transform(X_test)

        # Train model with hyperparameter tuning
        model = XGBClassifier(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            min_child_weight=3,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1,
            random_state=42,
            use_label_encoder=False,
            eval_metric='logloss'
        )

        model.fit(X_train_scaled, y_train_resampled)

        # Cross-validation on original data (not resampled)
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X_train_scaled[:len(X_train)], y_train, cv=cv, scoring='f1')

        # Evaluate
        y_pred = model.predict(X_test_scaled)

        metrics = {
            'accuracy': accuracy_score(y_test, y_pred),
            'precision': precision_score(y_test, y_pred, zero_division=0),
            'recall': recall_score(y_test, y_pred, zero_division=0),
            'f1_score': f1_score(y_test, y_pred, zero_division=0),
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'n_samples': len(y),
            'n_bestsellers': int(y.sum()),
            'feature_importance': dict(zip(feature_cols, model.feature_importances_.tolist()))
        }

        print(f"\n  ✅ Cross-validation F1: {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
        print(f"  ✅ Test Accuracy: {metrics['accuracy']:.1%}")
        print(f"  ✅ Test Precision: {metrics['precision']:.1%}")
        print(f"  ✅ Test Recall: {metrics['recall']:.1%}")
        print(f"  ✅ Test F1-Score: {metrics['f1_score']:.1%}")

        self.models['bestseller'] = model
        self.metrics['bestseller'] = metrics

        return metrics

    def train_ranking_model(self, df: pd.DataFrame) -> Dict:
        """Train ranking prediction model."""
        print("\n" + "="*70)
        print("📈 TRAINING RANKING PREDICTION MODEL")
        print("="*70)

        # Use all features except the target
        feature_cols = [
            'log_price', 'price_normalized', 'price_vs_category', 'price_tier',
            'rating_normalized', 'rating_vs_category', 'is_highly_rated',
            'log_reviews', 'has_reviews', 'reviews_per_seller',
            'is_multi_seller',
            'quality_popularity_score', 'value_score', 'competitive_advantage', 'market_position',
            'category_encoded'
        ]

        X = df[feature_cols].fillna(0)
        y = df['ranking']

        # Log transform target for better distribution
        y_log = np.log1p(y)

        print(f"  📊 Ranking range: {y.min():.0f} - {y.max():.0f}")
        print(f"  📊 Total samples: {len(y)}")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_log, test_size=0.2, random_state=42
        )

        # Train model
        model = GradientBoostingRegressor(
            n_estimators=150,
            max_depth=6,
            learning_rate=0.1,
            min_samples_split=10,
            min_samples_leaf=5,
            subsample=0.8,
            random_state=42
        )

        model.fit(X_train, y_train)

        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')

        # Evaluate
        y_pred_log = model.predict(X_test)
        y_pred = np.expm1(y_pred_log)  # Convert back from log
        y_test_original = np.expm1(y_test)

        metrics = {
            'r2_score': r2_score(y_test, y_pred_log),
            'mae': mean_absolute_error(y_test_original, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test_original, y_pred)),
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'n_samples': len(y),
            'within_50': (np.abs(y_test_original - y_pred) <= 50).mean(),
            'within_100': (np.abs(y_test_original - y_pred) <= 100).mean(),
            'feature_importance': dict(zip(feature_cols, model.feature_importances_.tolist()))
        }

        # Calculate trend accuracy
        y_test_arr = np.array(y_test_original)
        y_pred_arr = np.array(y_pred)
        median_rank = y.median()
        actual_trend = y_test_arr < median_rank  # Below median = improving
        pred_trend = y_pred_arr < median_rank
        metrics['trend_accuracy'] = (actual_trend == pred_trend).mean()

        print(f"\n  ✅ Cross-validation R²: {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
        print(f"  ✅ Test R²: {metrics['r2_score']:.3f}")
        print(f"  ✅ MAE: {metrics['mae']:.1f} positions")
        print(f"  ✅ Within 50 positions: {metrics['within_50']:.1%}")
        print(f"  ✅ Within 100 positions: {metrics['within_100']:.1%}")
        print(f"  ✅ Trend accuracy: {metrics['trend_accuracy']:.1%}")

        self.models['ranking'] = model
        self.metrics['ranking'] = metrics

        return metrics

    def train_price_model(self, df: pd.DataFrame) -> Dict:
        """Train price optimization model with business constraints."""
        print("\n" + "="*70)
        print("💰 TRAINING PRICE OPTIMIZATION MODEL")
        print("="*70)

        # Use features that don't include price
        feature_cols = [
            'rating_normalized', 'rating_vs_category', 'is_highly_rated',
            'log_reviews', 'has_reviews',
            'is_multi_seller',
            'log_ranking', 'ranking_normalized', 'is_top_100', 'is_top_500',
            'category_encoded'
        ]

        X = df[feature_cols].fillna(0)
        y = df['price']

        # Filter out extreme prices
        q1, q3 = y.quantile([0.05, 0.95])
        mask = (y >= q1) & (y <= q3)
        X_filtered = X[mask]
        y_filtered = y[mask]

        print(f"  📊 Price range: ${y_filtered.min():.2f} - ${y_filtered.max():.2f}")
        print(f"  📊 Total samples (after filtering): {len(y_filtered)}")

        # Log transform target
        y_log = np.log1p(y_filtered)

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_filtered, y_log, test_size=0.2, random_state=42
        )

        # Train model
        model = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            min_child_weight=5,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1,
            random_state=42
        )

        model.fit(X_train, y_train)

        # Cross-validation
        cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')

        # Evaluate
        y_pred_log = model.predict(X_test)
        y_pred = np.expm1(y_pred_log)
        y_test_original = np.expm1(y_test)

        # Calculate MAPE (avoiding division by zero)
        mape = np.mean(np.abs((y_test_original - y_pred) / y_test_original.clip(lower=1))) * 100

        metrics = {
            'r2_score': r2_score(y_test, y_pred_log),
            'mae': mean_absolute_error(y_test_original, y_pred),
            'rmse': np.sqrt(mean_squared_error(y_test_original, y_pred)),
            'mape': mape,
            'cv_mean': cv_scores.mean(),
            'cv_std': cv_scores.std(),
            'n_samples': len(y_filtered),
            'feature_importance': dict(zip(feature_cols, model.feature_importances_.tolist()))
        }

        print(f"\n  ✅ Cross-validation R²: {metrics['cv_mean']:.3f} (+/- {metrics['cv_std']:.3f})")
        print(f"  ✅ Test R²: {metrics['r2_score']:.3f}")
        print(f"  ✅ MAE: ${metrics['mae']:.2f}")
        print(f"  ✅ MAPE: {metrics['mape']:.1f}%")

        self.models['price'] = model
        self.metrics['price'] = metrics

        return metrics

    def save_models(self):
        """Save all models and artifacts."""
        print("\n" + "="*70)
        print("💾 SAVING MODELS")
        print("="*70)

        # Save models
        for name, model in self.models.items():
            path = Config.get_model_path(f"{name}_model_v2.pkl")
            joblib.dump(model, path)
            print(f"  ✅ Saved {name} model")

        # Save scaler
        joblib.dump(self.scaler, Config.get_model_path(Config.SCALER_FILE))
        print(f"  ✅ Saved scaler")

        # Save label encoders
        joblib.dump(self.label_encoders, Config.get_model_path(Config.LABEL_ENCODERS))
        print(f"  ✅ Saved label encoders")

        # Save feature engineer
        joblib.dump(self.feature_engineer, Config.get_model_path("feature_engineer_v2.pkl"))
        print(f"  ✅ Saved feature engineer")

        # Save metrics
        self.metrics['metadata'] = {
            'trained_at': datetime.now().isoformat(),
            'version': '2.0.0-improved',
            'feature_names': self.feature_engineer.get_feature_names(),
        }

        with open(Config.get_model_path(Config.METRICS_FILE), 'w') as f:
            json.dump(self.metrics, f, indent=2, default=str)
        print(f"  ✅ Saved metrics")

    def train_all(self):
        """Run the complete training pipeline."""
        print("""
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    🚀 IMPROVED ML TRAINING PIPELINE                            ║
║                  Plateforme MouadVision - Mini Projet JEE 2025                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
        """)

        # Load data
        df = self.load_data_from_api()
        if df is None or len(df) < Config.MIN_SAMPLES:
            print(f"\n❌ Insufficient data. Need at least {Config.MIN_SAMPLES} products.")
            return False

        # Prepare data
        df = self.prepare_data(df)

        # Train models
        self.train_bestseller_model(df)
        self.train_ranking_model(df)
        self.train_price_model(df)

        # Save models
        self.save_models()

        # Print summary
        print("\n" + "="*70)
        print("📊 TRAINING SUMMARY")
        print("="*70)
        print(f"""
┌─────────────────────────────────────────────────────────────────────┐
│                    MODEL PERFORMANCE SUMMARY                        │
├─────────────────────────────────────────────────────────────────────┤
│ 1. BESTSELLER DETECTION                                             │
│    Cross-validation F1: {self.metrics['bestseller']['cv_mean']:.3f} (+/- {self.metrics['bestseller']['cv_std']:.3f})           │
│    Test F1 Score:       {self.metrics['bestseller']['f1_score']:.3f}                                  │
│    Precision:           {self.metrics['bestseller']['precision']:.3f}                                  │
│    Recall:              {self.metrics['bestseller']['recall']:.3f}                                  │
├─────────────────────────────────────────────────────────────────────┤
│ 2. RANKING PREDICTION                                               │
│    Cross-validation R²: {self.metrics['ranking']['cv_mean']:.3f} (+/- {self.metrics['ranking']['cv_std']:.3f})           │
│    Test R²:             {self.metrics['ranking']['r2_score']:.3f}                                  │
│    MAE:                 {self.metrics['ranking']['mae']:.1f} positions                         │
│    Trend Accuracy:      {self.metrics['ranking']['trend_accuracy']:.1%}                              │
├─────────────────────────────────────────────────────────────────────┤
│ 3. PRICE OPTIMIZATION                                               │
│    Cross-validation R²: {self.metrics['price']['cv_mean']:.3f} (+/- {self.metrics['price']['cv_std']:.3f})           │
│    Test R²:             {self.metrics['price']['r2_score']:.3f}                                  │
│    MAE:                 ${self.metrics['price']['mae']:.2f}                                │
│    MAPE:                {self.metrics['price']['mape']:.1f}%                                 │
└─────────────────────────────────────────────────────────────────────┘
        """)

        print("\n✅ Training complete! Models saved to:", Config.MODELS_DIR)
        return True


def main():
    trainer = ImprovedMLTrainer()
    success = trainer.train_all()

    if not success:
        print("\n❌ Training failed. Check the logs above for details.")
        exit(1)


if __name__ == '__main__':
    main()