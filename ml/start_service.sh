#!/bin/bash

echo "======================================"
echo "MOUADVISION ML PREDICTION SERVICE"
echo "======================================"
echo ""

cd "$(dirname "$0")"

if [ ! -d "models/bestseller_detection" ] || [ ! -d "models/ranking_prediction" ] || [ ! -d "models/price_optimization" ]; then
    echo "⚠️  Models not found! Please train models first:"
    echo "   ./train_models.sh"
    echo ""
    exit 1
fi

if [ ! -d "venv" ]; then
    echo "[1/3] Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "[1/3] Virtual environment already exists"
fi

echo ""
echo "[2/3] Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

echo ""
echo "[3/3] Installing dependencies..."
pip install -r requirements.txt -q
echo "✓ Dependencies installed"

echo ""
echo "======================================"
echo "Starting ML Prediction Service..."
echo "======================================"
echo ""

python app.py