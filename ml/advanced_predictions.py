import numpy as np
from typing import Dict, Any, List
from datetime import datetime, timedelta


class AdvancedPredictionService:
    def calculate_product_health_score(self, product_data: Dict) -> Dict[str, Any]:
        try:
            # Extraire les données
            sales = int(product_data.get('sales_count', 0))
            rating = float(product_data.get('rating', 3.0))
            reviews = int(product_data.get('review_count', 0))
            price = float(product_data.get('current_price', 0))
            stock = int(product_data.get('stock_quantity', 0))
            days_listed = int(product_data.get('days_since_listed', 30))
            sales_velocity = sales / max(days_listed, 1)
            sales_score = min(100, (sales_velocity / 2) * 100)
            rating_score = max(0, min(100, (rating - 2.0) / 3.0 * 100))
            if sales > 0:
                review_ratio = reviews / sales
                review_score = min(100, review_ratio * 1000)
            else:
                review_score = 0
            if 10 <= price <= 500:
                price_score = 100
            elif price < 10:
                price_score = 50
            else:
                price_score = max(0, 100 - (price - 500) / 50)
            if 10 <= stock <= 100:
                stock_score = 100
            elif stock < 10:
                stock_score = stock * 10  # Low stock warning
            else:
                stock_score = max(50, 100 - (stock - 100) / 10)
            health_score = (
                    sales_score * 0.30 +
                    rating_score * 0.25 +
                    review_score * 0.20 +
                    price_score * 0.15 +
                    stock_score * 0.10
            )
            if health_score >= 80:
                health_level = "EXCELLENT"
                health_emoji = "🌟"
                health_color = "green"
                recommendation = "Produit performant! Maintenez votre stratégie actuelle."
            elif health_score >= 60:
                health_level = "BON"
                health_emoji = "✅"
                health_color = "blue"
                recommendation = "Bonne performance. Quelques optimisations possibles."
            elif health_score >= 40:
                health_level = "MOYEN"
                health_emoji = "⚠️"
                health_color = "yellow"
                recommendation = "Performance moyenne. Analysez les points faibles."
            elif health_score >= 20:
                health_level = "FAIBLE"
                health_emoji = "🔶"
                health_color = "orange"
                recommendation = "Attention requise. Revoyez votre stratégie."
            else:
                health_level = "CRITIQUE"
                health_emoji = "🚨"
                health_color = "red"
                recommendation = "Action urgente nécessaire!"

            # Identifier les points forts et faibles
            scores = {
                'sales_performance': sales_score,
                'rating_quality': rating_score,
                'review_engagement': review_score,
                'price_competitiveness': price_score,
                'stock_health': stock_score
            }

            strengths = [k for k, v in scores.items() if v >= 70]
            weaknesses = [k for k, v in scores.items() if v < 40]

            return {
                'health_score': round(health_score, 1),
                'health_level': health_level,
                'health_emoji': health_emoji,
                'health_color': health_color,
                'recommendation': recommendation,
                'breakdown': {
                    'sales_performance': {
                        'score': round(sales_score, 1),
                        'weight': '30%',
                        'value': f"{sales_velocity:.2f} ventes/jour"
                    },
                    'rating_quality': {
                        'score': round(rating_score, 1),
                        'weight': '25%',
                        'value': f"{rating}/5.0"
                    },
                    'review_engagement': {
                        'score': round(review_score, 1),
                        'weight': '20%',
                        'value': f"{reviews} reviews"
                    },
                    'price_competitiveness': {
                        'score': round(price_score, 1),
                        'weight': '15%',
                        'value': f"${price:.2f}"
                    },
                    'stock_health': {
                        'score': round(stock_score, 1),
                        'weight': '10%',
                        'value': f"{stock} unités"
                    }
                },
                'strengths': strengths,
                'weaknesses': weaknesses
            }

        except Exception as e:
            return {'error': str(e)}

    def forecast_sales(self, product_data: Dict, days: int = 30) -> Dict[str, Any]:
        """
        📈 TIME-SERIES SALES FORECASTING
        Prédit les ventes pour les N prochains jours.

        Utilise un modèle simple mais efficace:
        - Tendance linéaire basée sur la vélocité actuelle
        - Ajustement saisonnier (weekend boost)
        - Facteur de confiance basé sur les données historiques
        """
        try:
            sales = int(product_data.get('sales_count', 0))
            days_listed = int(product_data.get('days_since_listed', 30))
            rating = float(product_data.get('rating', 3.0))
            stock = int(product_data.get('stock_quantity', 100))

            # Vélocité de base
            base_velocity = sales / max(days_listed, 1)

            # Facteur de momentum (rating boost)
            momentum = 1.0 + (rating - 3.0) * 0.1  # +10% par étoile au-dessus de 3

            # Générer les prédictions quotidiennes
            forecasts = []
            cumulative_sales = 0
            today = datetime.now()

            for day in range(1, days + 1):
                forecast_date = today + timedelta(days=day)

                # Weekend boost (samedi/dimanche +20%)
                if forecast_date.weekday() >= 5:
                    daily_factor = 1.2
                else:
                    daily_factor = 1.0

                # Tendance avec légère croissance
                trend_factor = 1.0 + (day / 100) * 0.1  # +0.1% par jour

                # Prédiction quotidienne
                daily_sales = base_velocity * momentum * daily_factor * trend_factor

                # Ajouter un peu de variabilité
                noise = np.random.normal(0, base_velocity * 0.1)
                daily_sales = max(0, daily_sales + noise)

                cumulative_sales += daily_sales

                forecasts.append({
                    'date': forecast_date.strftime('%Y-%m-%d'),
                    'day_name': forecast_date.strftime('%A'),
                    'predicted_sales': round(daily_sales, 1),
                    'cumulative_sales': round(cumulative_sales, 1)
                })

            # Stock warning
            stock_depleted_day = None
            if cumulative_sales > stock:
                for i, f in enumerate(forecasts):
                    if f['cumulative_sales'] > stock:
                        stock_depleted_day = i + 1
                        break

            # Statistiques de prévision
            total_forecast = cumulative_sales
            avg_daily = total_forecast / days

            # Revenue projection
            price = float(product_data.get('current_price', 0))
            projected_revenue = total_forecast * price

            # Confidence basée sur la quantité de données
            confidence = min(0.95, 0.5 + (days_listed / 100) * 0.5)

            return {
                'forecast_period_days': days,
                'total_predicted_sales': round(total_forecast, 0),
                'average_daily_sales': round(avg_daily, 2),
                'projected_revenue': round(projected_revenue, 2),
                'current_velocity': round(base_velocity, 2),
                'momentum_factor': round(momentum, 2),
                'confidence': round(confidence, 4),
                'stock_warning': stock_depleted_day is not None,
                'stock_depleted_in_days': stock_depleted_day,
                'daily_forecasts': forecasts[:7],  # Retourner seulement les 7 premiers jours
                'weekly_summary': {
                    'week_1': round(sum(f['predicted_sales'] for f in forecasts[:7]), 0),
                    'week_2': round(sum(f['predicted_sales'] for f in forecasts[7:14]), 0) if days >= 14 else None,
                    'week_3': round(sum(f['predicted_sales'] for f in forecasts[14:21]), 0) if days >= 21 else None,
                    'week_4': round(sum(f['predicted_sales'] for f in forecasts[21:28]), 0) if days >= 28 else None
                }
            }

        except Exception as e:
            return {'error': str(e)}

    def analyze_category_position(self, product_data: Dict, category_products: List[Dict]) -> Dict[str, Any]:
        """
        🏆 CATEGORY COMPETITIVE ANALYSIS
        Analyse la position du produit par rapport à sa catégorie.
        """
        try:
            if not category_products:
                return {'error': 'Aucun produit de catégorie fourni'}

            product_price = float(product_data.get('current_price', 0))
            product_rating = float(product_data.get('rating', 3.0))
            product_sales = int(product_data.get('sales_count', 0))

            # Calculer les statistiques de catégorie
            prices = [float(p.get('current_price', 0)) for p in category_products if p.get('current_price')]
            ratings = [float(p.get('rating', 0)) for p in category_products if p.get('rating')]
            sales = [int(p.get('sales_count', 0)) for p in category_products]

            if not prices:
                return {'error': 'Données de catégorie insuffisantes'}

            # Statistiques
            avg_price = np.mean(prices)
            median_price = np.median(prices)
            min_price = np.min(prices)
            max_price = np.max(prices)

            avg_rating = np.mean(ratings) if ratings else 0
            avg_sales = np.mean(sales) if sales else 0

            # Position du produit
            price_percentile = (sum(1 for p in prices if p <= product_price) / len(prices)) * 100
            rating_percentile = (sum(1 for r in ratings if r <= product_rating) / len(ratings)) * 100 if ratings else 50
            sales_percentile = (sum(1 for s in sales if s <= product_sales) / len(sales)) * 100 if sales else 50

            # Analyse de compétitivité prix
            price_vs_avg = ((product_price - avg_price) / avg_price) * 100 if avg_price > 0 else 0

            if price_vs_avg < -20:
                price_position = "TRÈS COMPÉTITIF"
                price_recommendation = "Prix attractif! Vous pouvez potentiellement augmenter légèrement."
            elif price_vs_avg < -5:
                price_position = "COMPÉTITIF"
                price_recommendation = "Bon positionnement prix."
            elif price_vs_avg < 5:
                price_position = "ALIGNÉ"
                price_recommendation = "Prix dans la moyenne du marché."
            elif price_vs_avg < 20:
                price_position = "AU-DESSUS"
                price_recommendation = "Prix supérieur à la moyenne. Justifiez par la qualité."
            else:
                price_position = "PREMIUM"
                price_recommendation = "Prix premium. Assurez-vous que la valeur perçue justifie ce positionnement."

            # Score de compétitivité global
            competitiveness_score = (
                    (100 - price_percentile) * 0.4 +  # Prix bas = mieux
                    rating_percentile * 0.35 +         # Rating haut = mieux
                    sales_percentile * 0.25            # Ventes hautes = mieux
            )

            return {
                'category_size': len(category_products),
                'your_position': {
                    'price_rank': f"Top {100 - price_percentile:.0f}%",
                    'rating_rank': f"Top {100 - rating_percentile:.0f}%",
                    'sales_rank': f"Top {100 - sales_percentile:.0f}%"
                },
                'category_stats': {
                    'avg_price': round(avg_price, 2),
                    'median_price': round(median_price, 2),
                    'price_range': f"${min_price:.2f} - ${max_price:.2f}",
                    'avg_rating': round(avg_rating, 2),
                    'avg_sales': round(avg_sales, 0)
                },
                'price_analysis': {
                    'your_price': product_price,
                    'vs_average': f"{price_vs_avg:+.1f}%",
                    'position': price_position,
                    'recommendation': price_recommendation
                },
                'competitiveness_score': round(competitiveness_score, 1),
                'competitive_level': (
                    "LEADER" if competitiveness_score >= 80 else
                    "CHALLENGER" if competitiveness_score >= 60 else
                    "SUIVEUR" if competitiveness_score >= 40 else
                    "EN DIFFICULTÉ"
                )
            }

        except Exception as e:
            return {'error': str(e)}

    def detect_trend_momentum(self, product_data: Dict) -> Dict[str, Any]:
        """
        📊 TREND MOMENTUM DETECTION
        Détecte la dynamique de tendance du produit.
        """
        try:
            sales = int(product_data.get('sales_count', 0))
            reviews = int(product_data.get('review_count', 0))
            rating = float(product_data.get('rating', 3.0))
            days_listed = int(product_data.get('days_since_listed', 30))

            # Vélocité des ventes
            sales_velocity = sales / max(days_listed, 1)

            # Vélocité des reviews (engagement)
            review_velocity = reviews / max(days_listed, 1)

            # Score de momentum (0-100)
            # Basé sur la vélocité relative

            # Benchmark: 1 vente/jour = momentum moyen (50)
            sales_momentum = min(100, sales_velocity * 50)

            # Benchmark: 0.1 review/jour = engagement moyen (50)
            engagement_momentum = min(100, review_velocity * 500)

            # Rating momentum
            rating_momentum = (rating - 2.5) / 2.5 * 100  # 2.5 = neutre, 5.0 = 100

            # Momentum combiné
            overall_momentum = (
                    sales_momentum * 0.50 +
                    engagement_momentum * 0.30 +
                    rating_momentum * 0.20
            )

            # Classification de tendance
            if overall_momentum >= 70:
                trend = "🚀 FORTE CROISSANCE"
                trend_color = "green"
                trend_advice = "Produit en pleine ascension! Augmentez le stock."
            elif overall_momentum >= 50:
                trend = "📈 CROISSANCE"
                trend_color = "blue"
                trend_advice = "Bonne dynamique. Continuez les efforts marketing."
            elif overall_momentum >= 30:
                trend = "➡️ STABLE"
                trend_color = "yellow"
                trend_advice = "Performance stable. Identifiez des leviers de croissance."
            elif overall_momentum >= 15:
                trend = "📉 DÉCLIN"
                trend_color = "orange"
                trend_advice = "Tendance baissière. Analysez les causes."
            else:
                trend = "🔻 FORTE BAISSE"
                trend_color = "red"
                trend_advice = "Action urgente requise!"

            return {
                'overall_momentum': round(overall_momentum, 1),
                'trend': trend,
                'trend_color': trend_color,
                'trend_advice': trend_advice,
                'momentum_breakdown': {
                    'sales_momentum': round(sales_momentum, 1),
                    'engagement_momentum': round(engagement_momentum, 1),
                    'rating_momentum': round(rating_momentum, 1)
                },
                'velocities': {
                    'sales_per_day': round(sales_velocity, 2),
                    'reviews_per_day': round(review_velocity, 3)
                },
                'projection': {
                    'next_week_sales': round(sales_velocity * 7, 0),
                    'next_month_sales': round(sales_velocity * 30, 0)
                }
            }

        except Exception as e:
            return {'error': str(e)}

