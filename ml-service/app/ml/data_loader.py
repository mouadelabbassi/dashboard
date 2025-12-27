import pandas as pd
import numpy as np
import logging
from typing import Tuple

from app.core.database import get_products_with_category_stats

logger = logging.getLogger(__name__)


class DataLoader:

    def __init__(self):
        self._cached_data = None

    def load_training_data(self, use_cache: bool = True) -> pd.DataFrame:
        if use_cache and self._cached_data is not None:
            logger.info("Using cached training data")
            return self._cached_data.copy()

        logger.info("Loading training data from database")
        df = get_products_with_category_stats()

        if df.empty:
            logger.warning("No training data loaded")
            return df

        df = self._clean_data(df)

        self._cached_data = df.copy()
        logger.info(f"Loaded {len(df)} products for training")

        return df

    def _clean_data(self, df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Cleaning data")

        if 'is_bestseller' in df.columns:
            df['is_bestseller'] = df['is_bestseller'].apply(self._convert_bit_to_int)

        numeric_columns = [
            'price', 'rating', 'reviews_count', 'ranking', 'sales_count',
            'stock_quantity', 'discount_percentage', 'days_since_listed', 'no_of_sellers'
        ]

        for col in numeric_columns:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                median_val = df[col].median()
                if pd.isna(median_val):
                    median_val = 0
                df[col] = df[col].fillna(median_val)
                df[col] = df[col].clip(lower=0)

        category_stats = [
            'category_avg_price', 'category_min_price', 'category_max_price',
            'category_avg_rating', 'category_avg_reviews'
        ]

        for col in category_stats:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors='coerce')
                median_val = df[col].median()
                if pd.isna(median_val):
                    median_val = 0
                df[col] = df[col].fillna(median_val)

        if 'category_name' in df.columns:
            df['category_name'] = df['category_name'].fillna('Unknown')

        if 'price' in df.columns:
            price_cap = df['price'].quantile(0.99)
            df = df[df['price'] <= price_cap]
            df = df[df['price'] > 0]

        if 'rating' in df.columns:
            df = df[df['rating'].between(0, 5)]

        df = df.drop_duplicates(subset=['asin'], keep='first')

        logger.info(f"Data cleaned: {len(df)} products remaining")
        return df

    def _convert_bit_to_int(self, value):
        if pd.isna(value):
            return 0
        if isinstance(value, bytes):
            return 1 if value == b'\x01' else 0
        if isinstance(value, (int, np.integer)):
            return int(value)
        if isinstance(value, bool):
            return 1 if value else 0
        if isinstance(value, str):
            if value.lower() in ['true', '1', 'yes']:
                return 1
            return 0
        return 0

    def prepare_single_product(self, product_data: dict) -> pd.DataFrame:
        df = pd.DataFrame([product_data])

        if 'category_avg_price' not in df.columns or pd.isna(df['category_avg_price'].iloc[0]):
            df['category_avg_price'] = df['price'].iloc[0]

        if 'category_avg_reviews' not in df.columns or pd.isna(df['category_avg_reviews'].iloc[0]):
            df['category_avg_reviews'] = df.get('reviews_count', pd.Series([0])).iloc[0]

        if 'category_min_price' not in df.columns:
            df['category_min_price'] = df['price'].iloc[0] * 0.5

        if 'category_max_price' not in df.columns:
            df['category_max_price'] = df['price'].iloc[0] * 2.0

        return df