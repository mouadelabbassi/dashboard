"""
Script de Diagnostic Complet - Analyse Prédictive
Identifie et résout les problèmes de prédictions à zéro

Usage: python diagnostic_predictions.py
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# Configuration
MODELS_DIR = Path(__file__).parent / 'models'
REQUIRED_FILES = [
    'ranking_model.pkl',
    'bestseller_model.pkl',
    'price_recommendation_model.pkl',
    'feature_scaler.pkl',
    'label_encoders.pkl',
    'training_metrics.json'
]


def print_section(title):
    """Affiche une section."""
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)


def check_files_exist():
    """Vérifie que tous les fichiers nécessaires existent."""
    print_section("🔍 VÉRIFICATION DES FICHIERS")

    all_exist = True
    for filename in REQUIRED_FILES:
        filepath = MODELS_DIR / filename
        exists = filepath.exists()
        status = "✅" if exists else "❌"
        size = filepath.stat().st_size if exists else 0
        print(f"{status} {filename:40} ({size:,} bytes)")
        if not exists:
            all_exist = False

    if not all_exist:
        print("\n❌ PROBLÈME: Certains fichiers sont manquants!")
        print("💡 Solution: Exécutez 'python train_model.py'")
        return False

    print("\n✅ Tous les fichiers sont présents")
    return True


def load_and_check_models():
    """Charge et vérifie les modèles."""
    print_section("🤖 CHARGEMENT DES MODÈLES")

    try:
        # Charger le scaler
        scaler_path = MODELS_DIR / 'feature_scaler.pkl'
        scaler = joblib.load(scaler_path)
        print(f"✅ Scaler chargé")
        print(f"   Features: {scaler.n_features_in_}")
        print(f"   Mean: {scaler.mean_[:3]}... (premiers 3)")
        print(f"   Std: {scaler.scale_[:3]}... (premiers 3)")

        # Vérifier si le scaler a des valeurs valides
        if np.any(scaler.scale_ == 0):
            print("   ⚠️ ATTENTION: Certains scale_ sont à zéro!")
            zero_features = np.where(scaler.scale_ == 0)[0]
            print(f"   Features avec scale=0: {zero_features}")

        # Charger les encoders
        encoders_path = MODELS_DIR / 'label_encoders.pkl'
        encoders = joblib.load(encoders_path)
        print(f"\n✅ Encoders chargés")
        for name, encoder in encoders.items():
            print(f"   {name}: {len(encoder.classes_)} classes")
            print(f"      Classes: {encoder.classes_[:5]}...")

        # Charger les modèles
        models = {}
        for model_name, filename in [
            ('ranking', 'ranking_model.pkl'),
            ('bestseller', 'bestseller_model.pkl'),
            ('price', 'price_recommendation_model.pkl')
        ]:
            model_path = MODELS_DIR / filename
            models[model_name] = joblib.load(model_path)
            print(f"\n✅ Modèle {model_name} chargé")
            print(f"   Type: {type(models[model_name]).__name__}")

            if hasattr(models[model_name], 'feature_importances_'):
                print(f"   Features importance (top 3):")
                importances = models[model_name].feature_importances_
                top_3_idx = np.argsort(importances)[-3:][::-1]
                for idx in top_3_idx:
                    print(f"      Feature {idx}: {importances[idx]:.4f}")

        return scaler, encoders, models

    except Exception as e:
        print(f"\n❌ ERREUR lors du chargement: {e}")
        import traceback
        traceback.print_exc()
        return None, None, None


def check_training_metrics():
    """Vérifie les métriques d'entraînement."""
    print_section("📊 MÉTRIQUES D'ENTRAÎNEMENT")

    try:
        metrics_path = MODELS_DIR / 'training_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)

        print("Métadonnées:")
        metadata = metrics.get('metadata', {})
        print(f"   Version: {metadata.get('version', 'N/A')}")
        print(f"   Entraîné le: {metadata.get('trained_at', 'N/A')}")
        print(f"   Données réelles: {metadata.get('real_data_count', 0)}")
        print(f"   Source: {metadata.get('data_source', 'N/A')}")
        print(f"   Features: {len(metadata.get('feature_names', []))}")

        print("\nPerformances:")
        for model_name in ['ranking', 'bestseller', 'price']:
            if model_name in metrics:
                model_metrics = metrics[model_name]
                print(f"\n   {model_name.upper()}:")

                if model_name == 'ranking':
                    print(f"      R²: {model_metrics.get('r2_score', 0):.4f}")
                    print(f"      RMSE: {model_metrics.get('rmse', 0):.2f}")
                    print(f"      MAE: {model_metrics.get('mae', 0):.2f}")

                elif model_name == 'bestseller':
                    print(f"      F1: {model_metrics.get('f1_score', 0):.4f}")
                    print(f"      Precision: {model_metrics.get('precision', 0):.4f}")
                    print(f"      Recall: {model_metrics.get('recall', 0):.4f}")

                elif model_name == 'price':
                    print(f"      R²: {model_metrics.get('r2_score', 0):.4f}")
                    print(f"      RMSE: ${model_metrics.get('rmse', 0):.2f}")
                    print(f"      MAPE: {model_metrics.get('mape', 0):.2f}%")

                n_samples = model_metrics.get('n_samples', 0)
                print(f"      Samples: {n_samples}")

                if n_samples < 50:
                    print(f"      ⚠️ ATTENTION: Peu de données d'entraînement!")

        return metrics

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        return None


