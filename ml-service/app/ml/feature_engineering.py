import pandas as pd
import numpy as np
import logging
from typing import List, Tuple

logger = logging.getLogger(__name__)


class FeatureEngineer:

    BESTSELLER_FEATURES = [
        'price',
        'rating',
        'reviews_count',
        'sales_count',
        'discount_percentage',
        'days_since_listed',
        'stock_quantity',
        'price_to_category_avg_ratio',
        'reviews_to_category_avg_ratio',
        'rating_normalized',
        'reviews_count_log',
        'sales_count_log',
        'has_discount',
        'is_low_stock'
    ]

    RANKING_FEATURES = [
        'price',
        'rating',
        'reviews_count',
        'sales_count',
        'price_to_category_avg_ratio',
        'reviews_to_category_avg_ratio',
        'rating_normalized',
        'reviews_count_log',
        'sales_count_log',
        'has_discount',
        'discount_percentage'
    ]

    @staticmethod
    def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
        logger.info("Engineering features")

        if 'price' in df.columns and 'category_avg_price' in df.columns:
            df['price_to_category_avg_ratio'] = np.where(
                df['category_avg_price'] > 0,
                df['price'] / df['category_avg_price'],
                1.0
            )
        else:
            df['price_to_category_avg_ratio'] = 1.0

        if 'reviews_count' in df.columns and 'category_avg_reviews' in df.columns:
            df['reviews_to_category_avg_ratio'] = np.where(
                df['category_avg_reviews'] > 0,
                df['reviews_count'] / df['category_avg_reviews'],
                1.0
            )
        else:
            df['reviews_to_category_avg_ratio'] = 1.0

        if 'rating' in df.columns:
            df['rating_normalized'] = df['rating'] / 5.0
        else:
            df['rating_normalized'] = 0.6

        if 'reviews_count' in df.columns:
            df['reviews_count_log'] = np.log1p(df['reviews_count'])
        else:
            df['reviews_count_log'] = 0

        if 'sales_count' in df.columns:
            df['sales_count_log'] = np.log1p(df['sales_count'])
        else:
            df['sales_count_log'] = 0

        if 'discount_percentage' in df.columns:
            df['has_discount'] = (df['discount_percentage'] > 0).astype(int)
        else:
            df['has_discount'] = 0

        if 'stock_quantity' in df.columns:
            df['is_low_stock'] = ((df['stock_quantity'] > 0) & (df['stock_quantity'] < 10)).astype(int)
        else:
            df['is_low_stock'] = 0

        df = df.fillna(0)

        logger.info(f"Features engineered. Total columns: {len(df.columns)}")
        return df

    @staticmethod
    def prepare_bestseller_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        logger.info("Preparing bestseller features")

        df = FeatureEngineer.engineer_features(df)

        available_features = [f for f in FeatureEngineer.BESTSELLER_FEATURES if f in df.columns]

        if not available_features:
            logger.error("No features available for bestseller model")
            return pd.DataFrame(), pd.Series()

        logger.info(f"Using {len(available_features)} features")

        X = df[available_features].copy()

        if 'is_bestseller' in df.columns:
            y = df['is_bestseller'].astype(int)
        else:
            y = (df.get('ranking', 999) <= 100).astype(int)

        X = X.fillna(0)

        logger.info(f"Bestseller features prepared: {len(X)} samples")
        logger.info(f"Class distribution - Bestsellers: {(y==1).sum()}, Non-bestsellers: {(y==0).sum()}")

        return X, y

    @staticmethod
    def prepare_ranking_features(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.Series]:
        logger.info("Preparing ranking features")

        df = FeatureEngineer.engineer_features(df)

        available_features = [f for f in FeatureEngineer.RANKING_FEATURES if f in df.columns]

        if not available_features:
            logger.error("No features available for ranking model")
            return pd.DataFrame(), pd.Series()

        logger.info(f"Using {len(available_features)} features")

        X = df[available_features].copy()

        score = pd.Series(0.0, index=df.index)

        if 'rating' in df.columns:
            score += (df['rating'] - 3.0) * 10

        if 'sales_count' in df.columns:
            score += np.log1p(df['sales_count']) * 5

        if 'reviews_count' in df.columns:
            score += np.log1p(df['reviews_count']) * 3

        if 'price_to_category_avg_ratio' in df.columns:
            score -= (df['price_to_category_avg_ratio'] - 1).abs() * 5

        y = pd.cut(
            score,
            bins=[-np.inf, score.quantile(0.33), score.quantile(0.67), np.inf],
            labels=[0, 1, 2]
        )

        y = y.astype(int)

        X = X.fillna(0)

        logger.info(f"Ranking features prepared: {len(X)} samples")
        logger.info(f"Trend distribution - Declining: {(y==0).sum()}, Stable: {(y==1).sum()}, Improving: {(y==2).sum()}")

        return X, y