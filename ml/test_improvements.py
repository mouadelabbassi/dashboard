import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from trainers.train_all_models import ImprovedModelTrainer
from data_loaders.comprehensive_loader import ComprehensiveDataLoader
import json

print("="*80)
print("TESTING IMPROVED ML MODELS")
print("="*80)

# Train models
trainer = ImprovedModelTrainer()
metrics = trainer.train_all_models()

print("\n" + "="*80)
print("PERFORMANCE COMPARISON")
print("="*80)

print("\n📊 TARGET METRICS:")
print("  Bestseller Detection:")
print("    ✓ Accuracy: >95% (keep current level)")
print("    ✓ Precision: >95% (avoid false positives)")
print("  ")
print("  Ranking Prediction:")
print("    ✓ R² Score: >0.5 (was 0.339)")
print("    ✓ Trend Accuracy: >70% (new metric)")
print("    ✓ Within 100 positions: >50% (was 34.5%)")
print("  ")
print("  Price Optimization:")
print("    ✓ MAPE: <30% (was 60.25%)")
print("    ✓ Revenue Improvement: >0%")

print("\n📈 ACTUAL RESULTS:")
print(f"\n  Bestseller Detection:")
print(f"    Accuracy: {metrics['bestseller_detection']['accuracy']:.2%}")
print(f"    Precision: {metrics['bestseller_detection']['precision']:.2%}")
print(f"    Recall: {metrics['bestseller_detection']['recall']:.2%}")

print(f"\n  Ranking Prediction:")
print(f"    R² Score: {metrics['ranking_prediction']['r2_score']:.3f}")
print(f"    Trend Accuracy: {metrics['ranking_prediction'].get('trend_accuracy', 0):.1%} 🎯")
print(f"    Within 100 positions: {metrics['ranking_prediction']['within_100_positions']:.1%}")

print(f"\n  Price Optimization:")
print(f"    MAPE: {metrics['price_optimization']['mape']:.2f}%")
print(f"    Revenue Improvement: {metrics['price_optimization'].get('revenue_improvement_estimate', 0):+.1f}%")
print(f"    Reliable: {metrics['price_optimization']['is_reliable']}")

# Save comparison
comparison = {
    'before': {
        'bestseller': {'accuracy': 0.9763},
        'ranking': {'r2': 0.339, 'mae': 92.26},
        'price': {'mape': 60.25}
    },
    'after': metrics
}

with open('models/improvement_comparison.json', 'w') as f:
    json.dump(comparison, f, indent=2)

print("\n✅ Comparison saved to models/improvement_comparison.json")