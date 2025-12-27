from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from contextlib import contextmanager
import logging
import pandas as pd

from config import settings

logger = logging.getLogger(__name__)

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Session:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


def test_connection() -> bool:
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def query_to_dataframe(query: str) -> pd.DataFrame:
    try:
        with engine.connect() as conn:
            df = pd.read_sql(query, conn)
        return df
    except Exception as e:
        logger.error(f"Query execution failed: {e}")
        return pd.DataFrame()


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
            p.category_id,
            c.name as category_name,
            c.product_count as category_product_count
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.approval_status = 'APPROVED' OR p.approval_status IS NULL
        ORDER BY p.ranking ASC
    """
    return query_to_dataframe(query)


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
            p.discount_percentage,
            p.days_since_listed,
            p.no_of_sellers,
            p.seller_id,
            p.category_id,
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
        WHERE p.approval_status = 'APPROVED' OR p.approval_status IS NULL
    """
    return query_to_dataframe(query)


def save_bestseller_prediction(asin: str, data: dict) -> bool:
    query = text("""
        INSERT INTO bestseller_predictions 
        (product_id, asin, predicted_probability, confidence_level, potential_level, 
         recommendation, prediction_date, accuracy_tracked)
        VALUES (:product_id, :asin, :probability, :confidence_level, :potential_level,
                :recommendation, NOW(), 0)
        ON DUPLICATE KEY UPDATE
            predicted_probability = VALUES(predicted_probability),
            confidence_level = VALUES(confidence_level),
            potential_level = VALUES(potential_level),
            recommendation = VALUES(recommendation),
            prediction_date = NOW()
    """)

    try:
        with engine.begin() as conn:
            conn.execute(query, {
                "product_id": asin,
                "asin": asin,
                "probability": data.get("bestseller_probability"),
                "confidence_level": data.get("confidence_level"),
                "potential_level": data.get("potential_level"),
                "recommendation": data.get("recommendation")
            })
        return True
    except Exception as e:
        logger.error(f"Failed to save bestseller prediction: {e}")
        return False


def save_ranking_prediction(asin: str, data: dict) -> bool:
    query = text("""
        INSERT INTO ranking_trend_predictions
        (product_id, current_rank, predicted_trend, confidence_score, 
         estimated_change, predicted_rank, recommendation, is_experimental, prediction_date)
        VALUES (:product_id, :current_rank, :predicted_trend, :confidence_score,
                :estimated_change, :predicted_rank, :recommendation, 1, NOW())
        ON DUPLICATE KEY UPDATE
            current_rank = VALUES(current_rank),
            predicted_trend = VALUES(predicted_trend),
            confidence_score = VALUES(confidence_score),
            estimated_change = VALUES(estimated_change),
            predicted_rank = VALUES(predicted_rank),
            recommendation = VALUES(recommendation),
            prediction_date = NOW()
    """)

    try:
        with engine.begin() as conn:
            conn.execute(query, {
                "product_id": asin,
                "current_rank": data.get("current_rank"),
                "predicted_trend": data.get("predicted_trend"),
                "confidence_score": data.get("confidence_score"),
                "estimated_change": data.get("estimated_change"),
                "predicted_rank": data.get("predicted_rank"),
                "recommendation": data.get("recommendation")
            })
        return True
    except Exception as e:
        logger.error(f"Failed to save ranking prediction: {e}")
        return False


def save_price_intelligence(asin: str, data: dict) -> bool:
    query = text("""
        INSERT INTO price_intelligence
        (product_id, current_price, recommended_price, price_difference, 
         price_change_percentage, price_action, positioning, 
         category_avg_price, category_min_price, category_max_price,
         analysis_method, should_notify_seller, analysis_date)
        VALUES (:product_id, :current_price, :recommended_price, :price_difference,
                :price_change_percentage, :price_action, :positioning,
                :category_avg_price, :category_min_price, :category_max_price,
                :analysis_method, :should_notify_seller, NOW())
        ON DUPLICATE KEY UPDATE
            current_price = VALUES(current_price),
            recommended_price = VALUES(recommended_price),
            price_difference = VALUES(price_difference),
            price_change_percentage = VALUES(price_change_percentage),
            price_action = VALUES(price_action),
            positioning = VALUES(positioning),
            category_avg_price = VALUES(category_avg_price),
            category_min_price = VALUES(category_min_price),
            category_max_price = VALUES(category_max_price),
            analysis_method = VALUES(analysis_method),
            should_notify_seller = VALUES(should_notify_seller),
            analysis_date = NOW()
    """)

    try:
        with engine.begin() as conn:
            conn.execute(query, {
                "product_id": asin,
                "current_price": data.get("current_price"),
                "recommended_price": data.get("recommended_price"),
                "price_difference": data.get("price_difference"),
                "price_change_percentage": data.get("price_change_percentage"),
                "price_action": data.get("price_action"),
                "positioning": data.get("positioning"),
                "category_avg_price": data.get("category_avg_price"),
                "category_min_price": data.get("category_min_price"),
                "category_max_price": data.get("category_max_price"),
                "analysis_method": data.get("analysis_method", "STATISTICAL"),
                "should_notify_seller": data.get("should_notify_seller", False)
            })
        return True
    except Exception as e:
        logger.error(f"Failed to save price intelligence: {e}")
        return False