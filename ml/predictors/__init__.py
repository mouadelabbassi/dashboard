"""
Predictors Package for MouadVision ML Service
"""

from predictors.bestseller_predictor import BestsellerPredictor, get_predictor as get_bestseller_predictor
from predictors.ranking_trend_predictor import RankingTrendPredictor, get_predictor as get_ranking_predictor

__all__ = [
    'BestsellerPredictor',
    'RankingTrendPredictor',
    'get_bestseller_predictor',
    'get_ranking_predictor'
]