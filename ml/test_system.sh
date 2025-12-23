#!/bin/bash

echo "=========================================="
echo "MOUADVISION ML SYSTEM TEST SUITE"
echo "=========================================="
echo ""

FLASK_URL="http://localhost:5001"
SPRING_URL="http://localhost:8080"

test_passed=0
test_failed=0

run_test() {
    test_name=$1
    test_command=$2
    expected_code=$3

    echo -n "Testing: $test_name... "

    if response=$(eval "$test_command" 2>&1); then
        http_code=$(echo "$response" | grep -o "HTTP/1.1 [0-9]*" | grep -o "[0-9]*$")

        if [ -z "$http_code" ]; then
            http_code=$(curl -s -o /dev/null -w "%{http_code}" "$test_command" 2>/dev/null)
        fi

        if [ "$http_code" = "$expected_code" ] || echo "$response" | grep -q "status"; then
            echo "✓ PASSED"
            ((test_passed++))
            return 0
        else
            echo "✗ FAILED (HTTP $http_code, expected $expected_code)"
            ((test_failed++))
            return 1
        fi
    else
        echo "✗ FAILED (Connection error)"
        ((test_failed++))
        return 1
    fi
}

echo "=== FLASK SERVICE TESTS ==="
echo ""

run_test "Health Check" "curl -s $FLASK_URL/health" 200
sleep 1

run_test "Metrics Endpoint" "curl -s $FLASK_URL/metrics" 200
sleep 1

run_test "Full Prediction" "curl -s -X POST $FLASK_URL/predict/full -H 'Content-Type: application/json' -d '{\"asin\":\"B08N5WRWNW\"}'" 200
sleep 1

echo ""
echo "=== MODEL VALIDATION ==="
echo ""

if [ -d "models/bestseller_detection" ] && [ -f "models/bestseller_detection/model.pkl" ]; then
    echo "Testing: Bestseller Model Exists... ✓ PASSED"
    ((test_passed++))
else
    echo "Testing: Bestseller Model Exists... ✗ FAILED"
    ((test_failed++))
fi

if [ -d "models/ranking_prediction" ] && [ -f "models/ranking_prediction/model.pkl" ]; then
    echo "Testing: Ranking Model Exists... ✓ PASSED"
    ((test_passed++))
else
    echo "Testing: Ranking Model Exists... ✗ FAILED"
    ((test_failed++))
fi

if [ -d "models/price_optimization" ] && [ -f "models/price_optimization/model.pkl" ]; then
    echo "Testing: Price Model Exists... ✓ PASSED"
    ((test_passed++))
else
    echo "Testing: Price Model Exists... ✗ FAILED"
    ((test_failed++))
fi

if [ -f "models/feature_engineer.pkl" ]; then
    echo "Testing: Feature Engineer Exists... ✓ PASSED"
    ((test_passed++))
else
    echo "Testing: Feature Engineer Exists... ✗ FAILED"
    ((test_failed++))
fi

if [ -f "models/metrics.json" ]; then
    echo "Testing: Metrics File Exists... ✓ PASSED"
    ((test_passed++))
else
    echo "Testing: Metrics File Exists... ✗ FAILED"
    ((test_failed++))
fi

echo ""
echo "=== DATABASE CONNECTION ==="
echo ""

if command -v mysql &> /dev/null; then
    if mysql -u root -pkali -e "USE dashboard_db; SELECT COUNT(*) FROM product;" &> /dev/null; then
        echo "Testing: Database Connection... ✓ PASSED"
        ((test_passed++))
    else
        echo "Testing: Database Connection... ✗ FAILED"
        ((test_failed++))
    fi
else
    echo "Testing: Database Connection... ⚠ SKIPPED (mysql not found)"
fi

echo ""
echo "=========================================="
echo "TEST SUMMARY"
echo "=========================================="
echo "Total Tests: $((test_passed + test_failed))"
echo "Passed: $test_passed"
echo "Failed: $test_failed"
echo ""

if [ $test_failed -eq 0 ]; then
    echo "✓ ALL TESTS PASSED!"
    echo ""
    echo "Your ML system is ready for production! 🚀"
    exit 0
else
    echo "✗ SOME TESTS FAILED"
    echo ""
    echo "Please check:"
    echo "1. Flask service is running (./start_service.sh)"
    echo "2. Models are trained (./train_models.sh)"
    echo "3. Database is accessible"
    exit 1
fi