def test_prediction(scaler, encoders, models):
    """Test une prédiction réelle."""
    print_section("🧪 TEST DE PRÉDICTION")

    # Créer un produit test RÉALISTE
    test_product = {
        'current_price': 29.99,
        'rating': 4.2,
        'review_count': 150,
        'sales_count': 45,
        'stock_quantity': 100,
        'days_since_listed': 60,
        'seller_rating': 4.5,
        'discount_percentage': 10.0,
        'category': 'Electronics'
    }

    print("Produit test:")
    for key, value in test_product.items():
        print(f"   {key}: {value}")

    try:
        # Préparer les features
        features = [
            test_product['current_price'],
            test_product['rating'],
            test_product['review_count'],
            test_product['sales_count'],
            test_product['stock_quantity'],
            test_product['days_since_listed'],
            test_product['seller_rating'],
            test_product['discount_percentage']
        ]

        # Encoder la catégorie
        if 'category' in encoders:
            try:
                cat_encoded = encoders['category'].transform([test_product['category']])[0]
            except:
                cat_encoded = 0
                print("   ⚠️ Catégorie inconnue, utilisation de 0")
        else:
            cat_encoded = 0

        features.append(float(cat_encoded))

        print(f"\n   Features brutes: {features}")

        # Normaliser
        X = np.array([features])
        print(f"   Shape avant scaling: {X.shape}")

        X_scaled = scaler.transform(X)
        print(f"   Features normalisées: {X_scaled[0][:3]}... (premiers 3)")

        # Vérifier si les features normalisées sont valides
        if np.any(np.isnan(X_scaled)):
            print("   ❌ ERREUR: Features normalisées contiennent des NaN!")
            return False

        if np.all(X_scaled == 0):
            print("   ❌ ERREUR: Toutes les features normalisées sont à zéro!")
            return False

        # Test ranking
        print("\n   🏆 RANKING:")
        ranking_pred = models['ranking'].predict(X_scaled)[0]
        print(f"      Prédiction: {ranking_pred:.2f}")
        if ranking_pred == 0:
            print("      ❌ PROBLÈME: Prédiction à zéro!")
        else:
            print("      ✅ Prédiction valide")

        # Test bestseller
        print("\n   ⭐ BESTSELLER:")
        bestseller_prob = models['bestseller'].predict_proba(X_scaled)[0][1]
        print(f"      Probabilité: {bestseller_prob:.4f} ({bestseller_prob*100:.2f}%)")
        if bestseller_prob == 0:
            print("      ❌ PROBLÈME: Probabilité à zéro!")
        else:
            print("      ✅ Prédiction valide")

        # Test price
        print("\n   💰 PRIX:")
        price_pred = models['price'].predict(X_scaled)[0]
        print(f"      Prix recommandé: ${price_pred:.2f}")
        print(f"      Prix actuel: ${test_product['current_price']:.2f}")
        print(f"      Différence: ${price_pred - test_product['current_price']:.2f}")
        if price_pred == 0:
            print("      ❌ PROBLÈME: Prix à zéro!")
        else:
            print("      ✅ Prédiction valide")

        # Résumé
        all_valid = (ranking_pred != 0 and bestseller_prob != 0 and price_pred != 0)
        if all_valid:
            print("\n✅ TOUS LES MODÈLES FONCTIONNENT CORRECTEMENT!")
            return True
        else:
            print("\n❌ CERTAINS MODÈLES RETOURNENT DES ZÉROS!")
            return False

    except Exception as e:
        print(f"\n❌ ERREUR lors de la prédiction: {e}")
        import traceback
        traceback.print_exc()
        return False


