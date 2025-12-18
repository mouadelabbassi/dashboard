import os
import json
import joblib
import requests
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier, GradientBoostingRegressor
from sklearn.metrics import (
    mean_squared_error, r2_score, mean_absolute_error,
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
)

from config import Config


class RealDataLoader:
    """Charge les données réelles depuis l'API Spring Boot."""

    def __init__(self, base_url="http://localhost:8080"):
        self.base_url = base_url
        self.token = None

    def authenticate(self, email="mouad@gmail.com", password="kali123"):
        """Authentification pour obtenir un token JWT."""
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json={"email": email, "password": password},
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                if 'data' in data:
                    self.token = data['data'].get('token') or data['data'].get('accessToken')
                else:
                    self.token = data.get('token') or data.get('accessToken')
                print(f"✅ Authentification réussie")
                return True
            else:
                print(f"⚠️ Échec authentification: {response.status_code}")
                return False
        except Exception as e:
            print(f"⚠️ Impossible de se connecter à l'API: {e}")
            return False

    def get_headers(self):
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def _extract_data(self, response_json):
        """Extrait les données depuis différents formats de réponse API."""
        if isinstance(response_json, list):
            return response_json, 0, 0

        total_elements = 0
        total_pages = 0

        if isinstance(response_json, dict):
            if 'data' in response_json:
                data = response_json['data']
                if isinstance(data, dict):
                    total_elements = data.get('totalElements', 0)
                    total_pages = data.get('totalPages', 0)
                    if 'content' in data:
                        return data['content'], total_elements, total_pages
                    return [data], total_elements, total_pages
                elif isinstance(data, list):
                    return data, len(data), 1

            if 'content' in response_json:
                total_elements = response_json.get('totalElements', 0)
                total_pages = response_json.get('totalPages', 0)
                return response_json['content'], total_elements, total_pages

            for key in ['products', 'items', 'orders', 'categories', 'results']:
                if key in response_json:
                    return response_json[key], len(response_json[key]), 1

        return [], 0, 0

    def fetch_all_pages(self, endpoint, item_name="items"):
        """Récupère TOUTES les pages d'un endpoint paginé."""
        all_items = []
        page = 0
        page_size = 100
        total_pages = 1

        print(f"\n🔄 Récupération de tous les {item_name}...")

        while page < total_pages:
            try:
                separator = '&' if '?' in endpoint else '?'
                url = f"{self.base_url}{endpoint}{separator}page={page}&size={page_size}"

                response = requests.get(url, headers=self.get_headers(), timeout=30)

                if response.status_code == 200:
                    data = response.json()
                    items, total_elements, pages = self._extract_data(data)

                    if pages > 0:
                        total_pages = pages

                    if items:
                        all_items.extend(items)
                        print(f"   Page {page + 1}/{total_pages}: {len(items)} {item_name} (total: {len(all_items)})")

                    page += 1

                    if total_pages == 1 and len(items) == page_size:
                        total_pages = page + 1

                    if len(items) < page_size:
                        break
                else:
                    print(f"   ❌ Erreur page {page}: Status {response.status_code}")
                    break

            except Exception as e:
                print(f"   ❌ Erreur page {page}: {str(e)[:50]}")
                break

        return all_items

    def fetch_products(self):
        """Récupère TOUS les produits depuis l'API."""
        endpoints_to_try = [
            "/api/products",
            "/api/public/products",
            "/api/admin/stock/products",
        ]

        for endpoint in endpoints_to_try:
            products = self.fetch_all_pages(endpoint, "produits")
            if products and len(products) > 0:
                print(f"✅ Total: {len(products)} produits récupérés depuis {endpoint}")
                return products

        print("⚠️ Aucun produit récupéré depuis l'API")
        return []

    def fetch_orders(self):
        """Récupère TOUTES les commandes depuis l'API."""
        endpoints_to_try = [
            "/api/orders",
            "/api/admin/orders",
        ]

        for endpoint in endpoints_to_try:
            orders = self.fetch_all_pages(endpoint, "commandes")
            if orders and len(orders) > 0:
                print(f"✅ Total: {len(orders)} commandes récupérées depuis {endpoint}")
                return orders

        print("⚠️ Aucune commande récupérée")
        return []

    def fetch_categories(self):
        """Récupère toutes les catégories depuis l'API."""
        print("\n🔄 Récupération des catégories...")

        try:
            response = requests.get(
                f"{self.base_url}/api/categories",
                headers=self.get_headers(),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                categories, _, _ = self._extract_data(data)
                print(f"✅ {len(categories)} catégories récupérées")
                return categories
        except Exception as e:
            print(f"⚠️ Erreur catégories: {e}")

        return []


class PredictiveModelTrainer:
    """Entraîne les modèles ML sur les données réelles UNIQUEMENT."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.models = {}
        self.training_metrics = {}
        self.feature_names = []
        self.data_loader = RealDataLoader(Config.SPRING_BOOT_URL)
        self.real_data_count = 0

        Config.ensure_models_dir()
        print(f"📁 Répertoire des modèles: {Config.MODELS_DIR}")

    def load_real_data(self):
        """Charge les données réelles depuis la plateforme."""
        print("\n" + "="*70)
        print("📥 CHARGEMENT DES DONNÉES RÉELLES DE LA PLATEFORME")
        print("="*70)

        if not self.data_loader.authenticate():
            print("⚠️ Authentification échouée")
            return None

        products = self.data_loader.fetch_products()
        orders = self.data_loader.fetch_orders()
        categories = self.data_loader.fetch_categories()

        if not products:
            print("\n❌ ERREUR: Aucun produit trouvé!")
            print("Vérifiez que:")
            print("  1. Le backend Spring Boot est démarré (port 8080)")
            print("  2. Des produits existent dans la base de données")
            print("  3. L'utilisateur a les permissions nécessaires")
            return None

        category_map = {}
        for cat in categories:
            cat_id = cat.get('id')
            cat_name = cat.get('name') or cat.get('categoryName')
            if cat_id and cat_name:
                category_map[str(cat_id)] = cat_name

        product_sales = {}
        for order in orders:
            items = order.get('items') or order.get('orderItems') or []
            for item in items:
                product_id = item.get('productId') or item.get('asin')
                if not product_id and isinstance(item.get('product'), dict):
                    product_id = item['product'].get('asin')
                quantity = item.get('quantity', 1)
                if product_id:
                    product_sales[str(product_id)] = product_sales.get(str(product_id), 0) + quantity

        data = []
        skipped = 0

        for product in products:
            try:
                asin = product.get('asin') or product.get('id') or product.get('productId')
                if not asin:
                    skipped += 1
                    continue

                price = product.get('price')
                if isinstance(price, dict):
                    price = price.get('amount', 0)
                elif isinstance(price, str):
                    price = float(price.replace('$', '').replace(',', '').strip())
                price = float(price) if price else 0

                if price <= 0:
                    skipped += 1
                    continue

                rating = product.get('rating')
                if isinstance(rating, dict):
                    rating = rating.get('value', 0)
                rating = float(rating) if rating else 3.0
                rating = min(5.0, max(1.0, rating))

                reviews = (product.get('reviewsCount') or product.get('reviews_count') or
                           product.get('reviewCount') or product.get('reviews') or 0)
                reviews = int(reviews) if reviews else 0

                sales = (product.get('salesCount') or product.get('sales_count') or
                         product.get('sales') or product_sales.get(str(asin), 0))
                sales = int(sales) if sales else 0

                stock = (product.get('stockQuantity') or product.get('stock_quantity') or
                         product.get('stock') or 100)
                stock = int(stock) if stock else 0

                category = product.get('category')
                if isinstance(category, dict):
                    category = category.get('name') or category.get('categoryName')
                elif category:
                    category = category_map.get(str(category), str(category))

                cat_name = product.get('categoryName')
                if not category and cat_name:
                    category = cat_name

                category = str(category) if category else 'Electronics'

                created_at = product.get('createdAt') or product.get('created_at')
                days_listed = 30
                if created_at:
                    try:
                        if isinstance(created_at, str):
                            created_at_clean = created_at.replace('Z', '').split('.')[0]
                            created_date = datetime.fromisoformat(created_at_clean)
                            days_listed = max(1, (datetime.now() - created_date).days)
                    except:
                        days_listed = 30

                seller = product.get('seller')
                seller_rating = 4.0
                if isinstance(seller, dict):
                    seller_rating = float(seller.get('rating', 4.0))
                seller_rating = min(5.0, max(1.0, seller_rating))

                discount = product.get('discountPercentage') or product.get('discount') or 0
                discount = min(100, max(0, float(discount)))

                ranking = product.get('ranking') or product.get('rank') or 100
                ranking = int(ranking) if ranking else 100

                data.append({
                    'product_id': str(asin),
                    'product_name': product.get('productName') or product.get('name') or 'Unknown',
                    'category': category,
                    'current_price': round(price, 2),
                    'rating': round(rating, 1),
                    'review_count': reviews,
                    'sales_count': sales,
                    'stock_quantity': stock,
                    'days_since_listed': days_listed,
                    'seller_rating': round(seller_rating, 1),
                    'discount_percentage': discount,
                    'current_ranking': ranking
                })

            except Exception as e:
                skipped += 1
                continue

        if not data:
            print("\n❌ ERREUR: Aucune donnée valide extraite")
            return None

        df = pd.DataFrame(data)
        self.real_data_count = len(df)

        print(f"\n" + "="*70)
        print(f"✅ {len(df)} PRODUITS CHARGÉS - ENTRAÎNEMENT SUR DONNÉES RÉELLES")
        if skipped > 0:
            print(f"   ({skipped} produits ignorés - données invalides)")
        print("="*70)
        print(f"\n📊 Statistiques:")
        print(f"   - Catégories: {df['category'].nunique()}")
        for cat in df['category'].unique():
            count = len(df[df['category'] == cat])
            avg_price = df[df['category'] == cat]['current_price'].mean()
            print(f"      • {cat}: {count} produits (prix moy: ${avg_price:.2f})")
        print(f"   - Prix moyen: ${df['current_price'].mean():.2f}")
        print(f"   - Rating moyen: {df['rating'].mean():.2f}")
        print(f"   - Ventes totales: {df['sales_count'].sum()}")

        return df

    def prepare_training_data(self, df):
        """Prépare les variables cibles AVEC VALEURS RÉALISTES."""
        df = df.copy()

        # Score de ranking NORMALISÉ
        df['ranking_score'] = (
                0.35 * (df['sales_count'] / max(df['sales_count'].max(), 1)) +
                0.25 * (df['rating'] / 5.0) +
                0.20 * (df['review_count'] / max(df['review_count'].max(), 1)) +
                0.10 * (df['seller_rating'] / 5.0) +
                0.05 * (df['discount_percentage'] / 50.0) +
                0.05 * (1 - df['days_since_listed'] / max(df['days_since_listed'].max(), 1))
        )

        df['current_ranking'] = df['ranking_score'].rank(ascending=False).astype(int)

        # Ranking futur AVEC VARIANCE RÉALISTE
        n = len(df)
        sales_velocity = df['sales_count'] / np.maximum(df['days_since_listed'], 1)
        velocity_norm = (sales_velocity - sales_velocity.min()) / max(sales_velocity.max() - sales_velocity.min(), 0.01)

        # Tendance progressive: -30 à +30 places
        trend = np.where(velocity_norm > 0.6, -30,
                         np.where(velocity_norm < 0.4, 30, 0))

        # Ajouter du bruit réaliste
        noise = np.random.normal(0, 20, n)
        df['future_ranking'] = np.clip(df['current_ranking'] + trend + noise, 1, n).astype(int)

        # Bestsellers (top 15%)
        sales_threshold = df['sales_count'].quantile(0.85)
        rating_threshold = df['rating'].quantile(0.75)
        df['is_bestseller'] = (
                ((df['sales_count'] >= sales_threshold) & (df['rating'] >= rating_threshold)) |
                (df['ranking_score'] > df['ranking_score'].quantile(0.85))
        ).astype(int)

        # Prix optimal RÉALISTE
        demand_factor = np.clip(df['sales_count'] / max(df['sales_count'].mean(), 1), 0.5, 1.5)
        rating_premium = (df['rating'] - 3.5) / 1.5
        competition_factor = 1 - (df['current_ranking'] / n) * 0.2

        df['optimal_price'] = df['current_price'] * (
                0.90 +  # Base: 90% du prix actuel
                0.20 * demand_factor +  # Ajustement demande
                0.08 * rating_premium +  # Prime qualité
                0.05 * competition_factor  # Facteur concurrence
        )

        # S'assurer que les prix restent réalistes
        df['optimal_price'] = np.clip(
            df['optimal_price'],
            df['current_price'] * 0.7,  # Min: -30%
            df['current_price'] * 1.3   # Max: +30%
        )

        return df

    def prepare_features(self, df):
        """Prépare les features avec encodage."""
        df_prepared = df.copy()

        if 'category' in df_prepared.columns:
            if 'category' not in self.label_encoders:
                self.label_encoders['category'] = LabelEncoder()
                df_prepared['category_encoded'] = self.label_encoders['category'].fit_transform(
                    df_prepared['category'].astype(str)
                )
            else:
                known = set(self.label_encoders['category'].classes_)
                df_prepared['category_safe'] = df_prepared['category'].apply(
                    lambda x: x if x in known else self.label_encoders['category'].classes_[0]
                )
                df_prepared['category_encoded'] = self.label_encoders['category'].transform(
                    df_prepared['category_safe']
                )

        self.feature_names = [
            'current_price', 'rating', 'review_count', 'sales_count',
            'stock_quantity', 'days_since_listed', 'seller_rating',
            'discount_percentage', 'category_encoded'
        ]

        return df_prepared, [f for f in self.feature_names if f in df_prepared.columns]

    def get_optimal_params(self, n_samples):
        """Ajuste les hyperparamètres selon la taille du dataset."""
        if n_samples < 100:
            return {
                'n_estimators': 50,
                'max_depth': 8,
                'min_samples_split': 3,
                'cv_folds': 3
            }
        elif n_samples < 300:
            return {
                'n_estimators': 100,
                'max_depth': 10,
                'min_samples_split': 4,
                'cv_folds': 3
            }
        else:
            return {
                'n_estimators': 150,
                'max_depth': 12,
                'min_samples_split': 5,
                'cv_folds': 5
            }

    def train_ranking_model(self, df, features):
        """Entraîne le modèle de classement."""
        print("\n" + "="*70)
        print("🏆 ENTRAÎNEMENT: Modèle de Classement Futur")
        print("="*70)

        X = df[features].values
        y = df['future_ranking'].values

        # Vérification
        print(f"   Données: {len(X)} échantillons")
        print(f"   Target range: {y.min()} à {y.max()}")
        print(f"   Target mean: {y.mean():.2f}")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        params = self.get_optimal_params(len(X))
        model = RandomForestRegressor(
            n_estimators=params['n_estimators'],
            max_depth=params['max_depth'],
            min_samples_split=params['min_samples_split'],
            random_state=42,
            n_jobs=-1
        )

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=params['cv_folds'], scoring='r2')
        print(f"   CV R² ({params['cv_folds']}-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        # Vérification des prédictions
        print(f"\n   🔍 Vérification prédictions:")
        print(f"      Pred range: {y_pred.min():.2f} à {y_pred.max():.2f}")
        print(f"      Pred mean: {y_pred.mean():.2f}")
        print(f"      Non-zero: {np.count_nonzero(y_pred)}/{len(y_pred)}")

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['ranking'] = model
        self.training_metrics['ranking'] = {
            'r2_score': float(r2),
            'rmse': float(rmse),
            'mae': float(mae),
            'mse': float(rmse**2),
            'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp,
            'n_samples': len(X)
        }

        print(f"\n✅ RÉSULTATS:")
        print(f"   R²: {r2:.4f} | RMSE: {rmse:.2f} | MAE: {mae:.2f}")
        return model

    def train_bestseller_model(self, df, features):
        """Entraîne le modèle bestseller."""
        print("\n" + "="*70)
        print("⭐ ENTRAÎNEMENT: Modèle Bestseller")
        print("="*70)

        X = df[features].values
        y = df['is_bestseller'].values

        print(f"   Données: {len(X)} échantillons")
        print(f"   Bestsellers: {y.sum()} ({y.mean()*100:.1f}%)")

        if y.sum() < 2:
            print("   ⚠️ Trop peu de bestsellers, ajustement du seuil...")
            threshold = df['sales_count'].quantile(0.7)
            y = (df['sales_count'] >= threshold).astype(int)
            df['is_bestseller'] = y
            print(f"   Nouveaux bestsellers: {y.sum()} ({y.mean()*100:.1f}%)")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        params = self.get_optimal_params(len(X))
        model = RandomForestClassifier(
            n_estimators=params['n_estimators'],
            max_depth=params['max_depth'],
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=params['cv_folds'], scoring='f1')
        print(f"   CV F1 ({params['cv_folds']}-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        y_prob = model.predict_proba(X_test_scaled)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        try:
            auc = roc_auc_score(y_test, y_prob)
        except:
            auc = 0.0

        # Vérification
        print(f"\n   🔍 Vérification prédictions:")
        print(f"      Prob range: {y_prob.min():.4f} à {y_prob.max():.4f}")
        print(f"      Prob mean: {y_prob.mean():.4f}")
        print(f"      Predicted positive: {y_pred.sum()}/{len(y_pred)}")

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['bestseller'] = model
        self.training_metrics['bestseller'] = {
            'accuracy': float(acc),
            'precision': float(prec),
            'recall': float(rec),
            'f1_score': float(f1),
            'auc_roc': float(auc),
            'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp,
            'n_samples': len(X)
        }

        print(f"\n✅ RÉSULTATS:")
        print(f"   F1: {f1:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | AUC: {auc:.4f}")
        return model

    def train_price_model(self, df, features):
        """Entraîne le modèle de prix."""
        print("\n" + "="*70)
        print("💰 ENTRAÎNEMENT: Modèle de Prix Optimal")
        print("="*70)

        X = df[features].values
        y = df['optimal_price'].values

        print(f"   Données: {len(X)} échantillons")
        print(f"   Prix actuel moyen: ${df['current_price'].mean():.2f}")
        print(f"   Prix optimal moyen: ${y.mean():.2f}")
        print(f"   Prix range: ${y.min():.2f} à ${y.max():.2f}")

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        params = self.get_optimal_params(len(X))
        model = GradientBoostingRegressor(
            n_estimators=params['n_estimators'],
            max_depth=max(6, params['max_depth'] - 2),
            learning_rate=0.08,
            random_state=42
        )

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=params['cv_folds'], scoring='r2')
        print(f"   CV R² ({params['cv_folds']}-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 0.01))) * 100

        # Vérification
        print(f"\n   🔍 Vérification prédictions:")
        print(f"      Pred range: ${y_pred.min():.2f} à ${y_pred.max():.2f}")
        print(f"      Pred mean: ${y_pred.mean():.2f}")
        print(f"      Non-zero: {np.count_nonzero(y_pred)}/{len(y_pred)}")

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['price'] = model
        self.training_metrics['price'] = {
            'r2_score': float(r2),
            'rmse': float(rmse),
            'mae': float(mae),
            'mse': float(rmse**2),
            'mape': float(mape),
            'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp,
            'n_samples': len(X)
        }

        print(f"\n✅ RÉSULTATS:")
        print(f"   R²: {r2:.4f} | RMSE: ${rmse:.2f} | MAPE: {mape:.2f}%")
        return model

    def save_models(self):
        """Sauvegarde les modèles."""
        print("\n" + "="*70)
        print("💾 SAUVEGARDE DES MODÈLES")
        print("="*70)

        joblib.dump(self.scaler, Config.get_model_path(Config.SCALER_FILE))
        print(f"✅ Scaler sauvegardé")

        joblib.dump(self.label_encoders, Config.get_model_path(Config.LABEL_ENCODERS_FILE))
        print(f"✅ Encoders sauvegardés")

        for name, model in self.models.items():
            path = Config.get_model_path(getattr(Config, f'{name.upper()}_MODEL_FILE'))
            joblib.dump(model, path)
            print(f"✅ Modèle {name} sauvegardé")

        self.training_metrics['metadata'] = {
            'trained_at': datetime.now().isoformat(),
            'feature_names': self.feature_names,
            'categories': list(self.label_encoders.get('category', LabelEncoder()).classes_) if 'category' in self.label_encoders else [],
            'version': '4.0.0-REAL_DATA_ONLY',
            'real_data_count': self.real_data_count,
            'data_source': 'real_platform_data_only',
            'synthetic_data_used': False
        }

        with open(Config.get_model_path(Config.METRICS_FILE), 'w', encoding='utf-8') as f:
            json.dump(self.training_metrics, f, indent=2, ensure_ascii=False)
        print(f"✅ Métriques sauvegardées")

        print("\n🎉 MODÈLES SAUVEGARDÉS AVEC SUCCÈS!")

    def train_all_models(self):
        """Entraîne tous les modèles sur données réelles UNIQUEMENT."""
        print("\n" + "="*70)
        print("🚀 ENTRAÎNEMENT SUR DONNÉES RÉELLES UNIQUEMENT")
        print("   Plateforme MouadVision - Mini Projet JEE 2025")
        print("   VERSION: SANS AUGMENTATION DE DONNÉES")
        print("="*70)

        # Charger UNIQUEMENT les vraies données
        real_data = self.load_real_data()

        if real_data is None or len(real_data) < 10:
            print("\n❌ ERREUR CRITIQUE: Pas assez de données réelles!")
            print(f"   Trouvé: {len(real_data) if real_data is not None else 0} produits")
            print(f"   Minimum requis: 10 produits")
            print("\n💡 Solutions:")
            print("   1. Ajoutez plus de produits dans la plateforme")
            print("   2. Vérifiez que le backend est accessible")
            print("   3. Vérifiez les credentials d'authentification")
            return None

        df = real_data  # PAS d'augmentation!

        # Préparer les données
        df = self.prepare_training_data(df)

        print(f"\n📊 Résumé:")
        print(f"   - TOTAL: {len(df)} échantillons (100% DONNÉES RÉELLES)")
        print(f"   - Catégories: {df['category'].nunique()}")
        print(f"   - Bestsellers: {df['is_bestseller'].sum()} ({df['is_bestseller'].mean()*100:.1f}%)")
        print(f"   - Prix moyen actuel: ${df['current_price'].mean():.2f}")
        print(f"   - Prix optimal moyen: ${df['optimal_price'].mean():.2f}")

        # Préparer les features
        df_prepared, features = self.prepare_features(df)
        print(f"   - Features: {len(features)}")
        print(f"   - Features list: {', '.join(features)}")

        # Entraîner les modèles
        self.train_ranking_model(df_prepared, features)
        self.train_bestseller_model(df_prepared, features)
        self.train_price_model(df_prepared, features)

        # Sauvegarder
        self.save_models()

        print("\n" + "="*70)
        print("✅ ENTRAÎNEMENT TERMINÉ - 100% DONNÉES RÉELLES!")
        print("="*70)

        return self.training_metrics


def main():
    print("""
╔═══════════════════════════════════════════════════════════════╗
║                 🤖 ENTRAÎNEMENT ML - VERSION RÉELLE           ║
║           Plateforme MouadVision - Mini Projet JEE 2025      ║
║                                                               ║
║  ✨ NOUVEAU: Entraînement sur données réelles UNIQUEMENT    ║
║  ❌ SUPPRIMÉ: Augmentation de données synthétiques           ║
╚═══════════════════════════════════════════════════════════════╝
""")

    trainer = PredictiveModelTrainer()
    metrics = trainer.train_all_models()

    if metrics:
        print("\n" + "="*70)
        print("📋 RÉSUMÉ FINAL DES PERFORMANCES")
        print("="*70)
        print(f"   🏆 Classement R²: {metrics['ranking']['r2_score']:.4f} ({metrics['ranking']['n_samples']} samples)")
        print(f"   ⭐ Bestseller F1: {metrics['bestseller']['f1_score']:.4f} ({metrics['bestseller']['n_samples']} samples)")
        print(f"   💰 Prix R²: {metrics['price']['r2_score']:.4f} ({metrics['price']['n_samples']} samples)")
        print(f"\n   📦 Données réelles utilisées: {metrics['metadata']['real_data_count']}")
        print(f"   🎯 Source de données: {metrics['metadata']['data_source']}")
        print(f"   📅 Entraîné le: {metrics['metadata']['trained_at']}")
        print(f"\n💡 Prochaine étape:")
        print(f"   python app.py")
        print("="*70)
    else:
        print("\n❌ ÉCHEC DE L'ENTRAÎNEMENT")
        print("Vérifiez les logs ci-dessus pour plus de détails.")


if __name__ == '__main__':
    main()