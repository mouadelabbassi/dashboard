import pandas as pd
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from data_loaders.comprehensive_loader import ComprehensiveDataLoader
from feature_engineering.hybrid_features import HybridFeatureEngineer

print("="*80)
print("DATA DIAGNOSTIC REPORT")
print("="*80)

loader = ComprehensiveDataLoader()
df = loader.load_all_data()

print(f"\n1. DATA VOLUME:")
print(f"   Total products: {len(df)}")
print(f"   Products with sales: {df['has_sales'].sum()}")
print(f"   Products with Amazon rank: {df['has_amazon_data'].sum()}")

print(f"\n2. AMAZON RANK ANALYSIS:")
print(f"   Non-null amazon_rank: {df['amazon_rank'].notna().sum()}")
print(f"   Null amazon_rank: {df['amazon_rank'].isna().sum()}")
print(f"   Amazon rank range: {df['amazon_rank'].min():.0f} - {df['amazon_rank'].max():.0f}")
print(f"   Amazon rank mean: {df['amazon_rank'].mean():.2f}")

print(f"\n3. SALES DATA:")
print(f"   Total units sold: {df['total_units_sold'].sum():.0f}")
print(f"   Avg units per product: {df['total_units_sold'].mean():.2f}")
print(f"   Max units for single product: {df['total_units_sold'].max():.0f}")
print(f"   Products with >10 sales: {(df['total_units_sold'] > 10).sum()}")

print(f"\n4. PRICE DISTRIBUTION:")
print(f"   Price range: ${df['price'].min():.2f} - ${df['price'].max():.2f}")
print(f"   Price mean: ${df['price'].mean():.2f}")
print(f"   Price median: ${df['price'].median():.2f}")
print(f"   Platform avg: ${df[df['product_source']=='Platform']['price'].mean():.2f}")
print(f"   Seller avg: ${df[df['product_source']=='Seller']['price'].mean():.2f}")

print(f"\n5. PRODUCT SOURCE:")
print(f"   Platform products: {(df['product_source']=='Platform').sum()}")
print(f"   Seller products: {(df['product_source']=='Seller').sum()}")
print(f"   Platform with sales: {((df['product_source']=='Platform') & (df['has_sales']==1)).sum()}")
print(f"   Seller with sales: {((df['product_source']=='Seller') & (df['has_sales']==1)).sum()}")

print(f"\n6. BESTSELLER DISTRIBUTION:")
category_stats = loader.get_category_statistics(df)
engineer = HybridFeatureEngineer(category_stats=category_stats)
df_eng, _ = engineer.fit_transform(df)
print(f"   Bestsellers: {df_eng['is_bestseller'].sum()}")
print(f"   Non-bestsellers: {(df_eng['is_bestseller']==0).sum()}")
print(f"   Bestseller ratio: {df_eng['is_bestseller'].mean():.2%}")

print(f"\n7. FEATURE CORRELATION WITH SALES:")
correlations = df_eng[[
    'amazon_rank', 'amazon_rating', 'amazon_reviews', 'price',
    'sales_velocity', 'product_source_binary', 'total_units_sold'
]].corr()['total_units_sold'].sort_values(ascending=False)
print(correlations)

print(f"\n8. SAMPLE DATA (First 5 products with sales):")
sample = df_eng[df_eng['has_sales']==1][[
    'asin', 'price', 'amazon_rank', 'total_units_sold',
    'sales_velocity', 'product_source', 'is_bestseller'
]].head()
print(sample.to_string())

print(f"\n9. NULL VALUE ANALYSIS:")
null_counts = df.isnull().sum()
print(null_counts[null_counts > 0])

print(f"\n10. RECOMMENDATIONS:")
if df['has_amazon_data'].sum() < len(df) * 0.5:
    print("   ⚠️  Less than 50% of products have Amazon rank data")
    print("   → Consider using platform_rank as primary target")

if df['has_sales'].sum() < 50:
    print("   ⚠️  Very few products with sales (<50)")
    print("   → Not enough data for reliable price optimization")

if (df['product_source']=='Seller').sum() < 20:
    print("   ⚠️  Very few seller products")
    print("   → Product source feature may not be reliable")

print("\n" + "="*80)