import os
import json
import joblib
import numpy as np
import pandas as pd
from typing import Dict, Any, Optional, List
from datetime import datetime

from config import Config


class PredictionService:
    """Service de prédiction avec gestion avancée des erreurs."""

    def __init__(self):
        self.models = {}
        self.scaler = None
        self.label_encoders = {}
        self.training_metrics = {}
        self.feature_names = []
        self.is_loaded = False

    def load_models(self) -> bool:
        """Charge tous les modèles ML depuis le disque."""
        try:
            print("\n🔄 Chargement des modèles...")

            # Charger le scaler
            scaler_path = Config.get_model_path(Config.SCALER_FILE)
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                print(f"✅ Scaler chargé")
            else:
                print(f"❌ Scaler non trouvé: {scaler_path}")
                return False

            # Charger les label encoders
            encoders_path = Config.get_model_path(Config.LABEL_ENCODERS_FILE)
            if os.path.exists(encoders_path):
                self.label_encoders = joblib.load(encoders_path)
                print(f"✅ Label encoders chargés")

            # Charger les modèles
            model_files = {
                'ranking': Config.RANKING_MODEL_FILE,
                'bestseller': Config.BESTSELLER_MODEL_FILE,
                'price': Config.PRICE_MODEL_FILE
            }

            for model_name, file_name in model_files.items():
                model_path = Config.get_model_path(file_name)
                if os.path.exists(model_path):
                    self.models[model_name] = joblib.load(model_path)
                    print(f"✅ Modèle {model_name} chargé")
                else:
                    print(f"⚠️ Modèle {model_name} non trouvé: {model_path}")

            # Charger les métriques
            metrics_path = Config.get_model_path(Config.METRICS_FILE)
            if os.path.exists(metrics_path):
                with open(metrics_path, 'r', encoding='utf-8') as f:
                    self.training_metrics = json.load(f)
                print(f"✅ Métriques chargées")

                # Extraire les noms des features
                if 'metadata' in self.training_metrics:
                    self.feature_names = self.training_metrics['metadata'].get('feature_names', [])

            self.is_loaded = len(self.models) >= 3 and self.scaler is not None

            if self.is_loaded:
                print(f"\n🎉 Tous les modèles sont prêts!")
            else:
                print(f"\n⚠️ Certains modèles manquent.Exécutez train_model.py")

            return self.is_loaded

        except Exception as e:
            print(f"❌ Erreur lors du chargement: {e}")
            return False

    def _prepare_input(self, product_data: Dict) -> np.ndarray:
        """Prépare les données d'entrée pour la prédiction."""
        # Extraire les features dans l'ordre
        features = [
            float(product_data.get('current_price', 0)),
            float(product_data.get('rating', 3.0)),
        int(product_data.get('review_count', 0)),
        int(product_data.get('sales_count', 0)),
        int(product_data.get('stock_quantity', 0)),
        int(product_data.get('days_since_listed', 30)),
        float(product_data.get('seller_rating', 3.5)),
        float(product_data.get('discount_percentage', 0)),
        ]

        # Encoder la catégorie
        category = product_data.get('category', 'Electronics')
        if 'category' in self.label_encoders:
            try:
                known_categories = set(self.label_encoders['category'].classes_)
                safe_category = category if category in known_categories else self.label_encoders['category'].classes_[0]
                category_encoded = self.label_encoders['category'].transform([safe_category])[0]
            except Exception:
                category_encoded = 0
        else:
            category_encoded = 0

        features.append(float(category_encoded))

        # Convertir et normaliser
        X = np.array([features])
        X_scaled = self.scaler.transform(X)

        return X_scaled

    def predict_ranking(self, product_data: Dict) -> Dict[str, Any]:
        """Prédit le classement futur d'un produit."""
        if 'ranking' not in self.models:
            return {'error': 'Modèle de classement non disponible'}

        try:
            X = self._prepare_input(product_data)
            predicted_ranking = int(max(1, self.models['ranking'].predict(X)[0]))

            current_ranking = int(product_data.get('current_ranking', predicted_ranking))
            ranking_change = current_ranking - predicted_ranking

            # Déterminer la tendance
            if ranking_change > 10:
                trend = 'AMÉLIORATION'
                trend_description = f"Le produit devrait gagner environ {abs(ranking_change)} places"
            elif ranking_change < -10:
                trend = 'DÉCLIN'
                trend_description = f"Le produit pourrait perdre environ {abs(ranking_change)} places"
            else:
                trend = 'STABLE'
                trend_description = "Le classement devrait rester relativement stable"

            confidence = self.training_metrics.get('ranking', {}).get('r2_score', 0)

            return {
                'predicted_ranking': predicted_ranking,
                'current_ranking': current_ranking,
                'ranking_change': ranking_change,
                'trend': trend,
                'trend_description': trend_description,
                'confidence': round(confidence, 4)
            }
        except Exception as e:
            return {'error': str(e)}

    def predict_bestseller(self, product_data: Dict) -> Dict[str, Any]:
        """Prédit la probabilité bestseller."""
        if 'bestseller' not in self.models:
            return {'error': 'Modèle bestseller non disponible'}

        try:
            X = self._prepare_input(product_data)
            probability = float(self.models['bestseller'].predict_proba(X)[0][1])
            is_potential = probability >= Config.BESTSELLER_THRESHOLD

            # Niveau de potentiel
            if probability >= 0.9:
                level = 'TRÈS ÉLEVÉ'
                recommendation = "Excellent potentiel!  Augmentez le stock et envisagez une promotion."
            elif probability >= 0.7:
                level = 'ÉLEVÉ'
                recommendation = "Fort potentiel.Surveillez les tendances et optimisez la visibilité."
            elif probability >= 0.5:
                level = 'MODÉRÉ'
                recommendation = "Potentiel moyen.Considérez des ajustements de prix ou marketing."
            elif probability >= 0.3:
                level = 'FAIBLE'
                recommendation = "Potentiel limité.Analysez les facteurs de performance."
            else:
                level = 'TRÈS FAIBLE'
                recommendation = "Faible potentiel actuel.Revoyez la stratégie produit."

            confidence = self.training_metrics.get('bestseller', {}).get('f1_score', 0)

            return {
                'bestseller_probability': round(probability, 4),
                'is_potential_bestseller': is_potential,
                'potential_level': level,
                'recommendation': recommendation,
                'confidence': round(confidence, 4)
            }
        except Exception as e:
            return {'error':  str(e)}

    def predict_optimal_price(self, product_data: Dict) -> Dict[str, Any]:
        """Recommande un prix optimal."""
        if 'price' not in self.models:
            return {'error': 'Modèle de prix non disponible'}

        try:
            X = self._prepare_input(product_data)
            optimal_price = float(self.models['price'].predict(X)[0])

            current_price = float(product_data.get('current_price', optimal_price))
            price_diff = optimal_price - current_price
            price_change_pct = (price_diff / current_price * 100) if current_price > 0 else 0

            # Déterminer l'action
            if abs(price_change_pct) <= 5:
                action = 'MAINTENIR'
                description = "Le prix actuel est proche de l'optimal."
            elif price_change_pct > 5:
                action = 'AUGMENTER'
                description = f"Une augmentation de {abs(price_change_pct):.1f}% pourrait optimiser les revenus."
            else:
                action = 'DIMINUER'
                description = f"Une réduction de {abs(price_change_pct):.1f}% pourrait stimuler les ventes."

            should_notify = abs(price_change_pct) > (Config.PRICE_VARIATION_THRESHOLD * 100)
            confidence = self.training_metrics.get('price', {}).get('r2_score', 0)

            return {
                'recommended_price': round(optimal_price, 2),
                'current_price': round(current_price, 2),
                'price_difference': round(price_diff, 2),
                'price_change_percentage': round(price_change_pct, 2),
                'price_action': action,
                'action_description': description,
                'should_notify_seller': should_notify,
                'confidence': round(confidence, 4)
            }
        except Exception as e:
            return {'error': str(e)}

    def get_full_prediction(self, product_data: Dict) -> Dict[str, Any]:
        """Effectue toutes les prédictions pour un produit."""
        return {
            'product_id': product_data.get('product_id'),
            'product_name': product_data.get('product_name', 'N/A'),
            'ranking_prediction': self.predict_ranking(product_data),
            'bestseller_prediction': self.predict_bestseller(product_data),
            'price_prediction': self.predict_optimal_price(product_data),
            'generated_at': datetime.now().isoformat()
        }

    def get_batch_predictions(self, products: List[Dict]) -> List[Dict]:
        """Prédictions pour plusieurs produits."""
        return [self.get_full_prediction(p) for p in products]

    def get_model_status(self) -> Dict[str, Any]:
        """Retourne le statut des modèles."""
        return {
            'models_loaded': self.is_loaded,
            'available_models': list(self.models.keys()),
            'scaler_loaded': self.scaler is not None,
            'training_metrics': self.training_metrics
        }


# Instance singleton
prediction_service = PredictionService()