"""
Script d'entraînement des modèles ML - DONNÉES RÉELLES DE LA PLATEFORME
Plateforme MouadVision - Mini Projet JEE 2025
"""

import os
import json
import joblib
import requests
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
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
            # Extraire les infos de pagination
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
        page_size = 100  # Demander 100 items par page
        total_pages = 1

        print(f"\n🔄 Récupération de tous les {item_name}...")

        while page < total_pages:
            try:
                # Construire l'URL avec pagination
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
                        print(f"   Page {page + 1}/{total_pages}:  {len(items)} {item_name} (total: {len(all_items)})")

                    page += 1

                    # Si on n'a pas d'info de pagination et qu'on a des items, continuer
                    if total_pages == 1 and len(items) == page_size:
                        total_pages = page + 1  # Il y a peut-être plus de pages

                    # Si on a moins d'items que la taille de page, c'est la dernière page
                    if len(items) < page_size:
                        break
                else:
                    print(f"   ❌ Erreur page {page}:  Status {response.status_code}")
                    break

            except Exception as e:
                print(f"   ❌ Erreur page {page}: {str(e)[: 50]}")
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
                print(f"✅ Total:  {len(products)} produits récupérés depuis {endpoint}")
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

        print("⚠️ Aucune commande récupérée (ce n'est pas bloquant)")
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
    """Entraîne les modèles ML sur les données réelles de la plateforme."""

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
        print("\n" + "="*60)
        print("📥 CHARGEMENT DES DONNÉES RÉELLES DE LA PLATEFORME")
        print("="*60)

        # Authentification
        if not self.data_loader.authenticate():
            print("⚠️ Authentification échouée, tentative sans auth...")

        # Récupérer les données
        products = self.data_loader.fetch_products()
        orders = self.data_loader.fetch_orders()
        categories = self.data_loader.fetch_categories()

        if not products:
            print("\n⚠️ Aucun produit trouvé, utilisation de données synthétiques")
            return None

        # Mapping des catégories
        category_map = {}
        for cat in categories:
            cat_id = cat.get('id')
            cat_name = cat.get('name') or cat.get('categoryName')
            if cat_id and cat_name:
                category_map[str(cat_id)] = cat_name

        # Calculer les ventes par produit depuis les commandes
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

        # Transformer les produits en DataFrame
        data = []
        skipped = 0

        for product in products:
            try:
                asin = product.get('asin') or product.get('id') or product.get('productId')
                if not asin:
                    skipped += 1
                    continue

                # Prix
                price = product.get('price')
                if isinstance(price, dict):
                    price = price.get('amount', 0)
                elif isinstance(price, str):
                    price = float(price.replace('$', '').replace(',', '').strip())
                price = float(price) if price else 0

                if price <= 0:
                    skipped += 1
                    continue

                # Rating
                rating = product.get('rating')
                if isinstance(rating, dict):
                    rating = rating.get('value', 0)
                rating = float(rating) if rating else 3.0
                rating = min(5.0, max(1.0, rating))

                # Reviews
                reviews = (product.get('reviewsCount') or product.get('reviews_count') or
                           product.get('reviewCount') or product.get('reviews') or 0)
                reviews = int(reviews) if reviews else 0

                # Sales
                sales = (product.get('salesCount') or product.get('sales_count') or
                         product.get('sales') or product_sales.get(str(asin), 0))
                sales = int(sales) if sales else 0

                # Stock
                stock = (product.get('stockQuantity') or product.get('stock_quantity') or
                         product.get('stock') or 100)
                stock = int(stock) if stock else 0

                # Catégorie
                category = product.get('category')
                if isinstance(category, dict):
                    category = category.get('name') or category.get('categoryName')
                elif category:
                    category = category_map.get(str(category), str(category))

                cat_name = product.get('categoryName')
                if not category and cat_name:
                    category = cat_name

                category = str(category) if category else 'Electronics'

                # Jours depuis création
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

                # Seller rating
                seller = product.get('seller')
                seller_rating = 4.0
                if isinstance(seller, dict):
                    seller_rating = float(seller.get('rating', 4.0))
                seller_rating = min(5.0, max(1.0, seller_rating))

                # Discount
                discount = product.get('discountPercentage') or product.get('discount') or 0
                discount = min(100, max(0, float(discount)))

                # Ranking
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
            print("\n⚠️ Aucune donnée valide extraite")
            return None

        df = pd.DataFrame(data)
        self.real_data_count = len(df)

        print(f"\n" + "="*60)
        print(f"✅ {len(df)} PRODUITS CHARGÉS DEPUIS LA PLATEFORME!")
        if skipped > 0:
            print(f"   ({skipped} produits ignorés - prix invalide ou données manquantes)")
        print("="*60)
        print(f"\n📊 Statistiques des données réelles:")
        print(f"   - Catégories: {df['category'].nunique()}")
        for cat in df['category'].unique():
            count = len(df[df['category'] == cat])
            avg_price = df[df['category'] == cat]['current_price'].mean()
            print(f"      • {cat}: {count} produits (prix moy: ${avg_price:.2f})")
        print(f"   - Prix moyen: ${df['current_price'].mean():.2f}")
        print(f"   - Prix min/max: ${df['current_price'].min():.2f} - ${df['current_price'].max():.2f}")
        print(f"   - Rating moyen: {df['rating'].mean():.2f}")
        print(f"   - Ventes totales: {df['sales_count'].sum()}")

        return df

    def augment_data(self, df, min_samples=1500):
        """Augmente les données si insuffisantes."""
        if df is None or len(df) == 0:
            print("\n⚠️ Pas de données réelles, génération de données synthétiques...")
            return self._generate_synthetic_data(min_samples)

        current_count = len(df)

        if current_count >= min_samples:
            print(f"\n✅ Données suffisantes:  {current_count} échantillons")
            return df

        print(f"\n🔄 Augmentation des données:  {current_count} → {min_samples}")

        # Calculer les stats par catégorie avec gestion des NaN
        category_stats = {}
        global_stats = {
            'price_mean': df['current_price'].mean(),
            'price_std':  df['current_price'].std() if len(df) > 1 else df['current_price'].mean() * 0.3,
            'rating_mean':  df['rating'].mean(),
            'rating_std': df['rating'].std() if len(df) > 1 else 0.3,
            'sales_mean':  df['sales_count'].mean(),
            'sales_std': df['sales_count'].std() if len(df) > 1 else max(df['sales_count'].mean() * 0.5, 10),
        }

        for category in df['category'].unique():
            cat_data = df[df['category'] == category]
            n = len(cat_data)

            # Utiliser les stats globales si une seule valeur dans la catégorie
            price_std = cat_data['current_price'].std() if n > 1 else global_stats['price_std']
            rating_std = cat_data['rating'].std() if n > 1 else global_stats['rating_std']
            sales_std = cat_data['sales_count'].std() if n > 1 else global_stats['sales_std']

            # Remplacer NaN par des valeurs par défaut
            if pd.isna(price_std) or price_std == 0:
                price_std = cat_data['current_price'].mean() * 0.3
            if pd.isna(rating_std) or rating_std == 0:
                rating_std = 0.3
            if pd.isna(sales_std) or sales_std == 0:
                sales_std = max(cat_data['sales_count'].mean() * 0.5, 10)

            category_stats[category] = {
                'price_mean': cat_data['current_price'].mean(),
                'price_std':  price_std,
                'price_min': cat_data['current_price'].min(),
                'price_max': cat_data['current_price'].max(),
                'rating_mean': cat_data['rating'].mean(),
                'rating_std': rating_std,
                'sales_mean': cat_data['sales_count'].mean(),
                'sales_std': sales_std,
                'count': n
            }

        # Générer des données synthétiques
        synthetic_data = []
        samples_needed = min_samples - current_count

        cat_weights = {cat: stats['count'] / current_count for cat, stats in category_stats.items()}

        np.random.seed(42)

        for i in range(samples_needed):
            category = np.random.choice(list(cat_weights.keys()), p=list(cat_weights.values()))
            stats = category_stats[category]

            # Générer les valeurs avec protection contre NaN
            price = np.clip(
                np.random.normal(stats['price_mean'], stats['price_std']),
                max(stats['price_min'] * 0.5, 1),
                stats['price_max'] * 1.5
            )

            rating = np.clip(np.random.normal(stats['rating_mean'], stats['rating_std']), 1.0, 5.0)

            # Protection contre NaN pour sales
            sales_mean = stats['sales_mean'] if not pd.isna(stats['sales_mean']) else 10
            sales_std = stats['sales_std'] if not pd.isna(stats['sales_std']) else 5
            sales = max(0, int(np.random.normal(sales_mean, sales_std)))

            synthetic_data.append({
                'product_id': f'SYN_{i}',
                'product_name': f'Synthetic Product {i}',
                'category': category,
                'current_price': round(max(1, price), 2),
                'rating': round(rating, 1),
                'review_count': max(0, int(sales * np.random.uniform(0.05, 0.15))),
                'sales_count': sales,
                'stock_quantity': max(0, int(100 - sales * 0.2 + np.random.normal(0, 20))),
                'days_since_listed': np.random.randint(1, 365),
                'seller_rating':  round(np.clip(np.random.normal(4.2, 0.3), 3.0, 5.0), 1),
                'discount_percentage': np.random.choice([0, 0, 0, 5, 10, 15, 20]),
                'current_ranking': 0
            })

        synthetic_df = pd.DataFrame(synthetic_data)
        combined_df = pd.concat([df, synthetic_df], ignore_index=True)

        print(f"✅ Données augmentées: {len(combined_df)} échantillons")
        print(f"   - Données réelles: {current_count} ({current_count/len(combined_df)*100:.1f}%)")
        print(f"   - Données synthétiques:  {samples_needed} ({samples_needed/len(combined_df)*100:.1f}%)")

        return combined_df

    def _generate_synthetic_data(self, n_samples):
        """Génère des données synthétiques basées sur vos vraies catégories."""
        print("\n⚠️ Génération de données 100% synthétiques...")

        categories = {
            'Electronics': {'price_range': (8, 3000), 'avg_price': 282, 'avg_rating': 4.3, 'weight': 0.20},
            'Video Games': {'price_range': (4, 808), 'avg_price': 60, 'avg_rating': 4.4, 'weight': 0.16},
            'Clothing, Shoes & Jewelry': {'price_range': (4, 100), 'avg_price': 19, 'avg_rating': 4.2, 'weight':  0.19},
            'Camera & Photo': {'price_range': (8, 160), 'avg_price': 52, 'avg_rating': 4.2, 'weight': 0.13},
            'Gift Cards': {'price_range': (5, 207), 'avg_price': 43, 'avg_rating': 4.7, 'weight': 0.09},
            'Toys & Games': {'price_range':  (4, 112), 'avg_price': 18, 'avg_rating': 4.5, 'weight': 0.16},
            'Books':  {'price_range': (3, 27), 'avg_price': 12, 'avg_rating': 4.6, 'weight': 0.07}
        }

        np.random.seed(42)
        data = []

        cat_names = list(categories.keys())
        cat_weights = [categories[c]['weight'] for c in cat_names]
        cat_weights = [w / sum(cat_weights) for w in cat_weights]

        for i in range(n_samples):
            category = np.random.choice(cat_names, p=cat_weights)
            cat_info = categories[category]

            price = np.clip(
                np.random.normal(cat_info['avg_price'], cat_info['avg_price'] * 0.4),
                cat_info['price_range'][0],
                cat_info['price_range'][1]
            )
            rating = np.clip(np.random.normal(cat_info['avg_rating'], 0.3), 1.0, 5.0)
            sales = max(0, int(40 + (rating - 3) * 25 + np.random.normal(0, 15)))

            data.append({
                'product_id':  f'SYN_{i}',
                'product_name': f'Product {i}',
                'category': category,
                'current_price': round(price, 2),
                'rating': round(rating, 1),
                'review_count': max(0, int(sales * np.random.uniform(0.05, 0.12))),
                'sales_count': sales,
                'stock_quantity': max(0, int(100 - sales * 0.25 + np.random.normal(0, 15))),
                'days_since_listed': np.random.randint(1, 365),
                'seller_rating': round(np.clip(np.random.normal(4.2, 0.3), 3.0, 5.0), 1),
                'discount_percentage': np.random.choice([0, 0, 5, 10, 15, 20]),
                'current_ranking': 0
            })

        return pd.DataFrame(data)

    def prepare_training_data(self, df):
        """Prépare les variables cibles pour l'entraînement."""
        df = df.copy()

        # Score de ranking
        df['ranking_score'] = (
                0.35 * (df['sales_count'] / max(df['sales_count'].max(), 1)) +
                0.25 * (df['rating'] / 5.0) +
                0.20 * (df['review_count'] / max(df['review_count'].max(), 1)) +
                0.10 * (df['seller_rating'] / 5.0) +
                0.05 * (df['discount_percentage'] / 50.0) +
                0.05 * (1 - df['days_since_listed'] / max(df['days_since_listed'].max(), 1))
        )

        df['current_ranking'] = df['ranking_score'].rank(ascending=False).astype(int)

        # Ranking futur
        n = len(df)
        sales_velocity = df['sales_count'] / np.maximum(df['days_since_listed'], 1)
        velocity_norm = (sales_velocity - sales_velocity.min()) / max(sales_velocity.max() - sales_velocity.min(), 1)
        trend = np.where(velocity_norm > 0.5, -25, 25)
        noise = np.random.normal(0, 35, n)
        df['future_ranking'] = np.clip(df['current_ranking'] + trend + noise, 1, n).astype(int)

        # Bestsellers
        sales_threshold = df['sales_count'].quantile(0.85)
        df['is_bestseller'] = (
                (df['sales_count'] >= sales_threshold) |
                (df['ranking_score'] > df['ranking_score'].quantile(0.85))
        ).astype(int)

        # Prix optimal
        demand_factor = df['sales_count'] / max(df['sales_count'].mean(), 1)
        rating_premium = (df['rating'] - 3.5) / 1.5
        df['optimal_price'] = df['current_price'] * (0.85 + 0.25 * np.clip(demand_factor, 0.5, 1.5) + 0.1 * rating_premium)

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

    def train_ranking_model(self, df, features):
        """Entraîne le modèle de classement."""
        print("\n" + "="*50)
        print("🏆 ENTRAÎNEMENT:  Modèle de Classement Futur")
        print("="*50)

        X = df[features].values
        y = df['future_ranking'].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        model = RandomForestRegressor(n_estimators=200, max_depth=15, min_samples_split=5, random_state=42, n_jobs=-1)

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
        print(f"📊 CV R² (5-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['ranking'] = model
        self.training_metrics['ranking'] = {
            'r2_score': float(r2), 'rmse': float(rmse), 'mae': float(mae),
            'mse': float(rmse**2), 'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp
        }

        print(f"✅ R²: {r2:.4f} | RMSE: {rmse:.2f} | MAE: {mae:.2f}")
        return model

    def train_bestseller_model(self, df, features):
        """Entraîne le modèle bestseller."""
        print("\n" + "="*50)
        print("⭐ ENTRAÎNEMENT: Modèle Bestseller")
        print("="*50)

        X = df[features].values
        y = df['is_bestseller'].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        model = RandomForestClassifier(n_estimators=200, max_depth=12, class_weight='balanced', random_state=42, n_jobs=-1)

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='f1')
        print(f"📊 CV F1 (5-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

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

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['bestseller'] = model
        self.training_metrics['bestseller'] = {
            'accuracy': float(acc), 'precision': float(prec), 'recall': float(rec),
            'f1_score': float(f1), 'auc_roc': float(auc), 'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp
        }

        print(f"✅ F1: {f1:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | AUC: {auc:.4f}")
        return model

    def train_price_model(self, df, features):
        """Entraîne le modèle de prix."""
        print("\n" + "="*50)
        print("💰 ENTRAÎNEMENT:  Modèle de Prix Optimal")
        print("="*50)

        X = df[features].values
        y = df['optimal_price'].values

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        X_train_scaled = self.scaler.transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        model = GradientBoostingRegressor(n_estimators=200, max_depth=8, learning_rate=0.08, random_state=42)

        cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5, scoring='r2')
        print(f"📊 CV R² (5-fold): {cv_scores.mean():.4f} (+/- {cv_scores.std()*2:.4f})")

        model.fit(X_train_scaled, y_train)

        y_pred = model.predict(X_test_scaled)
        r2 = r2_score(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mae = mean_absolute_error(y_test, y_pred)
        mape = np.mean(np.abs((y_test - y_pred) / np.maximum(y_test, 0.01))) * 100

        feat_imp = dict(zip(features, model.feature_importances_.tolist()))
        sorted_imp = dict(sorted(feat_imp.items(), key=lambda x: x[1], reverse=True))

        self.models['price'] = model
        self.training_metrics['price'] = {
            'r2_score': float(r2), 'rmse': float(rmse), 'mae': float(mae),
            'mse': float(rmse**2), 'mape': float(mape), 'cv_score_mean': float(cv_scores.mean()),
            'feature_importance': sorted_imp
        }

        print(f"✅ R²: {r2:.4f} | RMSE: ${rmse:.2f} | MAPE: {mape:.2f}%")
        return model

    def save_models(self):
        """Sauvegarde les modèles."""
        print("\n" + "="*50)
        print("💾 SAUVEGARDE DES MODÈLES")
        print("="*50)

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
            'version': '3.0.0',
            'real_data_count': self.real_data_count,
            'data_source': 'real_platform_data' if self.real_data_count > 0 else 'synthetic_data'
        }

        with open(Config.get_model_path(Config.METRICS_FILE), 'w', encoding='utf-8') as f:
            json.dump(self.training_metrics, f, indent=2, ensure_ascii=False)
        print(f"✅ Métriques sauvegardées")

        print("\n🎉 MODÈLES SAUVEGARDÉS AVEC SUCCÈS!")

    def train_all_models(self):
        """Entraîne tous les modèles."""
        print("\n" + "="*60)
        print("🚀 ENTRAÎNEMENT SUR DONNÉES RÉELLES")
        print("   Plateforme MouadVision - Mini Projet JEE 2025")
        print("="*60)

        # Charger les vraies données
        real_data = self.load_real_data()

        # Augmenter si nécessaire
        df = self.augment_data(real_data, min_samples=1500)

        # Préparer les données
        df = self.prepare_training_data(df)

        print(f"\n📊 Résumé des données d'entraînement:")
        print(f"   - Total:  {len(df)} échantillons")
        print(f"   - Données réelles: {self.real_data_count}")
        print(f"   - Catégories: {df['category'].nunique()}")
        print(f"   - Bestsellers: {df['is_bestseller'].sum()} ({df['is_bestseller'].mean()*100:.1f}%)")

        # Préparer les features
        df_prepared, features = self.prepare_features(df)
        print(f"   - Features:  {len(features)}")

        # Entraîner les modèles
        self.train_ranking_model(df_prepared, features)
        self.train_bestseller_model(df_prepared, features)
        self.train_price_model(df_prepared, features)

        # Sauvegarder
        self.save_models()

        print("\n" + "="*60)
        print("✅ ENTRAÎNEMENT TERMINÉ!")
        print("="*60)

        return self.training_metrics


def main():
    trainer = PredictiveModelTrainer()
    metrics = trainer.train_all_models()

    print("\n" + "="*50)
    print("📋 RÉSUMÉ FINAL DES PERFORMANCES")
    print("="*50)
    print(f"   🏆 Classement R²: {metrics['ranking']['r2_score']:.4f}")
    print(f"   ⭐ Bestseller F1: {metrics['bestseller']['f1_score']:.4f}")
    print(f"   💰 Prix R²: {metrics['price']['r2_score']:.4f}")
    print(f"\n   📦 Données réelles utilisées: {metrics['metadata']['real_data_count']}")
    print(f"\n🎯 Démarrez le service:  python app.py")


if __name__ == '__main__':
    main()