def analyze_data_distribution():
    """Analyse la distribution des données d'entraînement."""
    print_section("📈 ANALYSE DES DONNÉES D'ENTRAÎNEMENT")

    try:
        metrics_path = MODELS_DIR / 'training_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)

        metadata = metrics.get('metadata', {})
        n_samples = metadata.get('real_data_count', 0)

        print(f"Nombre de samples: {n_samples}")

        if n_samples == 0:
            print("❌ PROBLÈME CRITIQUE: Aucun échantillon d'entraînement!")
            print("\n💡 DIAGNOSTIC:")
            print("   Le modèle a été entraîné sur 0 échantillons")
            print("   C'est pourquoi toutes les prédictions sont à zéro!")
            print("\n🔧 SOLUTION:")
            print("   1. Assurez-vous que la base de données contient des produits")
            print("   2. Vérifiez la connexion au backend Spring Boot")
            print("   3. Ré-exécutez: python train_model.py")
            return False

        elif n_samples < 50:
            print(f"⚠️ ATTENTION: Très peu de données ({n_samples} samples)")
            print("   Les prédictions peuvent être imprécises")
            print("\n💡 RECOMMANDATION:")
            print("   Ajoutez plus de produits dans la plateforme (minimum 100)")

        else:
            print(f"✅ Quantité de données acceptable ({n_samples} samples)")

        # Analyser les features
        if 'ranking' in metrics:
            feat_imp = metrics['ranking'].get('feature_importance', {})
            if feat_imp:
                print("\nImportance des features (Top 5):")
                sorted_features = sorted(feat_imp.items(), key=lambda x: x[1], reverse=True)[:5]
                for feat, imp in sorted_features:
                    print(f"   {feat:25} {imp:.4f}")

        return True

    except Exception as e:
        print(f"❌ ERREUR: {e}")
        return False


def provide_recommendations():
    """Fournit des recommandations."""
    print_section("💡 RECOMMANDATIONS")

    print("""
Si vous voyez des zéros dans le dashboard:

1. 🔄 RÉ-ENTRAÎNER LE MODÈLE
   → python train_model.py
   → Assurez-vous que des produits existent dans la BDD
   → Vérifiez que le backend est démarré (port 8080)

2. ✅ VÉRIFIER LES DONNÉES
   → Le modèle doit avoir au moins 50 produits pour fonctionner
   → Chaque produit doit avoir un prix > 0
   → Les catégories doivent être définies

3. 🔌 VÉRIFIER LES SERVICES
   → Backend Spring Boot: http://localhost:8080
   → Service Flask ML: http://localhost:5001
   → Test: curl http://localhost:5001/health

4. 🧪 TESTER MANUELLEMENT
   → Utilisez cet outil: python diagnostic_predictions.py
   → Appelez directement l'API Flask
   → Vérifiez les logs du backend

5. 📊 RÉGÉNÉRER LES PRÉDICTIONS
   → Dans le dashboard: "Générer les prédictions"
   → Attendez quelques secondes
   → Rafraîchissez la page

Si le problème persiste:
   → Vérifiez les logs Python et Java
   → Assurez-vous que Flask utilise les bons modèles
   → Testez avec des données d'exemple
""")


def main():
    """Fonction principale."""
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          🔍 DIAGNOSTIC COMPLET - ANALYSE PRÉDICTIVE           ║
║                                                               ║
║  Ce script identifie pourquoi les prédictions sont à zéro   ║
╚═══════════════════════════════════════════════════════════════╝
""")

    # 1. Vérifier les fichiers
    if not check_files_exist():
        provide_recommendations()
        return

    # 2. Analyser les métriques
    metrics = check_training_metrics()
    if not metrics:
        provide_recommendations()
        return

    # 3. Analyser la distribution des données
    if not analyze_data_distribution():
        provide_recommendations()
        return

    # 4. Charger les modèles
    scaler, encoders, models = load_and_check_models()
    if scaler is None:
        provide_recommendations()
        return

    # 5. Tester une prédiction
    success = test_prediction(scaler, encoders, models)

    # 6. Conclusion
    print_section("🎯 CONCLUSION")
    if success:
        print("""
✅ DIAGNOSTIC COMPLET: TOUT FONCTIONNE!

Les modèles sont correctement entraînés et retournent des valeurs.
Si vous voyez toujours des zéros dans le dashboard:

1. Vérifiez que Flask utilise ces modèles
   → Redémarrez: python app.py

2. Régénérez les prédictions
   → Dashboard → "Générer les prédictions"

3. Vérifiez les logs du backend Spring Boot
   → Les prédictions sont-elles sauvegardées en BDD?
""")
    else:
        print("""
❌ PROBLÈME DÉTECTÉ!

Les modèles retournent des zéros. Causes possibles:

1. Modèle entraîné sur 0 échantillons
   → Solution: python train_model.py (avec données)

2. Features mal normalisées
   → Le scaler a des problèmes

3. Mauvais encodage de catégories
   → Vérifiez label_encoders.pkl
""")
        provide_recommendations()


if __name__ == '__main__':
    main()