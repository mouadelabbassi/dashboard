#!/bin/bash

echo "======================================"
echo "MOUADVISION ML TRAINING PIPELINE"
echo "======================================"
echo ""

cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
    echo "[1/4] Creating virtual environment..."
    python3 -m venv venv
    echo "✓ Virtual environment created"
else
    echo "[1/4] Virtual environment already exists"
fi

echo ""
echo "[2/4] Activating virtual environment..."
source venv/bin/activate
echo "✓ Virtual environment activated"

echo ""
echo "[3/4] Installing dependencies..."
pip install -r requirements.txt -q
echo "✓ Dependencies installed"

echo ""
echo "[4/4] Starting model training..."
python trainers/train_all_models.py

echo ""
echo "======================================"
echo "Training complete!"
echo "======================================"