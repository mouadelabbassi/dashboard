"""
Training Package for MouadVision ML Service
"""

from training.train_bestseller_v2 import train_model as train_bestseller
from training.train_ranking_trend_model import train_model as train_ranking

__all__ = ['train_bestseller', 'train_ranking']