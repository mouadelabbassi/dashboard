import pandas as pd
import numpy as np
import logging
from typing import Tuple, Optional
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib

from utils.database import (
    get_products_for_training,
    get_products_with_category_stats,
    get_category_price_stats
)
from config import MODEL_PATHS, BESTSELLER_FEATURES, RANKING_TREND_FEATURES

logger = logging.getLogger(__name__)


class DataLoader:
   def __init__(self):
        self.scaler = None
        self.label_encoder = None
        self.category_encoder = None

    def load_training_data(self) -> pd.DataFrame:
        """Load and preprocess data for model training"""
        logger.info("Loading training data from database...")

        df = get_products_with_category_stats()

        if df.empty:
            logger.warning("No data loaded from database")
            return df

        # Clean and preprocess
        df = self._clean_data(df)
        df = self._engineer_features(df)

        logger.info(f"Training data ready: {len(df)} samples, {len(df.columns)} features")
        return df

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Clean raw data - handle missing values, outliers"""
        logger.info("Cleaning data...")

        # Handle missing numeric values
        numeric_cols = ['price', 'rating', 'reviews_count', 'ranking', 'sales_count',
                        'stock_quantity', 'discount_percentage', 'days_since_listed']

        for col in numeric_cols:
            if col in df.columns:
                # Fill missing with median (more robust than mean)
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val if not pd.isna(median_val) else 0)

        # Handle missing category stats
        stat_cols = ['category_avg_price', 'category_min_price', 'category_max_price',
                     'category_avg_rating', 'category_avg_reviews']

        for col in stat_cols:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].median())

        # Fill missing category names
        if 'category_name' in df.columns:
            df['category_name'] = df['category_name'].fillna('Unknown')

        # Fill missing boolean
        if 'is_bestseller' in df.columns:
            df['is_bestseller'] = df['is_bestseller'].fillna(False).astype(bool)

        # Remove extreme outliers (keep 99.5th percentile)
        if 'price' in df.columns:
            price_cap = df['price'].quantile(0.995)
            df['price'] = df['price'].clip(upper=price_cap)

        logger.info(f"Data cleaned: {len(df)} samples remaining")
        return df

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create derived features for ML models"""
        logger.info("Engineering features...")

        # Price-to-category ratio
        if 'price' in df.columns and 'category_avg_price' in df.columns:
            df['price_to_category_avg_ratio'] = np.where(
                df['category_avg_price'] > 0,
                df['price'] / df['category_avg_price'],
                1.0
            )
        else:
            df['price_to_category_avg_ratio'] = 1.0

        # Reviews-to-category ratio
        if 'reviews_count' in df.columns and 'category_avg_reviews' in df.columns:
            df['reviews_to_category_avg_ratio'] = np.where(
                df['category_avg_reviews'] > 0,
                df['reviews_count'] / df['category_avg_reviews'],
                1.0
            )
        else:
            df['reviews_to_category_avg_ratio'] = 1.0

        # Normalized rating (0-1 scale)
        if 'rating' in df.columns:
            df['rating_normalized'] = df['rating'] / 5.0
        else:
            df['rating_normalized'] = 0.5

        # Log transformations for skewed features
        if 'reviews_count' in df.columns:
            df['reviews_count_log'] = np.log1p(df['reviews_count'])

        if 'sales_count' in df.columns:
            df['sales_count_log'] = np.log1p(df['sales_count'])

        # Ranking percentile (lower rank = better)
        if 'ranking' in df.columns:
            max_rank = df['ranking'].max()
            if max_rank > 0:
                df['ranking_percentile'] = 1 - (df['ranking'] / max_rank)
            else:
                df['ranking_percentile'] = 0.5
        else:
            df['ranking_percentile'] = 0.5

        # Category rank percentile
        if 'ranking' in df.columns and 'category_name' in df.columns:
            df['category_rank_percentile'] = df.groupby('category_name')['ranking'].rank(pct=True)
        else:
            df['category_rank_percentile'] = 0.5

        # Is platform product (no seller = MouadVision product)
        if 'seller_id' in df.columns:
            df['is_platform_product'] = df['seller_id'].isna().astype(int)
        else:
            df['is_platform_product'] = 1

        # Fill any remaining NaN with 0
        df = df.fillna(0)

        logger.info(f"Features engineered. Total columns: {len(df.columns)}")
        return df

    def prepare_bestseller_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare data specifically for bestseller model"""
        logger.info("Preparing bestseller training data...")

        # Define features to use (subset that exists in data)
        available_features = [f for f in BESTSELLER_FEATURES if f in df.columns]

        # Add fallback features if main ones are missing
        fallback_features = [
            'price', 'rating', 'reviews_count', 'sales_count',
            'price_to_category_avg_ratio', 'reviews_to_category_avg_ratio',
            'rating_normalized', 'ranking_percentile'
        ]

        for f in fallback_features:
            if f in df.columns and f not in available_features:
                available_features.append(f)

        if not available_features:
            logger.error("No features available for training!")
            return pd.DataFrame(), pd.Series()

        logger.info(f"Using features: {available_features}")

        X = df[available_features].copy()

        # Target: is_bestseller (convert to binary)
        if 'is_bestseller' in df.columns:
            y = df['is_bestseller'].astype(int)
        else:
            # Create synthetic target based on ranking and sales
            y = (
                    (df.get('ranking', 999) <= 100) |
                    (df.get('sales_count', 0) > df.get('sales_count', 0).quantile(0.9))
            ).astype(int)

        # Handle any remaining NaN
        X = X.fillna(0)

        logger.info(f"Bestseller data: {len(X)} samples, {len(available_features)} features")
        logger.info(f"Target distribution: {y.value_counts().to_dict()}")

        return X, y

    def prepare_ranking_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """Prepare data specifically for ranking trend model"""
        logger.info("Preparing ranking trend training data...")

        # For ranking trend, we need to create synthetic trend labels
        # since we don't have historical ranking data

        available_features = [f for f in RANKING_TREND_FEATURES if f in df.columns]

        fallback_features = [
            'ranking', 'price', 'rating', 'reviews_count', 'sales_count',
            'category_rank_percentile', 'price_to_category_avg_ratio'
        ]

        for f in fallback_features:
            if f in df.columns and f not in available_features:
                available_features.append(f)

        # Rename ranking to current_rank if needed
        if 'ranking' in df.columns and 'current_rank' not in df.columns:
            df['current_rank'] = df['ranking']
            if 'current_rank' not in available_features:
                available_features.append('current_rank')

        if not available_features:
            logger.error("No features available for ranking model!")
            return pd.DataFrame(), pd.Series()

        X = df[[f for f in available_features if f in df.columns]].copy()

        # Create synthetic trend labels based on product metrics
        # Products with good ratings, high sales, good price position -> IMPROVING
        # Products with poor metrics -> DECLINING
        # Others -> STABLE

        score = pd.Series(0.0, index=df.index)

        if 'rating' in df.columns:
            score += (df['rating'] - 3.5) * 10  # Rating contribution

        if 'sales_count' in df.columns:
            score += np.log1p(df['sales_count']) * 2  # Sales contribution

        if 'reviews_count' in df.columns:
            score += np.log1p(df['reviews_count']) * 1  # Reviews contribution

        if 'price_to_category_avg_ratio' in df.columns:
            # Being slightly below average price is good
            score -= (df['price_to_category_avg_ratio'] - 1).abs() * 5

        # Convert score to categorical
        y = pd.cut(score,
                   bins=[-np.inf, score.quantile(0.33), score.quantile(0.67), np.inf],
                   labels=['DECLINING', 'STABLE', 'IMPROVING'])

        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = pd.Series(self.label_encoder.fit_transform(y), index=y.index)

        # Save label encoder
        joblib.dump(self.label_encoder, MODEL_PATHS['label_encoder'])

        X = X.fillna(0)

        logger.info(f"Ranking data: {len(X)} samples, {len(X.columns)} features")
        logger.info(f"Trend distribution: {pd.Series(y).value_counts().to_dict()}")

        return X, y_encoded

    def prepare_single_product(self, product_data: dict) -> pd.DataFrame:
        """
        Prepare a single product for prediction.
        Used during inference.
        """
        # Create DataFrame from single product
        df = pd.DataFrame([product_data])

        # Apply same cleaning and feature engineering
        df = self._clean_data(df)
        df = self._engineer_features(df)

        return df

    def get_feature_names(self, model_type: str) -> list:
        """Get the feature names used for a model type"""
        if model_type == 'bestseller':
            return BESTSELLER_FEATURES
        elif model_type == 'ranking_trend':
            return RANKING_TREND_FEATURES
        else:
            return []


def load_and_prepare_data(model_type: str = 'bestseller') -> Tuple[pd.DataFrame, pd.Series]:
    """
    Convenience function to load and prepare training data.

    Args:
        model_type: 'bestseller' or 'ranking_trend'

    Returns:
        X: Features DataFrame
        y: Target Series
    """
    loader = DataLoader()
    df = loader.load_training_data()

    if df.empty:
        return pd.DataFrame(), pd.Series()

    if model_type == 'bestseller':
        return loader.prepare_bestseller_data(df)
    elif model_type == 'ranking_trend':
        return loader.prepare_ranking_data(df)
    else:
        logger.error(f"Unknown model type: {model_type}")
        return pd.DataFrame(), pd.Series()


if __name__ == '__main__':
    # Test data loading
    print("Testing data loading...")

    loader = DataLoader()
    df = loader.load_training_data()

    if not df.empty:
        print(f"✅ Loaded {len(df)} products")
        print(f"Columns: {df.columns.tolist()}")
        print(f"\nSample data:")
        print(df.head())

        # Test bestseller preparation
        X, y = loader.prepare_bestseller_data(df)
        print(f"\n✅ Bestseller data prepared: {X.shape}")

        # Test ranking preparation
        X, y = loader.prepare_ranking_data(df)
        print(f"✅ Ranking data prepared: {X.shape}")
    else:
        print("❌ No data loaded")