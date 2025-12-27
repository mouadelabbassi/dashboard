#!/bin/bash

API_URL="http://localhost:5001"

echo "=================================="
echo "ML Service API Test Script"
echo "=================================="

echo -e "\n1. Health Check"
curl -s $API_URL/health | python -m json.tool

echo -e "\n\n2. Train Bestseller Model"
curl -s -X POST $API_URL/train/bestseller | python -m json.tool

echo -e "\n\n3. Train Ranking Model"
curl -s -X POST $API_URL/train/ranking | python -m json.tool

echo -e "\n\n4. Test Bestseller Prediction"
curl -s -X POST $API_URL/predict/bestseller \
  -H "Content-Type: application/json" \
  -d '{
    "asin": "TEST123",
    "product_name": "Test Product",
    "price": 29.99,
    "rating": 4.5,
    "reviews_count": 150,
    "sales_count": 50,
    "ranking": 100,
    "stock_quantity": 100,
    "discount_percentage": 10.0,
    "days_since_listed": 30
  }' | python -m json.tool

echo -e "\n\n5. Test Complete Prediction"
curl -s -X POST $API_URL/predict/complete \
  -H "Content-Type: application/json" \
  -d '{
    "asin": "TEST123",
    "product_name": "Test Product",
    "price": 29.99,
    "rating": 4.5,
    "reviews_count": 150,
    "sales_count": 50,
    "ranking": 100,
    "stock_quantity": 100,
    "category_avg_price": 35.00,
    "category_min_price": 20.00,
    "category_max_price": 50.00
  }' | python -m json.tool

echo -e "\n\n=================================="
echo "API Test Complete"
echo "=================================="