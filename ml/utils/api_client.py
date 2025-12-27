import pandas as pd
import numpy as np
import logging
from typing import Tuple, List, Dict, Optional
from sklearn.preprocessing import StandardScaler, LabelEncoder
import joblib

from api_client import get_api_client
from config import MODEL_PATHS, BESTSELLER_FEATURES, RANKING_TREND_FEATURES

logger = logging.getLogger(__name__)


class EnhancedDataLoader:


    def __init__(self, use_api: bool = True, use_cache: bool = True):

        self.use_api = use_api
        self.use_cache = use_cache
        self.scaler = None
        self.label_encoder = None
        self.category_encoder = None
        self._cached_data = None

    def load_training_data(self, force_refresh: bool = False) -> pd.DataFrame:

        logger.info("=" * 60)
        logger.info("📊 Loading Training Data")
        logger.info("=" * 60)


        if self.use_cache and self._cached_data is not None and not force_refresh:
            logger.info("✅ Using cached data")
            return self._cached_data.copy()


        if self.use_api:
            df = self._fetch_from_api()
        else:
            df = self._fetch_from_database()

        if df.empty:
            logger.error("❌ No data loaded!")
            return df

        logger.info(f"📥 Loaded {len(df)} products with {len(df.columns)} columns")


        self._log_data_quality(df)


        df = self._clean_data(df)


        df = self._engineer_features(df)


        if self.use_cache:
            self._cached_data = df.copy()

        logger.info(f"✅ Data prepared: {len(df)} samples, {len(df.columns)} features")
        logger.info("=" * 60)

        return df

    def _fetch_from_api(self) -> pd.DataFrame:

        logger.info("🌐 Fetching from Spring Boot API...")

        try:
            api_client = get_api_client()


            if not api_client.health_check():
                logger.error("❌ Spring API not reachable")
                return pd.DataFrame()

            # Fetch enriched data
            df = api_client.fetch_products_with_enrichment()

            if df.empty:
                logger.error("❌ No products returned from API")
                return df

            # Standardize column names (Spring Boot uses camelCase)
            df = self._standardize_columns(df)

            logger.info(f"✅ Fetched {len(df)} products from Spring API")
            return df

        except Exception as e:
            logger.error(f"❌ Error fetching from API: {e}")
            return pd.DataFrame()

    def _fetch_from_database(self) -> pd.DataFrame:
        """Fallback: Fetch from database directly"""
        logger.info("💾 Fetching from database (fallback)...")

        try:
            from utils.database import get_products_with_category_stats
            df = get_products_with_category_stats()
            logger.info(f"✅ Fetched {len(df)} products from database")
            return df
        except Exception as e:
            logger.error(f"❌ Error fetching from database: {e}")
            return pd.DataFrame()

    def _standardize_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Standardize column names from camelCase to snake_case.
        Maps Spring Boot entity fields to ML-friendly names.
        """
        column_mapping = {
            # Product fields
            'asin': 'asin',
            'productName': 'product_name',
            'price': 'price',
            'rating': 'rating',
            'reviewsCount': 'reviews_count',
            'ranking': 'ranking',
            'salesCount': 'sales_count',
            'isBestseller': 'is_bestseller',
            'stockQuantity': 'stock_quantity',
            'discountPercentage': 'discount_percentage',
            'daysSinceListed': 'days_since_listed',
            'noOfSellers': 'no_of_sellers',
            'sellerId': 'seller_id',
            'categoryId': 'category_id',
            'category_name': 'category_name',

            # Category stats (already snake_case from enrichment)
            'category_avg_price': 'category_avg_price',
            'category_min_price': 'category_min_price',
            'category_max_price': 'category_max_price',
            'category_std_price': 'category_std_price',
            'category_avg_rating': 'category_avg_rating',
            'category_avg_reviews': 'category_avg_reviews',
            'category_product_count': 'category_product_count'
        }

        # Rename only columns that exist
        rename_map = {k: v for k, v in column_mapping.items() if k in df.columns}
        df = df.rename(columns=rename_map)

        return df

    def _log_data_quality(self, df: pd.DataFrame):
        """Log data quality metrics"""
        logger.info("\n📋 Data Quality Report:")
        logger.info(f"   Total rows: {len(df)}")
        logger.info(f"   Total columns: {len(df.columns)}")

        # Missing values
        missing = df.isnull().sum()
        if missing.any():
            logger.info("\n   Missing values:")
            for col, count in missing[missing > 0].items():
                pct = (count / len(df)) * 100
                logger.info(f"      {col}: {count} ({pct:.1f}%)")

        # Check critical columns
        critical_cols = ['price', 'rating', 'reviews_count', 'sales_count']
        for col in critical_cols:
            if col in df.columns:
                logger.info(f"   {col}: min={df[col].min():.2f}, max={df[col].max():.2f}, mean={df[col].mean():.2f}")

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Clean and validate data.
        Handle missing values, outliers, and invalid data.
        """
        logger.info("🧹 Cleaning data...")

        initial_count = len(df)

        # Handle missing numeric values
        numeric_cols = {
            'price': 0.0,
            'rating': 3.0,  # Neutral rating
            'reviews_count': 0,
            'ranking': 999999,
            'sales_count': 0,
            'stock_quantity': 0,
            'discount_percentage': 0,
            'days_since_listed': 0,
            'no_of_sellers': 1
        }

        for col, default in numeric_cols.items():
            if col in df.columns:
                # Replace negative values with 0
                df.loc[df[col] < 0, col] = 0

                # Fill missing with median (more robust than mean)
                median_val = df[col].median()
                if pd.isna(median_val):
                    median_val = default
                df[col] = df[col].fillna(median_val)

        # Handle missing category stats
        category_stat_cols = [
            'category_avg_price', 'category_min_price', 'category_max_price',
            'category_avg_rating', 'category_avg_reviews', 'category_product_count'
        ]

        for col in category_stat_cols:
            if col in df.columns:
                # Fill with global median
                global_median = df[col].median()
                df[col] = df[col].fillna(global_median if not pd.isna(global_median) else 0)

        # Handle missing category names
        if 'category_name' in df.columns:
            df['category_name'] = df['category_name'].fillna('Unknown')

        # Handle is_bestseller
        if 'is_bestseller' in df.columns:
            df['is_bestseller'] = df['is_bestseller'].fillna(False).astype(bool)

        # Remove extreme price outliers (keep 99th percentile)
        if 'price' in df.columns:
            price_99 = df['price'].quantile(0.99)
            df = df[df['price'] <= price_99]

        # Remove products with invalid data
        if 'price' in df.columns:
            df = df[df['price'] > 0]  # Price must be positive

        if 'rating' in df.columns:
            df = df[df['rating'].between(0, 5)]  # Rating must be 0-5

        # Remove duplicates by ASIN
        if 'asin' in df.columns:
            df = df.drop_duplicates(subset=['asin'], keep='first')

        cleaned_count = len(df)
        logger.info(f"   Removed {initial_count - cleaned_count} invalid/duplicate rows")
        logger.info(f"   {cleaned_count} clean rows remaining")

        return df

    def _engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer ML features from raw data.
        CRITICAL: Avoid target leakage!
        """
        logger.info("⚙️ Engineering features...")

        # === PRICE FEATURES ===

        # Price-to-category ratio (competitiveness)
        if 'price' in df.columns and 'category_avg_price' in df.columns:
            df['price_to_category_avg_ratio'] = np.where(
                df['category_avg_price'] > 0,
                df['price'] / df['category_avg_price'],
                1.0
            )

            # Price positioning
            df['price_below_avg'] = (df['price'] < df['category_avg_price']).astype(int)
            df['price_above_avg'] = (df['price'] > df['category_avg_price']).astype(int)

        # Price in category percentile
        if 'price' in df.columns and 'category_min_price' in df.columns and 'category_max_price' in df.columns:
            price_range = df['category_max_price'] - df['category_min_price']
            df['price_percentile_in_category'] = np.where(
                price_range > 0,
                (df['price'] - df['category_min_price']) / price_range,
                0.5
            )

        # === RATING & REVIEW FEATURES ===

        # Reviews-to-category ratio
        if 'reviews_count' in df.columns and 'category_avg_reviews' in df.columns:
            df['reviews_to_category_avg_ratio'] = np.where(
                df['category_avg_reviews'] > 0,
                df['reviews_count'] / df['category_avg_reviews'],
                1.0
            )

        # Rating normalized (0-1 scale)
        if 'rating' in df.columns:
            df['rating_normalized'] = df['rating'] / 5.0

        # High rating indicator
        if 'rating' in df.columns:
            df['has_high_rating'] = (df['rating'] >= 4.0).astype(int)

        # Review velocity (reviews per day)
        if 'reviews_count' in df.columns and 'days_since_listed' in df.columns:
            df['review_velocity'] = np.where(
                df['days_since_listed'] > 0,
                df['reviews_count'] / df['days_since_listed'],
                0
            )

        # === SALES FEATURES ===

        # Log transformations for skewed features
        if 'reviews_count' in df.columns:
            df['reviews_count_log'] = np.log1p(df['reviews_count'])

        if 'sales_count' in df.columns:
            df['sales_count_log'] = np.log1p(df['sales_count'])

        # Sales velocity
        if 'sales_count' in df.columns and 'days_since_listed' in df.columns:
            df['sales_velocity'] = np.where(
                df['days_since_listed'] > 0,
                df['sales_count'] / df['days_since_listed'],
                0
            )

        # === RANKING FEATURES (CAREFUL: Potential target leakage!) ===

        # For bestseller prediction, we CAN use ranking as a feature
        # (it's not the target, is_bestseller is)

        if 'ranking' in df.columns:
            # Ranking percentile (lower rank = better)
            max_rank = df['ranking'].max()
            if max_rank > 0:
                df['ranking_percentile'] = 1 - (df['ranking'] / max_rank)
            else:
                df['ranking_percentile'] = 0.5

            # Top ranked indicator
            df['is_top_100'] = (df['ranking'] <= 100).astype(int)
            df['is_top_500'] = (df['ranking'] <= 500).astype(int)

        # Category ranking percentile
        if 'ranking' in df.columns and 'category_name' in df.columns:
            df['category_rank_percentile'] = df.groupby('category_name')['ranking'].rank(pct=True, ascending=True)

        # === PRODUCT ATTRIBUTES ===

        # Discount indicator
        if 'discount_percentage' in df.columns:
            df['has_discount'] = (df['discount_percentage'] > 0).astype(int)
            df['high_discount'] = (df['discount_percentage'] >= 20).astype(int)

        # Stock level
        if 'stock_quantity' in df.columns:
            df['has_stock'] = (df['stock_quantity'] > 0).astype(int)
            df['low_stock'] = ((df['stock_quantity'] > 0) & (df['stock_quantity'] < 10)).astype(int)

        # Product age categories
        if 'days_since_listed' in df.columns:
            df['is_new_product'] = (df['days_since_listed'] < 30).astype(int)
            df['is_mature_product'] = (df['days_since_listed'] >= 180).astype(int)

        # Seller type
        if 'seller_id' in df.columns:
            df['is_platform_product'] = df['seller_id'].isna().astype(int)

        # Multi-seller indicator
        if 'no_of_sellers' in df.columns:
            df['is_multi_seller'] = (df['no_of_sellers'] > 1).astype(int)

        # === INTERACTION FEATURES ===

        # Quality score (combines rating and reviews)
        if 'rating' in df.columns and 'reviews_count' in df.columns:
            # Weighted quality: rating * log(reviews + 1)
            df['quality_score'] = df['rating'] * np.log1p(df['reviews_count'])

        # Value score (quality / price)
        if 'rating' in df.columns and 'price' in df.columns:
            df['value_score'] = np.where(
                df['price'] > 0,
                df['rating'] / df['price'],
                0
            )

        # Fill any remaining NaN
        df = df.fillna(0)

        logger.info(f"   Engineered {len(df.columns)} total features")

        return df

    def prepare_bestseller_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for bestseller detection model.

        Args:
            df: Preprocessed DataFrame

        Returns:
            (X, y): Features and target
        """
        logger.info("🎯 Preparing Bestseller Detection Data")

        # Select features (avoid using is_bestseller or very correlated features)
        feature_candidates = [
            'price', 'rating', 'reviews_count', 'sales_count',
            'discount_percentage', 'days_since_listed', 'stock_quantity',
            'price_to_category_avg_ratio', 'reviews_to_category_avg_ratio',
            'rating_normalized', 'reviews_count_log', 'sales_count_log',
            'review_velocity', 'sales_velocity', 'has_high_rating',
            'has_discount', 'quality_score', 'value_score',
            'is_new_product', 'is_platform_product',
            'price_percentile_in_category'
        ]

        # Use only available features
        available_features = [f for f in feature_candidates if f in df.columns]

        if not available_features:
            logger.error("❌ No features available!")
            return pd.DataFrame(), pd.Series()

        logger.info(f"   Using {len(available_features)} features:")
        for f in available_features:
            logger.info(f"      - {f}")

        X = df[available_features].copy()

        # Target: is_bestseller
        if 'is_bestseller' in df.columns:
            y = df['is_bestseller'].astype(int)
        else:
            # Create synthetic target based on ranking
            logger.warning("⚠️ is_bestseller column missing, creating synthetic labels")
            y = (df.get('ranking', 999) <= 100).astype(int)

        # Log target distribution
        logger.info(f"\n   Target Distribution:")
        logger.info(f"      Bestsellers (1): {(y == 1).sum()} ({(y == 1).sum() / len(y) * 100:.1f}%)")
        logger.info(f"      Non-bestsellers (0): {(y == 0).sum()} ({(y == 0).sum() / len(y) * 100:.1f}%)")

        # Class imbalance check
        minority_class_pct = min((y == 1).sum(), (y == 0).sum()) / len(y) * 100
        if minority_class_pct < 10:
            logger.warning(f"⚠️ Severe class imbalance: minority class is {minority_class_pct:.1f}%")

        logger.info(f"✅ Prepared {len(X)} samples for training")

        return X, y

    def prepare_ranking_data(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Prepare data for ranking trend prediction model.

        WARNING: This uses synthetic labels since we don't have historical data!

        Args:
            df: Preprocessed DataFrame

        Returns:
            (X, y): Features and target
        """
        logger.info("🎯 Preparing Ranking Trend Prediction Data (EXPERIMENTAL)")
        logger.warning("⚠️ Using synthetic trend labels (no historical data)")

        # Features for ranking prediction (CANNOT use ranking itself!)
        feature_candidates = [
            'price', 'rating', 'reviews_count', 'sales_count',
            'price_to_category_avg_ratio', 'reviews_to_category_avg_ratio',
            'rating_normalized', 'review_velocity', 'sales_velocity',
            'quality_score', 'has_high_rating', 'discount_percentage',
            'has_discount', 'stock_quantity', 'days_since_listed',
            'is_new_product', 'value_score'
        ]

        available_features = [f for f in feature_candidates if f in df.columns]

        if not available_features:
            logger.error("❌ No features available!")
            return pd.DataFrame(), pd.Series()

        logger.info(f"   Using {len(available_features)} features (no ranking!)")

        X = df[available_features].copy()

        # Create synthetic trend labels
        # Score products based on metrics (not ranking!)
        score = pd.Series(0.0, index=df.index)

        if 'rating' in df.columns:
            score += (df['rating'] - 3.0) * 10

        if 'sales_velocity' in df.columns:
            score += np.log1p(df['sales_velocity']) * 5

        if 'review_velocity' in df.columns:
            score += np.log1p(df['review_velocity']) * 3

        if 'has_high_rating' in df.columns:
            score += df['has_high_rating'] * 5

        if 'value_score' in df.columns:
            score += df['value_score'] * 2

        # Convert to categories
        y = pd.cut(
            score,
            bins=[-np.inf, score.quantile(0.33), score.quantile(0.67), np.inf],
            labels=['DECLINING', 'STABLE', 'IMPROVING']
        )

        # Encode labels
        self.label_encoder = LabelEncoder()
        y_encoded = pd.Series(self.label_encoder.fit_transform(y), index=y.index)

        # Save encoder
        joblib.dump(self.label_encoder, MODEL_PATHS['label_encoder'])

        logger.info(f"\n   Synthetic Trend Distribution:")
        for i, label in enumerate(self.label_encoder.classes_):
            count = (y_encoded == i).sum()
            pct = count / len(y_encoded) * 100
            logger.info(f"      {label}: {count} ({pct:.1f}%)")

        logger.info(f"✅ Prepared {len(X)} samples (SYNTHETIC labels)")

        return X, y_encoded


def load_and_prepare_data(
        model_type: str = 'bestseller',
        use_api: bool = True
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Convenience function to load and prepare training data.

    Args:
        model_type: 'bestseller' or 'ranking_trend'
        use_api: Use Spring API or fallback to database

    Returns:
        (X, y): Features and target
    """
    loader = EnhancedDataLoader(use_api=use_api)
    df = loader.load_training_data()

    if df.empty:
        logger.error("❌ No data loaded")
        return pd.DataFrame(), pd.Series()

    if model_type == 'bestseller':
        return loader.prepare_bestseller_data(df)
    elif model_type == 'ranking_trend':
        return loader.prepare_ranking_data(df)
    else:
        logger.error(f"❌ Unknown model type: {model_type}")
        return pd.DataFrame(), pd.Series()


if __name__ == '__main__':
    # Test the enhanced data loader
    print("=" * 60)
    print("Testing Enhanced Data Loader")
    print("=" * 60)

    loader = EnhancedDataLoader(use_api=True)

    # Load data
    df = loader.load_training_data()

    if not df.empty:
        print(f"\n✅ Loaded {len(df)} products")
        print(f"Columns: {len(df.columns)}")

        # Test bestseller preparation
        X, y = loader.prepare_bestseller_data(df)
        print(f"\n✅ Bestseller data: {X.shape}")

        # Test ranking preparation
        X_r, y_r = loader.prepare_ranking_data(df)
        print(f"✅ Ranking data: {X_r.shape}")
    else:
        print("\n❌ No data loaded - check Spring Boot API connection")