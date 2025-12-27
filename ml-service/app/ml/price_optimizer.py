import logging
import numpy as np

logger = logging.getLogger(__name__)


class PriceOptimizer:
    """
    INTELLIGENT Price Optimization

    Logic:
    - High-rated products can charge premium (+10-20%)
    - Low-rated products must discount (-15-25%)
    - Consider competitive window (±30% of similar products)
    - Sales velocity affects pricing power
    - Stock scarcity = price increase opportunity
    """

    @staticmethod
    def analyze(product_data: dict) -> dict:
        logger.info(f"Analyzing price intelligently for {product_data.get('asin')}")

        # Get product metrics
        current_price = float(product_data.get('price', 0))
        rating = float(product_data.get('rating', 3.0))
        reviews_count = int(product_data.get('reviews_count', 0))
        sales_count = int(product_data.get('sales_count', 0))
        stock_quantity = int(product_data.get('stock_quantity', 100))

        # Get category benchmarks
        category_avg = float(product_data.get('category_avg_price', current_price))
        category_min = float(product_data.get('category_min_price', current_price * 0.7))
        category_max = float(product_data.get('category_max_price', current_price * 1.5))

        # Prevent extreme values
        if category_max > current_price * 3:
            category_max = current_price * 2
        if category_min < current_price * 0.3:
            category_min = current_price * 0.5

        # INTELLIGENT PRICING LOGIC
        recommended_price = current_price  # Start with current

        # Factor 1: RATING IMPACT (Most important!)
        if rating >= 4.5:
            # Excellent rating = can charge 10-15% premium
            recommended_price *= 1.12
        elif rating >= 4.0:
            # Good rating = slight premium 5-8%
            recommended_price *= 1.06
        elif rating >= 3.5:
            # Average = maintain price
            recommended_price *= 1.0
        elif rating >= 3.0:
            # Below average = small discount 8-12%
            recommended_price *= 0.90
        else:
            # Poor rating = significant discount 15-20%
            recommended_price *= 0.82

        # Factor 2: POPULARITY (Reviews as social proof)
        if reviews_count > 1000:
            recommended_price *= 1.05  # High popularity = +5%
        elif reviews_count > 500:
            recommended_price *= 1.03  # Good popularity = +3%
        elif reviews_count < 20:
            recommended_price *= 0.97  # Low trust = -3%

        # Factor 3: SALES VELOCITY
        if sales_count > 200:
            # Hot seller = can increase price
            recommended_price *= 1.05
        elif sales_count > 100:
            # Good sales = maintain premium
            recommended_price *= 1.02
        elif sales_count < 10:
            # Slow mover = discount to stimulate
            recommended_price *= 0.95

        # Factor 4: STOCK SCARCITY
        if stock_quantity > 0 and stock_quantity < 20:
            # Low stock = scarcity premium
            recommended_price *= 1.08
        elif stock_quantity == 0:
            # Out of stock = no price recommendation
            recommended_price = current_price
        elif stock_quantity > 500:
            # Overstocked = discount to move inventory
            recommended_price *= 0.95

        # Factor 5: COMPETITIVE POSITIONING
        # Stay within 70-130% of category average
        if recommended_price > category_avg * 1.3:
            recommended_price = category_avg * 1.3
        elif recommended_price < category_avg * 0.7:
            recommended_price = category_avg * 0.7

        # Ensure reasonable bounds
        recommended_price = max(category_min, min(category_max, recommended_price))

        # Round to realistic price point
        if recommended_price < 10:
            recommended_price = round(recommended_price, 2)
        elif recommended_price < 100:
            recommended_price = round(recommended_price * 2) / 2  # Round to $.50
        else:
            recommended_price = round(recommended_price)

        # Calculate metrics
        price_diff = recommended_price - current_price
        price_change_pct = (price_diff / current_price * 100) if current_price > 0 else 0

        # Determine action
        if abs(price_change_pct) < 3:
            action = "MAINTAIN"
            action_desc = "Prix optimal - maintenir"
        elif price_change_pct > 0:
            action = "INCREASE"
            if price_change_pct > 15:
                action_desc = f"Augmenter de {abs(price_change_pct):.1f}% (forte demande)"
            else:
                action_desc = f"Augmenter de {abs(price_change_pct):.1f}%"
        else:
            action = "DECREASE"
            if abs(price_change_pct) > 15:
                action_desc = f"Réduire de {abs(price_change_pct):.1f}% (stimuler ventes)"
            else:
                action_desc = f"Réduire de {abs(price_change_pct):.1f}%"

        # Positioning based on category comparison
        price_range = category_max - category_min
        if price_range > 0:
            percentile = ((recommended_price - category_min) / price_range) * 100
        else:
            percentile = 50

        if percentile < 20:
            positioning = 'BUDGET'
        elif percentile < 45:
            positioning = 'VALUE'
        elif percentile < 70:
            positioning = 'MID_RANGE'
        elif percentile < 85:
            positioning = 'PREMIUM'
        else:
            positioning = 'LUXURY'

        should_notify = abs(price_change_pct) > 10

        return {
            'current_price': round(current_price, 2),
            'recommended_price': round(recommended_price, 2),
            'price_difference': round(price_diff, 2),
            'price_change_percentage': round(price_change_pct, 2),
            'price_action': action,
            'positioning': positioning,
            'category_avg_price': round(category_avg, 2),
            'category_min_price': round(category_min, 2),
            'category_max_price': round(category_max, 2),
            'analysis_method': 'INTELLIGENT_ML',
            'should_notify_seller': should_notify
        }