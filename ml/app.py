import os
import logging
from datetime import datetime

os.makedirs('logs', exist_ok=True)
os.makedirs('models', exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/predictions.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=['http://localhost:5173', 'http://localhost:3000', 'http://localhost:8080'])

_bestseller_predictor = None
_ranking_predictor = None


def get_bestseller_predictor():
    global _bestseller_predictor
    if _bestseller_predictor is None:
        try:
            from predictors.bestseller_predictor import BestsellerPredictor
            _bestseller_predictor = BestsellerPredictor()
            logger.info("Bestseller predictor loaded")
        except Exception as e:
            logger.warning(f"Could not load bestseller predictor: {e}")
    return _bestseller_predictor


def get_ranking_predictor():
    global _ranking_predictor
    if _ranking_predictor is None:
        try:
            from predictors.ranking_trend_predictor import RankingTrendPredictor
            _ranking_predictor = RankingTrendPredictor()
            logger.info("Ranking predictor loaded")
        except Exception as e:
            logger.warning(f"Could not load ranking predictor: {e}")
    return _ranking_predictor



@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    bestseller_loaded = get_bestseller_predictor() is not None and get_bestseller_predictor().is_loaded()
    ranking_loaded = get_ranking_predictor() is not None and get_ranking_predictor().is_loaded()

    return jsonify({
        'status': 'healthy',
        'service': 'MouadVision ML Service',
        'version': '2.0.0',
        'timestamp': datetime.now().isoformat(),
        'models': {
            'bestseller': 'loaded' if bestseller_loaded else 'not_loaded',
            'ranking_trend': 'loaded' if ranking_loaded else 'not_loaded'
        }
    })


@app.route('/model/accuracy', methods=['GET'])
def get_model_accuracy():
    """Get accuracy metrics for all models"""
    metrics = {
        'bestseller': {},
        'ranking': {},
        'metadata': {
            'retrieved_at': datetime.now().isoformat(),
            'dataset_size': 546,
            'disclaimer': 'Metrics based on training data. Actual performance may vary.'
        }
    }

    # Get bestseller metrics
    predictor = get_bestseller_predictor()
    if predictor and predictor.is_loaded():
        metrics['bestseller'] = predictor.get_metrics()
    else:
        metrics['bestseller'] = {'status': 'model_not_loaded'}

    # Get ranking metrics
    ranking_pred = get_ranking_predictor()
    if ranking_pred and ranking_pred.is_loaded():
        metrics['ranking'] = ranking_pred.get_metrics()
        metrics['ranking']['experimental'] = True
    else:
        metrics['ranking'] = {'status': 'model_not_loaded', 'experimental': True}

    return jsonify(metrics)


# ==================== BESTSELLER ENDPOINTS ====================

@app.route('/predict/bestseller', methods=['POST'])
def predict_bestseller():
    """Predict bestseller probability for a single product"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        predictor = get_bestseller_predictor()
        if not predictor or not predictor.is_loaded():
            return jsonify({
                'error': 'Model not loaded',
                'message': 'Please train the model first using /train/bestseller'
            }), 503

        result = predictor.predict_single(data)
        result['product_id'] = data.get('asin') or data.get('product_id')
        result['predicted_at'] = datetime.now().isoformat()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Bestseller prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/bestsellers/batch', methods=['POST'])
def predict_bestsellers_batch():
    """Batch prediction for multiple products"""
    try:
        data = request.get_json()
        products = data.get('products', [])

        if not products:
            return jsonify({'error': 'No products provided'}), 400

        predictor = get_bestseller_predictor()
        if not predictor or not predictor.is_loaded():
            return jsonify({'error': 'Model not loaded'}), 503

        results = predictor.predict_batch(products)

        return jsonify({
            'predictions': results,
            'count': len(results),
            'predicted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== RANKING TREND ENDPOINTS ====================

@app.route('/predict/ranking-trend', methods=['POST'])
def predict_ranking_trend():
    """Predict ranking trend for a single product (EXPERIMENTAL)"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        predictor = get_ranking_predictor()
        if not predictor or not predictor.is_loaded():
            return jsonify({
                'error': 'Model not loaded',
                'message': 'Please train the model first using /train/ranking',
                'experimental': True
            }), 503

        result = predictor.predict_single(data)
        result['product_id'] = data.get('asin') or data.get('product_id')
        result['predicted_at'] = datetime.now().isoformat()

        return jsonify(result)

    except Exception as e:
        logger.error(f"Ranking prediction error: {e}")
        return jsonify({'error': str(e), 'experimental': True}), 500


