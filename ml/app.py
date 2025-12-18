"""
Application Flask - Microservice ML
Plateforme MouadVision - Mini Projet JEE 2025
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import traceback

from config import Config
from predict import prediction_service

# Initialisation Flask
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins":  "*"}})

# Chargement des modèles au démarrage
print("\n" + "="*60)
print("🚀 DÉMARRAGE DU MICROSERVICE ML")
print("   Plateforme MouadVision")
print("="*60)

models_loaded = prediction_service.load_models()

if not models_loaded:
    print("\n⚠️ ATTENTION:  Les modèles ne sont pas chargés!")
    print("   Exécutez:  python train_model.py")
print("="*60)


def handle_errors(f):
    """Décorateur pour la gestion des erreurs."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except Exception as e:
            traceback.print_exc()
            return jsonify({'error': str(e), 'success': False}), 500
    return decorated_function


# ============================================================================
# PAGE D'ACCUEIL
# ============================================================================

@app.route('/', methods=['GET'])
def home():
    """Page d'accueil du service ML."""
    return jsonify({
        'service': 'MouadVision ML Prediction Service',
        'version': '2.0.0',
        'status': 'running',
        'models_ready':  prediction_service.is_loaded,
        'endpoints': {
            'health': 'GET /health',
            'status': 'GET /status',
            'metrics': 'GET /metrics',
            'predict_ranking': 'POST /predict/ranking',
            'predict_bestseller': 'POST /predict/bestseller',
            'predict_price': 'POST /predict/price',
            'predict_full': 'POST /predict/full',
            'predict_batch': 'POST /predict/batch'
        },
        'documentation': 'Microservice Flask pour les prédictions ML de la plateforme MouadVision'
    })


# ============================================================================
# ENDPOINTS DE SANTÉ
# ============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    """Vérification de santé du service."""
    return jsonify({
        'status': 'healthy',
        'service': 'ml-prediction-service',
        'version': '2.0.0',
        'models_ready':  prediction_service.is_loaded,
        'available_models': list(prediction_service.models.keys())
    })


@app.route('/status', methods=['GET'])
def get_status():
    """Statut détaillé du service."""
    return jsonify(prediction_service.get_model_status())


# ============================================================================
# ENDPOINTS DE PRÉDICTION
# ============================================================================

@app.route('/predict/ranking', methods=['POST'])
@handle_errors
def predict_ranking():
    """Prédiction du classement futur."""
    if not prediction_service.is_loaded:
        return jsonify({'error': 'Modèles non chargés. Exécutez train_model.py', 'success': False}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error':  'Données JSON requises', 'success': False}), 400

    result = prediction_service.predict_ranking(data)
    return jsonify({'success': True, 'data': result})


@app.route('/predict/bestseller', methods=['POST'])
@handle_errors
def predict_bestseller():
    """Prédiction de la probabilité bestseller."""
    if not prediction_service.is_loaded:
        return jsonify({'error': 'Modèles non chargés.Exécutez train_model.py', 'success':  False}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données JSON requises', 'success': False}), 400

    result = prediction_service.predict_bestseller(data)
    return jsonify({'success': True, 'data': result})


@app.route('/predict/price', methods=['POST'])
@handle_errors
def predict_price():
    """Recommandation de prix optimal."""
    if not prediction_service.is_loaded:
        return jsonify({'error': 'Modèles non chargés. Exécutez train_model.py', 'success': False}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données JSON requises', 'success': False}), 400

    result = prediction_service.predict_optimal_price(data)
    return jsonify({'success': True, 'data': result})


@app.route('/predict/full', methods=['POST'])
@handle_errors
def predict_full():
    """Toutes les prédictions pour un produit."""
    if not prediction_service.is_loaded:
        return jsonify({'error': 'Modèles non chargés. Exécutez train_model.py', 'success': False}), 503

    data = request.get_json()
    if not data:
        return jsonify({'error': 'Données JSON requises', 'success': False}), 400

    result = prediction_service.get_full_prediction(data)
    return jsonify({'success': True, 'data': result})


@app.route('/predict/batch', methods=['POST'])
@handle_errors
def predict_batch():
    """Prédictions en lot."""
    if not prediction_service.is_loaded:
        return jsonify({'error': 'Modèles non chargés.Exécutez train_model.py', 'success':  False}), 503

    data = request.get_json()
    if not data or 'products' not in data:
        return jsonify({'error': 'Liste "products" requise', 'success': False}), 400

    predictions = prediction_service.get_batch_predictions(data['products'])
    return jsonify({
        'success': True,
        'data': {
            'predictions': predictions,
            'count': len(predictions)
        }
    })


@app.route('/metrics', methods=['GET'])
def get_metrics():
    """Métriques d'entraînement des modèles."""
    return jsonify(prediction_service.training_metrics)


if __name__ == '__main__':
    print(f"\n🌐 Serveur démarré sur http://{Config.HOST}:{Config.PORT}")
    print(f"📊 Endpoints disponibles:")
    print(f"   - GET  /          (page d'accueil)")
    print(f"   - GET  /health")
    print(f"   - GET  /status")
    print(f"   - GET  /metrics")
    print(f"   - POST /predict/ranking")
    print(f"   - POST /predict/bestseller")
    print(f"   - POST /predict/price")
    print(f"   - POST /predict/full")
    print(f"   - POST /predict/batch")
    print("="*60 + "\n")

    app.run(host=Config.HOST, port=Config.PORT, debug=Config.DEBUG)