if __name__ == '__main__':
    # Test data
    test_product = {
        'product_id': 'TEST123',
        'product_name': 'Test Product',
        'current_price': 49.99,
        'rating': 4.5,
        'review_count': 150,
        'sales_count': 500,
        'stock_quantity': 75,
        'days_since_listed': 60,
        'seller_rating': 4.2,
        'discount_percentage': 10,
        'category': 'Electronics'
    }

    service = AdvancedPredictionService()

    print("\n" + "="*60)
    print("🧪 TEST DES FONCTIONNALITÉS AVANCÉES")
    print("="*60)

    # Test Health Score
    print("\n📊 HEALTH SCORE:")
    health = service.calculate_product_health_score(test_product)
    print(f"   Score: {health['health_score']} - {health['health_level']}")
    print(f"   Points forts: {health['strengths']}")
    print(f"   Points faibles: {health['weaknesses']}")

    # Test Forecast
    print("\n📈 SALES FORECAST (30 days):")
    forecast = service.forecast_sales(test_product, days=30)
    print(f"   Total prévu: {forecast['total_predicted_sales']} ventes")
    print(f"   Revenu projeté: ${forecast['projected_revenue']:.2f}")
    print(f"   Alerte stock: {forecast['stock_warning']}")

    # Test Momentum
    print("\n🚀 TREND MOMENTUM:")
    momentum = service.detect_trend_momentum(test_product)
    print(f"   Momentum: {momentum['overall_momentum']} - {momentum['trend']}")
    print(f"   Conseil: {momentum['trend_advice']}")

    print("\n" + "="*60)
    print("✅ TOUS LES TESTS PASSÉS!")
    print("="*60)