@app.route('/predict/ranking-trends/batch', methods=['POST'])
def predict_ranking_trends_batch():
    """Batch ranking trend prediction"""
    try:
        data = request.get_json()
        products = data.get('products', [])

        if not products:
            return jsonify({'error': 'No products provided'}), 400

        predictor = get_ranking_predictor()
        if not predictor or not predictor.is_loaded():
            return jsonify({'error': 'Model not loaded', 'experimental': True}), 503

        results = predictor.predict_batch(products)

        return jsonify({
            'predictions': results,
            'count': len(results),
            'experimental': True,
            'predicted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Batch ranking prediction error: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== COMPLETE PREDICTION ====================

def calculate_price_intelligence(product_data):
    """Calculate price intelligence using statistical analysis (NOT ML)"""
    try:
        current_price = float(product_data.get('price', 0))
        category_avg = float(product_data.get('category_avg_price', current_price))
        category_min = float(product_data.get('category_min_price', current_price * 0.5))
        category_max = float(product_data.get('category_max_price', current_price * 2))

        # Calculate sweet spot (40th-60th percentile)
        price_range = category_max - category_min
        sweet_spot_min = category_min + (price_range * 0.40)
        sweet_spot_max = category_min + (price_range * 0.60)
        recommended_price = (sweet_spot_min + sweet_spot_max) / 2

        # Calculate difference
        price_diff = recommended_price - current_price
        price_change_pct = (price_diff / current_price * 100) if current_price > 0 else 0

        # Determine action
        if abs(price_change_pct) < 5:
            action = 'MAINTAIN'
            action_description = 'Le prix actuel est bien positionné'
        elif price_change_pct > 0:
            action = 'INCREASE'
            action_description = f'Envisagez d\'augmenter le prix de {abs(price_change_pct):.1f}%'
        else:
            action = 'DECREASE'
            action_description = f'Envisagez de réduire le prix de {abs(price_change_pct):.1f}%'

        # Determine positioning
        if price_range > 0:
            percentile = ((current_price - category_min) / price_range) * 100
        else:
            percentile = 50

        if percentile < 25:
            positioning = 'BUDGET'
        elif percentile < 50:
            positioning = 'VALUE'
        elif percentile < 75:
            positioning = 'MID_RANGE'
        elif percentile < 90:
            positioning = 'PREMIUM'
        else:
            positioning = 'LUXURY'

        return {
            'current_price': current_price,
            'recommended_price': round(recommended_price, 2),
            'price_difference': round(price_diff, 2),
            'price_change_percentage': round(price_change_pct, 2),
            'price_action': action,
            'action_description': action_description,
            'positioning': positioning,
            'price_percentile': round(percentile, 2),
            'category_avg_price': round(category_avg, 2),
            'category_min_price': round(category_min, 2),
            'category_max_price': round(category_max, 2),
            'sweet_spot_min': round(sweet_spot_min, 2),
            'sweet_spot_max': round(sweet_spot_max, 2),
            'confidence': 0.85,
            'analysis_method': 'STATISTICAL',
            'note': 'Analyse statistique basée sur les prix de la catégorie (non ML)'
        }
    except Exception as e:
        logger.error(f"Price intelligence error: {e}")
        return {'error': str(e), 'analysis_method': 'STATISTICAL'}


@app.route('/predict/complete', methods=['POST'])
def predict_complete():
    """Complete prediction: bestseller + ranking + price intelligence"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        result = {
            'product_id': data.get('asin') or data.get('product_id'),
            'product_name': data.get('productName') or data.get('product_name'),
            'predicted_at': datetime.now().isoformat()
        }

        # Bestseller prediction
        bestseller_pred = get_bestseller_predictor()
        if bestseller_pred and bestseller_pred.is_loaded():
            result['bestseller'] = bestseller_pred.predict_single(data)
        else:
            result['bestseller'] = {'error': 'Model not loaded'}

        # Ranking prediction
        ranking_pred = get_ranking_predictor()
        if ranking_pred and ranking_pred.is_loaded():
            result['ranking_trend'] = ranking_pred.predict_single(data)
        else:
            result['ranking_trend'] = {'error': 'Model not loaded', 'experimental': True}

        # Price intelligence (statistical)
        result['price_intelligence'] = calculate_price_intelligence(data)

        return jsonify(result)

    except Exception as e:
        logger.error(f"Complete prediction error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/predict/complete/batch', methods=['POST'])
def predict_complete_batch():
    """Batch complete prediction"""
    try:
        data = request.get_json()
        products = data.get('products', [])

        if not products:
            return jsonify({'error': 'No products provided'}), 400

        results = []
        for product in products:
            result = {
                'product_id': product.get('asin') or product.get('product_id'),
                'product_name': product.get('productName') or product.get('product_name')
            }

            # Bestseller
            bestseller_pred = get_bestseller_predictor()
            if bestseller_pred and bestseller_pred.is_loaded():
                result['bestseller'] = bestseller_pred.predict_single(product)
            else:
                result['bestseller'] = {'error': 'Model not loaded'}

            # Ranking
            ranking_pred = get_ranking_predictor()
            if ranking_pred and ranking_pred.is_loaded():
                result['ranking_trend'] = ranking_pred.predict_single(product)
            else:
                result['ranking_trend'] = {'error': 'Model not loaded', 'experimental': True}

            # Price
            result['price_intelligence'] = calculate_price_intelligence(product)

            results.append(result)

        return jsonify({
            'predictions': results,
            'count': len(results),
            'predicted_at': datetime.now().isoformat()
        })

    except Exception as e:
        logger.error(f"Batch complete prediction error: {e}")
        return jsonify({'error': str(e)}), 500


# ==================== TRAINING ENDPOINTS ====================

@app.route('/train/bestseller', methods=['POST'])
def train_bestseller():
    """Train the bestseller model"""
    global _bestseller_predictor
    try:
        logger.info("Starting bestseller model training...")
        from training.train_bestseller_model import train_model
        result = train_model()

        # Reload predictor
        _bestseller_predictor = None
        get_bestseller_predictor()

        return jsonify({
            'status': 'success',
            'model': 'bestseller',
            'result': result,
            'trained_at': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Bestseller training error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/train/ranking', methods=['POST'])
def train_ranking():
    """Train the ranking trend model"""
    global _ranking_predictor
    try:
        logger.info("Starting ranking model training...")
        from training.train_ranking_trend_model import train_model
        result = train_model()

        # Reload predictor
        _ranking_predictor = None
        get_ranking_predictor()

        return jsonify({
            'status': 'success',
            'model': 'ranking_trend',
            'experimental': True,
            'result': result,
            'trained_at': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Ranking training error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/train/all', methods=['POST'])
def train_all():
    """Train all models"""
    global _bestseller_predictor, _ranking_predictor
    results = {}

    try:
        # Train bestseller
        logger.info("Training bestseller model...")
        from training.train_bestseller_model import train_model as train_bs
        results['bestseller'] = train_bs()
    except Exception as e:
        results['bestseller'] = {'error': str(e)}

    try:
        # Train ranking
        logger.info("Training ranking model...")
        from training.train_ranking_trend_model import train_model as train_rk
        results['ranking'] = train_rk()
        results['ranking']['experimental'] = True
    except Exception as e:
        results['ranking'] = {'error': str(e), 'experimental': True}

    # Reload predictors
    _bestseller_predictor = None
    _ranking_predictor = None

    return jsonify({
        'status': 'completed',
        'results': results,
        'trained_at': datetime.now().isoformat()
    })


# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': 'Internal server error'}), 500




if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("Starting MouadVision ML Service")
    logger.info("=" * 60)

    # Pre-load predictors
    logger.info("Loading predictors...")
    get_bestseller_predictor()
    get_ranking_predictor()

    logger.info("Starting Flask server on port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=True)