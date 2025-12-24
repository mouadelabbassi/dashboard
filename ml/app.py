from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import json
import pandas as pd
from datetime import datetime
import os
import sys
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from feature_engineering.hybrid_features import HybridFeatureEngineer
from utils.db_config import DatabaseConfig

app = Flask(__name__)
CORS(app)

def map_spring_boot_to_ml_format(data: dict) -> dict:
    """Map Spring Boot column names to ML expected format"""
    mapping = {
        'productId': 'asin',
        'currentPrice': 'price',
        'rating': 'amazon_rating',
        'reviewCount': 'amazon_reviews',
        'currentRanking': 'amazon_rank',
        'salesCount': 'total_units_sold',
        'stockQuantity': 'stock_quantity',
        'daysSinceListed': 'days_since_listed',
        'sellerRating': 'combined_rating',
        'category': 'category'
    }

    mapped_data = {}
    for spring_key, ml_key in mapping.items():
        if spring_key in data:
            mapped_data[ml_key] = data[spring_key]

    # Add default values for missing fields
    mapped_data.setdefault('no_of_sellers', 1)
    mapped_data.setdefault('product_source', 'Platform')
    mapped_data.setdefault('has_sales', 1 if mapped_data.get('total_units_sold', 0) > 0 else 0)
    mapped_data.setdefault('has_amazon_data', 1 if mapped_data.get('amazon_rank') else 0)
    mapped_data.setdefault('sales_velocity',
                           float(mapped_data.get('total_units_sold', 0)) / max(float(mapped_data.get('days_since_listed', 1)), 1))

    # Add missing fields with defaults
    mapped_data.setdefault('days_since_last_sale', 9999)
    mapped_data.setdefault('combined_reviews', mapped_data.get('amazon_reviews', 0))
    mapped_data.setdefault('total_revenue', mapped_data.get('price', 0) * mapped_data.get('total_units_sold', 0))
    mapped_data.setdefault('order_count', 0)
    mapped_data.setdefault('unique_customers', 0)
    mapped_data.setdefault('sales_acceleration', 0)
    mapped_data.setdefault('revenue_per_order', 0)

    # Ensure numeric types
    if 'price' in mapped_data:
        mapped_data['price'] = float(mapped_data['price'])
    if 'amazon_rating' in mapped_data:
        mapped_data['amazon_rating'] = float(mapped_data['amazon_rating']) if mapped_data['amazon_rating'] else 3.5
    if 'amazon_reviews' in mapped_data:
        mapped_data['amazon_reviews'] = int(mapped_data['amazon_reviews']) if mapped_data['amazon_reviews'] else 0
    if 'amazon_rank' in mapped_data:
        mapped_data['amazon_rank'] = int(mapped_data['amazon_rank']) if mapped_data['amazon_rank'] else 9999

    return mapped_data

