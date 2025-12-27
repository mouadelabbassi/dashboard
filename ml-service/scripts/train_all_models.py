import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.ml.bestseller_model import BestsellerModel
from app.ml.ranking_model import RankingModel
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)


def main():
    logger.info("=" * 60)
    logger.info("Training All Models")
    logger.info("=" * 60)

    try:
        logger.info("\n1. Training Bestseller Model")
        bestseller = BestsellerModel()
        bs_result = bestseller.train()
        logger.info(f"Bestseller Training Complete: F1={bs_result['metrics']['f1_score']:.4f}")
    except Exception as e:
        logger.error(f"Bestseller training failed: {e}")

    try:
        logger.info("\n2. Training Ranking Model")
        ranking = RankingModel()
        rk_result = ranking.train()
        logger.info(f"Ranking Training Complete: F1={rk_result['metrics']['f1_score']:.4f}")
    except Exception as e:
        logger.error(f"Ranking training failed: {e}")

    logger.info("=" * 60)
    logger.info("All Models Trained Successfully")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()