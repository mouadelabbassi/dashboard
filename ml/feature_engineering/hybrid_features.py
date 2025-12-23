import pandas as pd
import numpy as np
from typing import Dict, List, Tuple
from sklearn.preprocessing import StandardScaler, LabelEncoder
import pickle
import os

class HybridFeatureEngineer:

    def __init__(self, category_stats: Dict = None):
        self.category_stats = category_stats or {}
        self.scalers = {}
        self.label_encoders = {}
        self.feature_names = []

    def fit_transform(self, df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
        df = df.copy()

        df = self._impute_missing_values(df)
        df = self._create_ratio_features(df)
        df = self._create_categorical_features(df)
        df = self._create_bestseller_labels(df)
        df = self._create_ranking_targets(df)

        numerical_features = self._get_numerical_features()
        df = self._scale_features(df, numerical_features, fit=True)

        self.feature_names = [
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'sales_velocity_scaled', 'product_source_binary',
            'category_encoded', 'price_vs_category_scaled', 'combined_rating',
            'days_since_listed_scaled', 'sales_momentum_scaled', 'recency_score_scaled',
            'rank_normalized_scaled', 'reviews_normalized_scaled', 'product_maturity',
            'sales_acceleration', 'revenue_per_order', 'order_count', 'unique_customers',
            'total_units_sold', 'price_tier_encoded', 'has_sales', 'has_amazon_data'
        ]

        feature_importance = self._calculate_feature_importance(df)

        metadata = {
            'category_stats': self.category_stats,
            'scalers': self.scalers,
            'label_encoders': self.label_encoders,
            'feature_names': self.feature_names,
            'feature_importance': feature_importance
        }

        return df, metadata

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df = self._impute_missing_values(df)
        df = self._create_ratio_features(df)
        df = self._create_categorical_features(df)

        numerical_features = self._get_numerical_features()
        df = self._scale_features(df, numerical_features, fit=False)

        if 'is_bestseller' not in df.columns:
            df['is_bestseller'] = 0

        return df

    def _impute_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        for idx, row in df.iterrows():
            category = row.get('category', 'Unknown')

            if pd.isna(row.get('amazon_rank')) and category in self.category_stats:
                df.at[idx, 'amazon_rank'] = self.category_stats[category]['median_rank']

            if pd.isna(row.get('amazon_rating')) and category in self.category_stats:
                df.at[idx, 'amazon_rating'] = self.category_stats[category]['mean_rating']

            if pd.isna(row.get('amazon_reviews')) and category in self.category_stats:
                df.at[idx, 'amazon_reviews'] = self.category_stats[category]['avg_reviews']

        df['amazon_rank'] = df.get('amazon_rank', pd.Series([10000] * len(df))).fillna(10000)
        df['amazon_rating'] = df.get('amazon_rating', pd.Series([3.5] * len(df))).fillna(3.5)
        df['amazon_reviews'] = df.get('amazon_reviews', pd.Series([0] * len(df))).fillna(0)
        df['no_of_sellers'] = df.get('no_of_sellers', pd.Series([1] * len(df))).fillna(1)

        return df

    def _create_ratio_features(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'category' not in df.columns:
            df['price_vs_category'] = 1.0
        else:
            for category in df['category'].unique():
                cat_mask = df['category'] == category
                cat_avg_price = df.loc[cat_mask, 'price'].mean()
                df.loc[cat_mask, 'price_vs_category'] = df.loc[cat_mask, 'price'] / max(cat_avg_price, 1)

        df['rank_normalized'] = np.log1p(df['amazon_rank'])
        df['reviews_normalized'] = np.log1p(df.get('combined_reviews', df['amazon_reviews']))
        df['sales_normalized'] = np.log1p(df.get('total_units_sold', 0))

        combined_rating = df.get('combined_rating', df.get('amazon_rating', 3.5))
        df['price_per_rating'] = df['price'] / combined_rating.replace(0, 1)

        total_units = df.get('total_units_sold', 1)
        total_revenue = df.get('total_revenue', df['price'])
        df['revenue_per_unit'] = total_revenue / total_units.replace(0, 1)

        combined_reviews = df.get('combined_reviews', df['amazon_reviews'])
        df['rating_to_reviews_ratio'] = combined_rating / combined_reviews.replace(0, 1)
        df['reviews_per_seller'] = df['amazon_reviews'] / df['no_of_sellers'].replace(0, 1)

        sales_velocity = df.get('sales_velocity', 0)
        days_since_last = df.get('days_since_last_sale', 9999)
        df['sales_momentum'] = sales_velocity * np.exp(-days_since_last / 30)
        df['recency_score'] = 1 / (1 + days_since_last / 30)

        days_listed = df.get('days_since_listed', 0)
        df['product_maturity'] = np.minimum(days_listed / 365, 1)

        return df

    def _create_categorical_features(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'category' in df.columns:
            if 'category' not in self.label_encoders:
                self.label_encoders['category'] = LabelEncoder()
                df['category_encoded'] = self.label_encoders['category'].fit_transform(df['category'].fillna('Unknown'))
            else:
                categories = df['category'].fillna('Unknown')
                known_categories = set(self.label_encoders['category'].classes_)
                categories = categories.apply(lambda x: x if x in known_categories else 'Unknown')
                df['category_encoded'] = self.label_encoders['category'].transform(categories)
        else:
            df['category_encoded'] = 0

        product_source = df.get('product_source', 'Platform')
        df['product_source_binary'] = (product_source == 'Seller').astype(int)

        df['price_tier'] = pd.cut(df['price'],
                                  bins=[0, 50, 200, 500, float('inf')],
                                  labels=['Budget', 'Mid', 'Premium', 'Luxury'])

        if 'price_tier' not in self.label_encoders:
            self.label_encoders['price_tier'] = LabelEncoder()
            df['price_tier_encoded'] = self.label_encoders['price_tier'].fit_transform(df['price_tier'].astype(str))
        else:
            df['price_tier_encoded'] = self.label_encoders['price_tier'].transform(df['price_tier'].astype(str))

        return df

    def _create_bestseller_labels(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'amazon_rank' in df.columns and df['amazon_rank'].notna().any():
            rank_threshold = df['amazon_rank'].quantile(0.1)
        else:
            rank_threshold = 1000

        if 'sales_velocity' in df.columns and df['sales_velocity'].notna().any():
            velocity_threshold = df['sales_velocity'].quantile(0.9)
        else:
            velocity_threshold = 1.0

        df['is_bestseller'] = (
                (df['amazon_rank'] <= rank_threshold) |
                (df.get('sales_velocity', 0) >= velocity_threshold)
        ).astype(int)

        max_rank_norm = df['rank_normalized'].max() if df['rank_normalized'].max() > 0 else 1
        max_sales_norm = df['sales_normalized'].max() if df['sales_normalized'].max() > 0 else 1
        max_reviews_norm = df['reviews_normalized'].max() if df['reviews_normalized'].max() > 0 else 1

        df['bestseller_score'] = (
                (1 - df['rank_normalized'] / max_rank_norm) * 0.4 +
                (df['sales_normalized'] / max_sales_norm) * 0.3 +
                (df.get('combined_rating', df['amazon_rating']) / 5.0) * 0.15 +
                (df['reviews_normalized'] / max_reviews_norm) * 0.15
        )

        return df

    def _create_ranking_targets(self, df: pd.DataFrame) -> pd.DataFrame:
        if 'has_sales' in df.columns and df['has_sales'].sum() > 0:
            df_with_sales = df[df['has_sales'] == 1].copy()
            df_with_sales['platform_rank'] = df_with_sales['total_units_sold'].rank(
                ascending=False, method='min'
            ).astype(int)

            df = df.merge(
                df_with_sales[['asin', 'platform_rank']],
                on='asin',
                how='left'
            )

        df['platform_rank'] = df.get('platform_rank', 9999).fillna(9999).astype(int)

        df['combined_rank'] = df.apply(
            lambda x: x.get('platform_rank', 9999) if x.get('has_sales', 0) == 1 else x.get('amazon_rank', 9999),
            axis=1
        )

        return df

    def _get_numerical_features(self) -> List[str]:
        return [
            'price', 'amazon_rating', 'amazon_reviews', 'no_of_sellers',
            'sales_velocity', 'sales_acceleration', 'revenue_per_order',
            'days_since_listed', 'days_since_last_sale', 'combined_reviews',
            'price_vs_category', 'rank_normalized', 'reviews_normalized',
            'sales_normalized', 'price_per_rating', 'revenue_per_unit',
            'rating_to_reviews_ratio', 'reviews_per_seller', 'sales_momentum',
            'recency_score', 'product_maturity', 'total_units_sold',
            'order_count', 'unique_customers'
        ]

    def _scale_features(self, df: pd.DataFrame, features: List[str], fit: bool = False) -> pd.DataFrame:
        for feature in features:
            if feature in df.columns:
                if fit:
                    self.scalers[feature] = StandardScaler()
                    df[f'{feature}_scaled'] = self.scalers[feature].fit_transform(
                        df[[feature]]
                    )
                else:
                    if feature in self.scalers:
                        df[f'{feature}_scaled'] = self.scalers[feature].transform(
                            df[[feature]]
                        )
                    else:
                        df[f'{feature}_scaled'] = df[feature]

        return df

    def _calculate_feature_importance(self, df: pd.DataFrame) -> Dict:
        correlation_features = [
            'price', 'amazon_rating', 'amazon_reviews', 'no_of_sellers',
            'sales_velocity', 'product_source_binary', 'combined_rating',
            'price_vs_category', 'days_since_listed'
        ]

        available_features = [f for f in correlation_features if f in df.columns]

        if 'total_units_sold' in df.columns and len(available_features) > 0:
            correlation_with_sales = df[available_features].corrwith(df['total_units_sold']).abs().sort_values(ascending=False)
            return correlation_with_sales.to_dict()
        else:
            return {}

    def get_feature_vector_for_prediction(self, product_data: Dict) -> np.ndarray:
        df = pd.DataFrame([product_data])
        df = self.transform(df)

        feature_columns = [
            'price_scaled', 'amazon_rating_scaled', 'amazon_reviews_scaled',
            'no_of_sellers_scaled', 'sales_velocity_scaled', 'product_source_binary',
            'category_encoded', 'price_vs_category_scaled', 'combined_rating',
            'days_since_listed_scaled', 'sales_momentum_scaled', 'recency_score_scaled',
            'rank_normalized_scaled', 'reviews_normalized_scaled'
        ]

        available_features = [f for f in feature_columns if f in df.columns]

        return df[available_features].values[0]

    def save(self, filepath: str):
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        with open(filepath, 'wb') as f:
            pickle.dump({
                'category_stats': self.category_stats,
                'scalers': self.scalers,
                'label_encoders': self.label_encoders,
                'feature_names': self.feature_names
            }, f)

    @classmethod
    def load(cls, filepath: str):
        with open(filepath, 'rb') as f:
            data = pickle.load(f)

        engineer = cls(category_stats=data['category_stats'])
        engineer.scalers = data['scalers']
        engineer.label_encoders = data['label_encoders']
        engineer.feature_names = data['feature_names']

        return engineer