class MLPredictionService:

    def __init__(self, models_dir='models'):
        self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), models_dir)
        self.models = {}
        self.features = {}
        self.metrics = {}
        self.feature_engineer = None
        self.db = DatabaseConfig()
        self.load_all_models()

    def load_all_models(self):
        try:
            model_types = ['bestseller_detection', 'ranking_prediction', 'price_optimization']

            for model_type in model_types:
                model_path = os.path.join(self.models_dir, model_type, 'model.pkl')
                features_path = os.path.join(self.models_dir, model_type, 'features.json')

                with open(model_path, 'rb') as f:
                    self.models[model_type] = pickle.load(f)

                with open(features_path, 'r') as f:
                    self.features[model_type] = json.load(f)

            metrics_path = os.path.join(self.models_dir, 'metrics.json')
            with open(metrics_path, 'r') as f:
                self.metrics = json.load(f)

            feature_engineer_path = os.path.join(self.models_dir, 'feature_engineer.pkl')
            self.feature_engineer = HybridFeatureEngineer.load(feature_engineer_path)

            print("✓ All models loaded successfully")
            print(f"  - Bestseller Detection: {self.metrics['bestseller_detection']['accuracy']:.2%} accuracy")
            print(f"  - Ranking Prediction: {self.metrics['ranking_prediction']['r2_score']:.3f} R²")
            print(f"  - Price Optimization: {self.metrics['price_optimization']['mape']:.2f}% MAPE")

        except Exception as e:
            print(f"✗ Error loading models: {str(e)}")
            raise

    def get_product_data(self, asin: str) -> dict:
        query = """
                SELECT
                    p.asin,
                    p.price,
                    p.rating as amazon_rating,
                    p.reviews_count as amazon_reviews,
                    p.ranking as amazon_rank,
                    p.no_of_sellers,
                    p.sales_count,
                    p.stock_quantity,
                    p.created_at,
                    c.name as category,
                    CASE WHEN p.seller_id IS NULL THEN 'Platform' ELSE 'Seller' END as product_source,
                    COALESCE(
                            (SELECT SUM(oi.quantity)
                             FROM order_items oi
                                      JOIN orders o ON oi.order_id = o.id
                             WHERE oi.product_asin = p.asin
                               AND o.status NOT IN ('CANCELLED', 'REFUNDED')),
                            0
                    ) as total_units_sold,
                    COALESCE(
                            (SELECT COUNT(DISTINCT o.id)
                             FROM order_items oi
                                      JOIN orders o ON oi.order_id = o.id
                             WHERE oi.product_asin = p.asin
                               AND o.status NOT IN ('CANCELLED', 'REFUNDED')),
                            0
                    ) as order_count,
                    COALESCE(
                            (SELECT AVG(rating)
                             FROM product_reviews
                             WHERE product_asin = p.asin),
                            p.rating
                    ) as combined_rating,
                    COALESCE(
                            (SELECT COUNT(*)
                             FROM product_reviews
                             WHERE product_asin = p.asin),
                            0
                    ) + COALESCE(p.reviews_count, 0) as combined_reviews,
                    DATEDIFF(NOW(), p.created_at) as days_since_listed
                FROM products p
                         LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.asin = %s
                """

        results = self.db.execute_query(query, (asin,))
        if not results:
            return None

        columns = [
            'asin', 'price', 'amazon_rating', 'amazon_reviews', 'amazon_rank',
            'no_of_sellers', 'sales_count', 'stock_quantity', 'created_at',
            'category', 'product_source', 'total_units_sold', 'order_count',
            'combined_rating', 'combined_reviews', 'days_since_listed'
        ]

        product = dict(zip(columns, results[0]))

        product['sales_velocity'] = float(product['total_units_sold']) / max(float(product['days_since_listed']), 1)
        product['has_sales'] = 1 if product['total_units_sold'] > 0 else 0
        product['has_amazon_data'] = 1 if product['amazon_rank'] is not None else 0

        # Add missing fields with safe defaults
        product['days_since_last_sale'] = 9999
        product['total_revenue'] = float(product.get('price', 0)) * float(product.get('total_units_sold', 0))
        product['unique_customers'] = 0
        product['sales_acceleration'] = 0
        product['revenue_per_order'] = 0

        # Ensure numeric types
        product['price'] = float(product['price']) if product['price'] is not None else 0.0
        product['amazon_rating'] = float(product['amazon_rating']) if product['amazon_rating'] is not None else 3.5
        product['amazon_reviews'] = int(product['amazon_reviews']) if product['amazon_reviews'] is not None else 0
        product['amazon_rank'] = int(product['amazon_rank']) if product['amazon_rank'] is not None else 9999
        product['no_of_sellers'] = int(product['no_of_sellers']) if product['no_of_sellers'] is not None else 1
        product['days_since_listed'] = int(product['days_since_listed']) if product['days_since_listed'] is not None else 0

        return product

    def predict_bestseller(self, product_data: dict) -> dict:
        """✅ FIXED: Properly handle bestseller_score from transformed DataFrame"""
        df = pd.DataFrame([product_data])
        df = self.feature_engineer.transform(df)

        features = self.features['bestseller_detection']
        X = df[features]

        prediction = self.models['bestseller_detection'].predict(X)[0]
        probability = self.models['bestseller_detection'].predict_proba(X)[0]

        bestseller_probability = float(probability[1])
        bestseller_score = float(df['bestseller_score'].iloc[0]) if 'bestseller_score' in df.columns else bestseller_probability

        if bestseller_probability >= 0.80:
            potential_level = "TRÈS ÉLEVÉ"
            confidence = "TRÈS ÉLEVÉ"
        elif bestseller_probability >= 0.60:
            potential_level = "ÉLEVÉ"
            confidence = "ÉLEVÉ"
        elif bestseller_probability >= 0.40:
            potential_level = "MODÉRÉ"
            confidence = "MODÉRÉ"
        else:
            potential_level = "FAIBLE"
            confidence = "FAIBLE"

        recommendation = self._get_bestseller_recommendation(bestseller_probability)

        return {
            'isPotentialBestseller': bool(prediction),
            'bestsellerProbability': round(bestseller_probability, 4),
            'bestsellerScore': round(bestseller_score, 4),
            'potentialLevel': potential_level,
            'confidence': round(bestseller_probability, 4),
            'recommendation': recommendation
        }

    def _get_bestseller_recommendation(self, probability: float) -> str:
        if probability >= 0.80:
            return "Excellent potentiel! Augmentez la visibilité marketing et optimisez le stock."
        elif probability >= 0.60:
            return "Bon potentiel. Considérez des promotions ciblées pour maximiser les ventes."
        elif probability >= 0.40:
            return "Potentiel modéré. Analysez les avis clients pour améliorer le produit."
        else:
            return "Potentiel faible. Réévaluez le positionnement prix et la stratégie marketing."

    def predict_ranking(self, product_data: dict) -> dict:
        df = pd.DataFrame([product_data])
        df = self.feature_engineer.transform(df)

        features = self.features['ranking_prediction']
        X = df[features]

        # ✅ Check if model uses log transform
        uses_log = self.models['ranking_prediction'].get('uses_log_transform', False)

        if uses_log:
            # Predict in log space, then convert back
            predicted_log = float(self.models['ranking_prediction']['model'].predict(X)[0])
            predicted_rank = int(np.expm1(predicted_log))
        else:
            predicted_rank = int(self.models['ranking_prediction']['model'].predict(X)[0])

        # Ensure predicted rank is valid
        predicted_rank = max(1, min(predicted_rank, 999999))

        # Get current rank
        current_rank = product_data.get('amazon_rank')
        if current_rank is None or current_rank == 0:
            current_rank = product_data.get('combined_rank', 9999)

        current_rank = int(current_rank)

        # Calculate ranking change (positive = improvement)
        ranking_change = current_rank - predicted_rank

        # ✅ IMPROVED: More nuanced trend classification
        if ranking_change > 500:
            trend = "AMÉLIORATION"
            trend_description = "🚀 Forte amélioration prévue"
            confidence_boost = 0.1
        elif ranking_change > 100:
            trend = "AMÉLIORATION"
            trend_description = "📈 Amélioration significative prévue"
            confidence_boost = 0.05
        elif ranking_change > 20:
            trend = "STABLE_POSITIF"
            trend_description = "📊 Légère amélioration prévue"
            confidence_boost = 0
        elif ranking_change > -20:
            trend = "STABLE"
            trend_description = "✅ Classement stable"
            confidence_boost = 0.05  # We're more confident about stability
        elif ranking_change > -100:
            trend = "STABLE_NEGATIF"
            trend_description = "📊 Légère baisse prévue"
            confidence_boost = 0
        elif ranking_change > -500:
            trend = "DÉCLIN"
            trend_description = "📉 Déclin modéré prévu"
            confidence_boost = 0.05
        else:
            trend = "DÉCLIN"
            trend_description = "⚠️ Déclin important prévu"
            confidence_boost = 0.1

        # ✅ IMPROVED: Confidence based on trend accuracy
        trend_accuracy = self.metrics['ranking_prediction'].get('trend_accuracy', 0.5)
        mae = self.metrics['ranking_prediction']['mae']

        # Base confidence on trend accuracy (more important than exact position)
        confidence = trend_accuracy + confidence_boost

        # Reduce confidence for extreme predictions
        if abs(ranking_change) > 1000:
            confidence *= 0.8

        return {
            'predictedRanking': predicted_rank,
            'currentRanking': current_rank,
            'rankingChange': ranking_change,
            'trend': trend,
            'trendDescription': trend_description,
            'confidence': round(min(confidence, 0.95), 4),  # Cap at 95%
            'trendAccuracy': round(trend_accuracy, 4)  # ✅ NEW: Show trend accuracy
        }

    def predict_price(self, product_data: dict) -> dict:
        df = pd.DataFrame([product_data])
        df = self.feature_engineer.transform(df)

        features = self.features['price_optimization']
        X = df[features]

        recommended_price = float(self.models['price_optimization']['model'].predict(X)[0])
        current_price = float(product_data['price'])

        # ✅ Check model reliability
        training_samples = self.models['price_optimization'].get('training_samples', 0)
        is_reliable = training_samples >= 50
        mape = self.metrics['price_optimization']['mape']

        price_difference = recommended_price - current_price
        price_change_percentage = (price_difference / current_price) * 100

        # ✅ IMPROVED: More conservative actions if model is unreliable
        if not is_reliable:
            # Limit recommendations to ±15% when unreliable
            if abs(price_change_percentage) > 15:
                recommended_price = current_price * (1 + 0.15 * np.sign(price_change_percentage))
                price_difference = recommended_price - current_price
                price_change_percentage = (price_difference / current_price) * 100

        if abs(price_change_percentage) < 5:
            price_action = "MAINTENIR"
            action_description = "Le prix actuel est optimal"
            should_notify = False
        elif price_change_percentage > 0:
            price_action = "AUGMENTER"
            action_description = f"Augmentation de {abs(price_change_percentage):.1f}% recommandée"
            should_notify = abs(price_change_percentage) > 15 and is_reliable
        else:
            price_action = "DIMINUER"
            action_description = f"Réduction de {abs(price_change_percentage):.1f}% recommandée"
            should_notify = abs(price_change_percentage) > 15 and is_reliable

        # ✅ IMPROVED: Confidence based on model reliability
        if is_reliable:
            confidence = max(0, min(1, 1 - (mape / 100)))
        else:
            confidence = 0.3  # Low confidence for unreliable models

        return {
            'currentPrice': round(current_price, 2),
            'recommendedPrice': round(recommended_price, 2),
            'priceDifference': round(price_difference, 2),
            'priceChangePercentage': round(price_change_percentage, 2),
            'priceAction': price_action,
            'actionDescription': action_description,
            'shouldNotifySeller': should_notify and is_reliable,  # ✅ Only notify if reliable
            'confidence': round(confidence, 4),
            'isReliable': is_reliable,  # ✅ NEW
            'modelMAPE': round(mape, 2),  # ✅ NEW
            'trainingSamples': training_samples  # ✅ NEW
        }

    def predict_full(self, product_data: dict) -> dict:
        try:

            required_fields = ['price', 'amazon_rating', 'amazon_reviews']
            missing = [f for f in required_fields if f not in product_data or product_data[f] is None]
            if missing:
                raise ValueError(f"Missing required fields: {missing}")
            bestseller_pred = self.predict_bestseller(product_data)
            ranking_pred = self.predict_ranking(product_data)
            price_pred = self.predict_price(product_data)

            return {
                'productAsin': product_data.get('asin', product_data.get('productId', 'unknown')),
                'bestseller': bestseller_pred,
                'ranking': ranking_pred,
                'price': price_pred,
                'generatedAt': datetime.now().isoformat(),
                'modelVersion': '1.0.0'
            }
        except Exception as e:
            print(f"Error in predict_full: {str(e)}")
            traceback.print_exc()
            raise

