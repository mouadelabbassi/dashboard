import pymysql
import pandas as pd
import logging
from contextlib import contextmanager
from config import DATABASE_CONFIG, DATABASE_URL

logger = logging.getLogger(__name__)

class DatabaseManager:

    def __init__(self):
        self.config = DATABASE_CONFIG

    @contextmanager
    def get_connection(self):
        connection = None
        try:
            connection = pymysql.connect(
                host=self.config['host'],
                port=self.config['port'],
                user=self.config['user'],
                password=self.config['password'],
                database=self.config['database'],
                charset=self.config['charset'],
                cursorclass=pymysql.cursors.DictCursor
            )
            yield connection
        except Exception as e:
            logger.error(f"Database connection error: {e}")
            raise
        finally:
            if connection:
                connection.close()

    def execute_query(self, query: str, params: tuple = None) -> list:
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                return cursor.fetchall()

    def execute_update(self, query: str, params: tuple = None) -> int:
        with self.get_connection() as conn:
            with conn.cursor() as cursor:
                affected = cursor.execute(query, params)
                conn.commit()
                return affected

    def query_to_dataframe(self, query: str, params: tuple = None) -> pd.DataFrame:
        """Execute query and return results as pandas DataFrame"""
        with self.get_connection() as conn:
            return pd.read_sql(query, conn, params=params)


# Global database instance
db = DatabaseManager()


def get_products_for_training() -> pd.DataFrame:
    query = """
            SELECT
                p.asin,
                p.product_name,
                p.price,
                p.rating,
                p.reviews_count,
                p.ranking,
                p.sales_count,
                p.is_bestseller,
                p.stock_quantity,
                p.discount_percentage,
                p.days_since_listed,
                p.no_of_sellers,
                p.seller_id,
                p.created_at,
                c.id as category_id,
                c.name as category_name,
                c.product_count as category_product_count
            FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.approval_status = 'APPROVED' OR p.approval_status IS NULL
            ORDER BY p.ranking ASC NULLS LAST \
            """

    try:
        df = db.query_to_dataframe(query)
        logger.info(f"Loaded {len(df)} products for training")
        return df
    except Exception as e:
        logger.error(f"Error loading products: {e}")
        return pd.DataFrame()


def get_products_with_category_stats() -> pd.DataFrame:

    query = """
            SELECT
                p.asin,
                p.product_name,
                p.price,
                p.rating,
                p.reviews_count,
                p.ranking,
                p.sales_count,
                p.is_bestseller,
                p.stock_quantity,
                p.seller_id,
                c.name as category_name,
                cat_stats.avg_price as category_avg_price,
                cat_stats.min_price as category_min_price,
                cat_stats.max_price as category_max_price,
                cat_stats.avg_rating as category_avg_rating,
                cat_stats.avg_reviews as category_avg_reviews,
                cat_stats.product_count as category_product_count
            FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
                     LEFT JOIN (
                SELECT
                    category_id,
                    AVG(price) as avg_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    AVG(rating) as avg_rating,
                    AVG(reviews_count) as avg_reviews,
                    COUNT(*) as product_count
                FROM products
                WHERE approval_status = 'APPROVED' OR approval_status IS NULL
                GROUP BY category_id
            ) cat_stats ON p.category_id = cat_stats.category_id
            WHERE p.approval_status = 'APPROVED' OR p.approval_status IS NULL \
            """

    try:
        df = db.query_to_dataframe(query)
        logger.info(f"Loaded {len(df)} products with category stats")
        return df
    except Exception as e:
        logger.error(f"Error loading products with stats: {e}")
        return pd.DataFrame()


def get_category_price_stats(category_id: int = None) -> dict:
    if category_id:
        query = """
                SELECT
                    AVG(price) as avg_price,
                    MIN(price) as min_price,
                    MAX(price) as max_price,
                    STDDEV(price) as std_price,
                    COUNT(*) as product_count
                FROM products
                WHERE category_id = %s AND (approval_status = 'APPROVED' OR approval_status IS NULL) \
                """
        results = db.execute_query(query, (category_id,))
    else:
        query = """
                SELECT
                    c.id as category_id,
                    c.name as category_name,
                    AVG(p.price) as avg_price,
                    MIN(p.price) as min_price,
                    MAX(p.price) as max_price,
                    STDDEV(p.price) as std_price,
                    COUNT(*) as product_count
                FROM products p
                         JOIN categories c ON p.category_id = c.id
                WHERE p.approval_status = 'APPROVED' OR p.approval_status IS NULL
                GROUP BY c.id, c.name \
                """
        results = db.execute_query(query)

    return results[0] if category_id and results else results


def save_prediction_to_db(prediction_data: dict, table: str = 'bestseller_predictions'):
    if table == 'bestseller_predictions':
        query = """
                INSERT INTO bestseller_predictions
                (product_id, asin, predicted_probability, confidence_level, prediction_date, created_at)
                VALUES (
                               (SELECT asin FROM products WHERE asin = %s),
                               %s, %s, %s, NOW(), NOW()
                       )
                    ON DUPLICATE KEY UPDATE
                                         predicted_probability = VALUES(predicted_probability),
                                         confidence_level = VALUES(confidence_level),
                                         prediction_date = NOW() \
                """
        params = (
            prediction_data.get('asin'),
            prediction_data.get('asin'),
            prediction_data.get('probability'),
            prediction_data.get('confidence_level')
        )
    elif table == 'ranking_trend_predictions':
        query = """
                INSERT INTO ranking_trend_predictions
                (product_id, current_rank, predicted_trend, confidence_score, estimated_change, prediction_date)
                VALUES (
                               (SELECT asin FROM products WHERE asin = %s),
                               %s, %s, %s, %s, NOW()
                       )
                    ON DUPLICATE KEY UPDATE
                                         current_rank = VALUES(current_rank),
                                         predicted_trend = VALUES(predicted_trend),
                                         confidence_score = VALUES(confidence_score),
                                         estimated_change = VALUES(estimated_change),
                                         prediction_date = NOW() \
                """
        params = (
            prediction_data.get('asin'),
            prediction_data.get('current_rank'),
            prediction_data.get('trend'),
            prediction_data.get('confidence'),
            prediction_data.get('estimated_change')
        )
    else:
        logger.error(f"Unknown table: {table}")
        return 0

    try:
        return db.execute_update(query, params)
    except Exception as e:
        logger.error(f"Error saving prediction: {e}")
        return 0


def get_seller_products(seller_id: int) -> pd.DataFrame:
    """Get all products for a specific seller"""
    query = """
            SELECT
                p.asin,
                p.product_name,
                p.price,
                p.rating,
                p.reviews_count,
                p.ranking,
                p.sales_count,
                p.is_bestseller,
                p.stock_quantity,
                c.name as category_name,
                c.id as category_id
            FROM products p
                     LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.seller_id = %s AND (p.approval_status = 'APPROVED' OR p.approval_status IS NULL) \
            """
    return db.query_to_dataframe(query, (seller_id,))


def test_connection() -> bool:
    """Test database connection"""
    try:
        with db.get_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                return True
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        return False


if __name__ == '__main__':
    # Test the database connection
    print("Testing database connection...")
    if test_connection():
        print("✅ Connection successful!")

        # Test loading products
        df = get_products_for_training()
        print(f"✅ Loaded {len(df)} products")
        print(f"Columns: {df.columns.tolist()}")

        # Test category stats
        stats = get_category_price_stats()
        print(f"✅ Category stats: {len(stats)} categories")
    else:
        print("❌ Connection failed!")