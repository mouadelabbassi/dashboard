import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
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

# ✅ CRITICAL FIX: Create alias for backward compatibility
ImprovedFeatureEngineer = HybridFeatureEngineer
sys.modules['__main__'].ImprovedFeatureEngineer = HybridFeatureEngineer

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

    mapped_data.setdefault('no_of_sellers', 1)
    mapped_data.setdefault('product_source', 'Platform')
    mapped_data.setdefault('has_sales', 1 if mapped_data.get('total_units_sold', 0) > 0 else 0)
    mapped_data.setdefault('has_amazon_data', 1 if mapped_data.get('amazon_rank') else 0)
    mapped_data.setdefault('sales_velocity',
                           float(mapped_data.get('total_units_sold', 0)) / max(float(mapped_data.get('days_since_listed', 1)), 1))

    mapped_data.setdefault('days_since_last_sale', 9999)
    mapped_data.setdefault('combined_reviews', mapped_data.get('amazon_reviews', 0))
    mapped_data.setdefault('total_revenue', mapped_data.get('price', 0) * mapped_data.get('total_units_sold', 0))
    mapped_data.setdefault('order_count', 0)
    mapped_data.setdefault('unique_customers', 0)
    mapped_data.setdefault('sales_acceleration', 0)
    mapped_data.setdefault('revenue_per_order', 0)

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
        self.label_encoders = {}
        self.scaler = None
        self.db = DatabaseConfig()
        self.load_all_models()

    def load_all_models(self):
        try:
            model_files = {
                'bestseller_detection': 'bestseller_model_v2.pkl',
                'ranking_prediction': 'ranking_model_v2.pkl',
                'price_optimization': 'price_model_v2.pkl'
            }

            for model_type, filename in model_files.items():
                model_path = os.path.join(self.models_dir, filename)

                if not os.path.exists(model_path):
                    raise FileNotFoundError(f"Model file not found: {model_path}")

                self.models[model_type] = joblib.load(model_path)
                print(f"✓ Loaded {model_type}: {filename}")

            metrics_path = os.path.join(self.models_dir, 'training_metrics_v2.json')
            if os.path.exists(metrics_path):
                with open(metrics_path, 'r') as f:
                    self.metrics = json.load(f)
            else:
                print("⚠ Warning: training_metrics_v2.json not found")
                self.metrics = {
                    'bestseller_detection': {'accuracy': 0.0, 'f1_score': 0.0},
                    'ranking_prediction': {'r2_score': 0.0, 'mae': 0.0},
                    'price_optimization': {'mape': 0.0, 'r2_score': 0.0}
                }

            # ✅ CRITICAL FIX: Properly load feature engineer with all attributes
            feature_engineer_path = os.path.join(self.models_dir, 'feature_engineer_v2.pkl')
            if os.path.exists(feature_engineer_path):
                try:
                    import __main__
                    __main__.ImprovedFeatureEngineer = HybridFeatureEngineer

                    self.feature_engineer = joblib.load(feature_engineer_path)

                    # ✅ VERIFY that label_encoders attribute exists
                    if not hasattr(self.feature_engineer, 'label_encoders'):
                        print("⚠ Loaded feature engineer missing label_encoders, initializing...")
                        self.feature_engineer.label_encoders = {}

                    if not hasattr(self.feature_engineer, 'scalers'):
                        print("⚠ Loaded feature engineer missing scalers, initializing...")
                        self.feature_engineer.scalers = {}

                    if not hasattr(self.feature_engineer, 'category_stats'):
                        print("⚠ Loaded feature engineer missing category_stats, initializing...")
                        self.feature_engineer.category_stats = {}

                    print(f"✓ Loaded feature engineer: feature_engineer_v2.pkl")

                except Exception as e:
                    print(f"⚠ Warning: Could not load feature_engineer_v2.pkl ({e})")
                    print("  Creating new HybridFeatureEngineer with proper initialization...")
                    self.feature_engineer = self._create_initialized_feature_engineer()
            else:
                print("⚠ Warning: feature_engineer_v2.pkl not found, creating new instance")
                self.feature_engineer = self._create_initialized_feature_engineer()

            # Load label encoders separately if they exist
            label_encoders_path = os.path.join(self.models_dir, 'label_encoders_v2.pkl')
            if os.path.exists(label_encoders_path):
                try:
                    loaded_encoders = joblib.load(label_encoders_path)
                    self.label_encoders = loaded_encoders
                    # Also update feature engineer's encoders
                    if hasattr(self.feature_engineer, 'label_encoders'):
                        self.feature_engineer.label_encoders.update(loaded_encoders)
                    print(f"✓ Loaded label encoders")
                except Exception as e:
                    print(f"⚠ Warning: Could not load label encoders ({e})")

            print("\n" + "="*60)
            print("✓ ALL MODELS LOADED SUCCESSFULLY")
            print("="*60)
            if 'bestseller_detection' in self.metrics:
                print(f"  📊 Bestseller Detection: {self.metrics['bestseller_detection'].get('accuracy', 0):.2%} accuracy")
            if 'ranking_prediction' in self.metrics:
                print(f"  📈 Ranking Prediction: {self.metrics['ranking_prediction'].get('r2_score', 0):.3f} R²")
            if 'price_optimization' in self.metrics:
                print(f"  💰 Price Optimization: {self.metrics['price_optimization'].get('mape', 0):.2f}% MAPE")
            print("="*60 + "\n")

        except Exception as e:
            print(f"✗ ERROR LOADING MODELS: {str(e)}")
            traceback.print_exc()
            raise

    def _create_initialized_feature_engineer(self):
        """Create a properly initialized HybridFeatureEngineer"""
        engineer = HybridFeatureEngineer(category_stats={})

        # Ensure all required attributes exist
        if not hasattr(engineer, 'label_encoders'):
            engineer.label_encoders = {}
        if not hasattr(engineer, 'scalers'):
            engineer.scalers = {}
        if not hasattr(engineer, 'category_stats'):
            engineer.category_stats = {}
        if not hasattr(engineer, 'feature_names'):
            engineer.feature_names = []

        return engineer

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

        product['days_since_last_sale'] = 9999
        product['total_revenue'] = float(product.get('price', 0)) * float(product.get('total_units_sold', 0))
        product['unique_customers'] = 0
        product['sales_acceleration'] = 0
        product['revenue_per_order'] = 0

        product['price'] = float(product['price']) if product['price'] is not None else 0.0
        product['amazon_rating'] = float(product['amazon_rating']) if product['amazon_rating'] is not None else 3.5
        product['amazon_reviews'] = int(product['amazon_reviews']) if product['amazon_reviews'] is not None else 0
        product['amazon_rank'] = int(product['amazon_rank']) if product['amazon_rank'] is not None else 9999
        product['no_of_sellers'] = int(product['no_of_sellers']) if product['no_of_sellers'] is not None else 1
        product['days_since_listed'] = int(product['days_since_listed']) if product['days_since_listed'] is not None else 0

        return product

    def predict_bestseller(self, product_data: dict) -> dict:
        df = pd.DataFrame([product_data])
        df = self.feature_engineer.transform(df)

        features = self.features.get('bestseller_detection', df.columns.tolist())
        features = [f for f in features if f in df.columns]
        X = df[features]

        model = self.models['bestseller_detection']
        if isinstance(model, dict) and 'model' in model:
            model = model['model']

        prediction = model.predict(X)[0]
        probability = model.predict_proba(X)[0]

        bestseller_probability = float(probability[1])
        bestseller_score = float(df['bestseller_score'].iloc[0]) if 'bestseller_score' in df.columns else bestseller_probability

        if bestseller_probability >= 0.80:
            potential_level = "TRÈS ÉLEVÉ"
        elif bestseller_probability >= 0.60:
            potential_level = "ÉLEVÉ"
        elif bestseller_probability >= 0.40:
            potential_level = "MODÉRÉ"
        else:
            potential_level = "FAIBLE"

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

        features = self.features.get('ranking_prediction', df.columns.tolist())
        features = [f for f in features if f in df.columns]
        X = df[features]

        model = self.models['ranking_prediction']
        uses_log = False
        if isinstance(model, dict):
            uses_log = model.get('uses_log_transform', False)
            model = model.get('model', model)

        if uses_log:
            predicted_log = float(model.predict(X)[0])
            predicted_rank = int(np.expm1(predicted_log))
        else:
            predicted_rank = int(model.predict(X)[0])

        predicted_rank = max(1, min(predicted_rank, 999999))

        current_rank = product_data.get('amazon_rank')
        if current_rank is None or current_rank == 0:
            current_rank = product_data.get('combined_rank', 9999)

        current_rank = int(current_rank)
        ranking_change = current_rank - predicted_rank

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
            confidence_boost = 0.05
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

        trend_accuracy = self.metrics['ranking_prediction'].get('trend_accuracy', 0.5)
        confidence = trend_accuracy + confidence_boost
        if abs(ranking_change) > 1000:
            confidence *= 0.8

        return {
            'predictedRanking': predicted_rank,
            'currentRanking': current_rank,
            'rankingChange': ranking_change,
            'trend': trend,
            'trendDescription': trend_description,
            'confidence': round(min(confidence, 0.95), 4),
            'trendAccuracy': round(trend_accuracy, 4)
        }

    def predict_price(self, product_data: dict) -> dict:
        df = pd.DataFrame([product_data])
        df = self.feature_engineer.transform(df)

        features = self.features.get('price_optimization', df.columns.tolist())
        features = [f for f in features if f in df.columns]
        X = df[features]

        model = self.models['price_optimization']
        training_samples = 0
        if isinstance(model, dict):
            training_samples = model.get('training_samples', 0)
            model = model.get('model', model)

        recommended_price = float(model.predict(X)[0])
        current_price = float(product_data['price'])

        is_reliable = training_samples >= 50
        mape = self.metrics['price_optimization'].get('mape', 100)

        price_difference = recommended_price - current_price
        price_change_percentage = (price_difference / current_price) * 100

        if not is_reliable and abs(price_change_percentage) > 15:
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

        confidence = max(0, min(1, 1 - (mape / 100))) if is_reliable else 0.3

        return {
            'currentPrice': round(current_price, 2),
            'recommendedPrice': round(recommended_price, 2),
            'priceDifference': round(price_difference, 2),
            'priceChangePercentage': round(price_change_percentage, 2),
            'priceAction': price_action,
            'actionDescription': action_description,
            'shouldNotifySeller': should_notify and is_reliable,
            'confidence': round(confidence, 4),
            'isReliable': is_reliable,
            'modelMAPE': round(mape, 2),
            'trainingSamples': training_samples
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
    print("  GET  /status              - Service status")
    print("  GET  /metrics             - Model metrics")
    print("  POST /predict/full        - Full prediction")
    print("  POST /predict/batch       - Batch predictions")
    print("\n" + "="*80 + "\n")

    app.run(host='0.0.0.0', port=5001, debug=False)