ml_service = MLPredictionService()

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(ml_service.models),
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# ✅ NEW: Added missing /status endpoint
@app.route('/status', methods=['GET'])
def get_status():
    return jsonify({
        'status': 'operational',
        'service': 'MouadVision ML Prediction Service',
        'models': {
            'bestseller_detection': 'loaded',
            'ranking_prediction': 'loaded',
            'price_optimization': 'loaded'
        },
        'models_count': len(ml_service.models),
        'database': 'connected',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/metrics', methods=['GET'])
def get_metrics():
    return jsonify({
        'metrics': ml_service.metrics,
        'models': list(ml_service.models.keys()),
        'timestamp': datetime.now().isoformat()
    })

@app.route('/predict/full', methods=['POST'])
def predict_full():
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No data provided'}), 400

        if 'asin' in data:
            product_data = ml_service.get_product_data(data['asin'])
            if not product_data:
                return jsonify({'error': 'Product not found'}), 404
        else:
            product_data = map_spring_boot_to_ml_format(data)

        prediction = ml_service.predict_full(product_data)

        return jsonify(prediction), 200

    except Exception as e:
        print(f"Error in predict_full endpoint: {str(e)}")
        traceback.print_exc()
        return jsonify({
            'error': 'Prediction failed',
            'message': str(e)
        }), 500

@app.route('/predict/batch', methods=['POST'])
def predict_batch():
    try:
        data = request.get_json()
        asins = data.get('asins', [])

        if not asins:
            return jsonify({'error': 'No ASINs provided'}), 400

        predictions = []
        errors = []

        for asin in asins:
            try:
                product_data = ml_service.get_product_data(asin)
                if product_data:
                    prediction = ml_service.predict_full(product_data)
                    predictions.append(prediction)
                else:
                    errors.append({'asin': asin, 'error': 'Product not found'})
            except Exception as e:
                errors.append({'asin': asin, 'error': str(e)})

        return jsonify({
            'predictions': predictions,
            'errors': errors,
            'total': len(asins),
            'successful': len(predictions),
            'failed': len(errors)
        }), 200

    except Exception as e:
        return jsonify({
            'error': 'Batch prediction failed',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    print("\n" + "="*80)
    print("MOUADVISION ML PREDICTION SERVICE")
    print("="*80)
    print("\nStarting Flask server on http://localhost:5001")
    print("\nAvailable endpoints:")
    print("  GET  /health              - Health check")
    print("  GET  /status              - Service status ✅ NEW")
    print("  GET  /metrics             - Model metrics")
    print("  POST /predict/full        - Full prediction")
    print("  POST /predict/batch       - Batch predictions")
    print("\n" + "="*80 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=False)