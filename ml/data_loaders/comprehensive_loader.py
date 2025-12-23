import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Tuple
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.db_config import DatabaseConfig

class ComprehensiveDataLoader:

    def __init__(self):
        self.db = DatabaseConfig()

    def load_all_data(self) -> pd.DataFrame:
        products_df = self._load_products()
        sales_df = self._load_sales_data()
        reviews_df = self._load_reviews_data()

        df = products_df.merge(sales_df, on='asin', how='left')
        df = df.merge(reviews_df, on='asin', how='left')

        df = self._engineer_temporal_features(df)
        df = self._calculate_derived_metrics(df)

        return df

    def _load_products(self) -> pd.DataFrame:
        query = """
                SELECT
                    p.asin,
                    p.product_name as title,
                    p.price,
                    p.rating as amazon_rating,
                    p.reviews_count as amazon_reviews,
                    p.ranking as amazon_rank,
                    p.no_of_sellers,
                    p.sales_count,
                    p.stock_quantity,
                    p.is_bestseller as amazon_bestseller,
                    p.image_url,
                    p.created_at,
                    p.updated_at,
                    c.name as category,
                    CASE WHEN p.seller_id IS NULL THEN 'Platform' ELSE 'Seller' END as product_source,
                    COALESCE(u.full_name, 'Platform') as seller_name
                FROM products p
                         LEFT JOIN categories c ON p.category_id = c.id
                         LEFT JOIN users u ON p.seller_id = u.id AND u.role = 'SELLER' \
                """
        return self.db.execute_query_df(query)

    def _load_sales_data(self) -> pd.DataFrame:
        query = """
                SELECT
                    p.asin,
                    COUNT(DISTINCT o.id) as order_count,
                    SUM(oi.quantity) as total_units_sold,
                    SUM(oi.subtotal) as total_revenue,
                    AVG(oi.unit_price) as avg_selling_price,
                    MIN(o.order_date) as first_sale_date,
                    MAX(o.order_date) as last_sale_date,
                    COUNT(DISTINCT o.user_id) as unique_customers
                FROM products p
                         LEFT JOIN order_items oi ON p.asin = oi.product_asin
                         LEFT JOIN orders o ON oi.order_id = o.id
                WHERE o.status NOT IN ('CANCELLED', 'REFUNDED')
                GROUP BY p.asin \
                """
        return self.db.execute_query_df(query)

    def _load_reviews_data(self) -> pd.DataFrame:
        query = """
                SELECT
                    product_asin as asin,
                    COUNT(*) as platform_review_count,
                    AVG(rating) as platform_rating,
                    SUM(helpful_count) as total_helpful_votes,
                    MAX(created_at) as last_review_date
                FROM product_reviews
                GROUP BY product_asin \
                """
        return self.db.execute_query_df(query)

    def _engineer_temporal_features(self, df: pd.DataFrame) -> pd.DataFrame:
        now = datetime.now()

        df['created_at'] = pd.to_datetime(df['created_at'])
        df['first_sale_date'] = pd.to_datetime(df['first_sale_date'])
        df['last_sale_date'] = pd.to_datetime(df['last_sale_date'])
        df['last_review_date'] = pd.to_datetime(df['last_review_date'])

        df['days_since_listed'] = (now - df['created_at']).dt.days
        df['days_since_first_sale'] = (now - df['first_sale_date']).dt.days
        df['days_since_last_sale'] = (now - df['last_sale_date']).dt.days
        df['days_with_sales'] = (df['last_sale_date'] - df['first_sale_date']).dt.days

        df['days_since_listed'] = df['days_since_listed'].fillna(0)
        df['days_since_first_sale'] = df['days_since_first_sale'].fillna(9999)
        df['days_since_last_sale'] = df['days_since_last_sale'].fillna(9999)
        df['days_with_sales'] = df['days_with_sales'].fillna(0)

        return df

    def _calculate_derived_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        df['total_units_sold'] = df['total_units_sold'].fillna(0)
        df['order_count'] = df['order_count'].fillna(0)
        df['total_revenue'] = df['total_revenue'].fillna(0)
        df['unique_customers'] = df['unique_customers'].fillna(0)
        df['platform_review_count'] = df['platform_review_count'].fillna(0)
        df['total_helpful_votes'] = df['total_helpful_votes'].fillna(0)

        df['sales_velocity'] = df.apply(
            lambda x: x['total_units_sold'] / max(x['days_since_listed'], 1), axis=1
        )

        df['sales_acceleration'] = df.apply(
            lambda x: (x['total_units_sold'] / max(x['days_with_sales'], 1))
            if x['days_with_sales'] > 0 else 0,
            axis=1
        )

        df['revenue_per_order'] = df.apply(
            lambda x: x['total_revenue'] / x['order_count'] if x['order_count'] > 0 else 0,
            axis=1
        )

        df['repeat_customer_rate'] = df.apply(
            lambda x: x['unique_customers'] / x['order_count'] if x['order_count'] > 0 else 0,
            axis=1
        )

        df['combined_rating'] = df.apply(
            lambda x: x['platform_rating'] if pd.notna(x['platform_rating'])
            else x['amazon_rating'] if pd.notna(x['amazon_rating']) else 0,
            axis=1
        )

        df['combined_reviews'] = df['platform_review_count'] + df['amazon_reviews'].fillna(0)

        df['has_sales'] = (df['total_units_sold'] > 0).astype(int)
        df['has_amazon_data'] = df['amazon_rank'].notna().astype(int)
        df['is_active'] = (df['days_since_last_sale'] < 7).astype(int)

        return df

    def get_category_statistics(self, df: pd.DataFrame) -> Dict[str, Dict]:
        stats = {}
        for category in df['category'].unique():
            cat_data = df[df['category'] == category]
            stats[category] = {
                'median_rank': cat_data['amazon_rank'].median(),
                'mean_rating': cat_data['combined_rating'].mean(),
                'mean_price': cat_data['price'].mean(),
                'mean_velocity': cat_data['sales_velocity'].mean(),
                'product_count': len(cat_data),
                'avg_reviews': cat_data['combined_reviews'].mean()
            }
        return stats

    def save_to_csv(self, df: pd.DataFrame, filename: str = 'comprehensive_data.csv'):
        output_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            'data',
            filename
        )
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        df.to_csv(output_path, index=False)
        return output_path