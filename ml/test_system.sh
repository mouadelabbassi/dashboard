#!/bin/bash

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🚀 MOUADVISION ML PREDICTION SYSTEM - DEPLOYMENT & TEST SUITE"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

SPRING_URL="http://localhost:8080"
FLASK_URL="http://localhost:5001"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_keyword="$3"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -n "  ⏳ Testing: $test_name... "

    if response=$(eval "$test_command" 2>&1); then
        if echo "$response" | grep -qi "$expected_keyword"; then
            echo -e "${GREEN}✓ PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            return 0
        else
            echo -e "${RED}✗ FAILED${NC} (Expected: $expected_keyword)"
            echo "     Response: $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        echo -e "${RED}✗ FAILED${NC} (Connection error)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

echo "════════════════════════════════════════════════════════════════════════════════"
echo "📋 PHASE 1: PRE-DEPLOYMENT CHECKS"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Check Java
echo "  Checking Java installation..."
if command -v java &> /dev/null; then
    java_version=$(java -version 2>&1 | head -n 1)
    echo -e "  ${GREEN}✓${NC} Java found: $java_version"
else
    echo -e "  ${RED}✗${NC} Java not found! Please install Java 17+"
    exit 1
fi

# Check Python
echo "  Checking Python installation..."
if command -v python3 &> /dev/null; then
    python_version=$(python3 --version)
    echo -e "  ${GREEN}✓${NC} $python_version found"
else
    echo -e "  ${RED}✗${NC} Python3 not found! Please install Python 3.8+"
    exit 1
fi

# Check MySQL
echo "  Checking MySQL connection..."
if mysql -u root -kali -e "USE dashboard_db;" &> /dev/null; then
    product_count=$(mysql -u root -kali -D dashboard_db -se "SELECT COUNT(*) FROM products;")
    echo -e "  ${GREEN}✓${NC} MySQL connected (Products: $product_count)"
else
    echo -e "  ${RED}✗${NC} Cannot connect to MySQL database"
    exit 1
fi

# Check ML Models
echo "  Checking ML models..."
if [ -d "ml/models/bestseller_detection" ] && [ -f "ml/models/bestseller_detection/model.pkl" ]; then
    echo -e "  ${GREEN}✓${NC} Bestseller model found"
else
    echo -e "  ${RED}✗${NC} Bestseller model missing! Run: cd ml && ./train_models.sh"
    exit 1
fi

if [ -d "ml/models/ranking_prediction" ] && [ -f "ml/models/ranking_prediction/model.pkl" ]; then
    echo -e "  ${GREEN}✓${NC} Ranking model found"
else
    echo -e "  ${RED}✗${NC} Ranking model missing!"
    exit 1
fi

if [ -d "ml/models/price_optimization" ] && [ -f "ml/models/price_optimization/model.pkl" ]; then
    echo -e "  ${GREEN}✓${NC} Price optimization model found"
else
    echo -e "  ${RED}✗${NC} Price optimization model missing!"
    exit 1
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "🔧 PHASE 2: DEPLOYING FIXES"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Backup original files
echo "  📦 Creating backups..."
if [ -f "backend/src/main/java/com/dashboard/service/PredictionService.java" ]; then
    cp backend/src/main/java/com/dashboard/service/PredictionService.java \
       backend/src/main/java/com/dashboard/service/PredictionService.java.backup
    echo -e "  ${GREEN}✓${NC} Backed up PredictionService.java"
fi

if [ -f "ml/app.py" ]; then
    cp ml/app.py ml/app.py.backup
    echo -e "  ${GREEN}✓${NC} Backed up app.py"
fi

# Deploy fixes
echo ""
echo "  🚀 Deploying fixes..."
if [ -f "PredictionService_FIXED.java" ]; then
    cp PredictionService_FIXED.java backend/src/main/java/com/dashboard/service/PredictionService.java
    echo -e "  ${GREEN}✓${NC} Deployed fixed PredictionService.java"
else
    echo -e "  ${YELLOW}⚠${NC} PredictionService_FIXED.java not found, skipping..."
fi

if [ -f "app_FIXED.py" ]; then
    cp app_FIXED.py ml/app.py
    echo -e "  ${GREEN}✓${NC} Deployed fixed app.py"
else
    echo -e "  ${YELLOW}⚠${NC} app_FIXED.py not found, skipping..."
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "🔨 PHASE 3: BUILDING SPRING BOOT"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

cd backend
echo "  🔨 Running Maven build..."
if mvn clean package -DskipTests > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Spring Boot build successful"
else
    echo -e "  ${RED}✗${NC} Spring Boot build failed!"
    echo "  Run manually: cd backend && mvn clean package"
    exit 1
fi
cd ..

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "🐍 PHASE 4: STARTING ML SERVICE"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

cd ml
echo "  🐍 Starting Flask ML service..."

# Kill existing Flask process
pkill -f "python.*app.py" 2>/dev/null

# Start Flask in background
nohup python3 app.py > flask.log 2>&1 &
FLASK_PID=$!

echo "  ⏳ Waiting for Flask to start (PID: $FLASK_PID)..."
sleep 5

# Check if Flask is running
if curl -s "$FLASK_URL/health" > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Flask ML service started successfully"
else
    echo -e "  ${RED}✗${NC} Flask failed to start! Check ml/flask.log"
    exit 1
fi
cd ..

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "☕ PHASE 5: STARTING SPRING BOOT"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

cd backend
echo "  ☕ Starting Spring Boot application..."

# Kill existing Spring Boot process
pkill -f "spring-boot" 2>/dev/null

# Start Spring Boot in background
nohup java -jar target/*.jar > spring.log 2>&1 &
SPRING_PID=$!

echo "  ⏳ Waiting for Spring Boot to start (PID: $SPRING_PID)..."
sleep 15

# Check if Spring Boot is running
if curl -s "$SPRING_URL/actuator/health" > /dev/null || curl -s "$SPRING_URL/api/products" > /dev/null; then
    echo -e "  ${GREEN}✓${NC} Spring Boot started successfully"
else
    echo -e "  ${YELLOW}⚠${NC} Spring Boot may still be starting... Check backend/spring.log"
fi
cd ..

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "🧪 PHASE 6: RUNNING INTEGRATION TESTS"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

echo "🐍 Flask ML Service Tests:"
run_test "Health Check" "curl -s $FLASK_URL/health" "healthy"
run_test "Status Endpoint (NEW FIX)" "curl -s $FLASK_URL/status" "operational"
run_test "Metrics Endpoint" "curl -s $FLASK_URL/metrics" "metrics"

echo ""
echo "☕ Spring Boot API Tests:"
run_test "Prediction Count" "curl -s $SPRING_URL/api/predictions/count" "predictionCount"
run_test "Prediction Health" "curl -s $SPRING_URL/api/predictions/health" "springBootService"

echo ""
echo "🔮 Prediction Generation Tests:"
echo "  Testing single prediction generation..."

# Get first product ASIN
FIRST_ASIN=$(mysql -u root -pkali -D dashboard_db -se "SELECT asin FROM products LIMIT 1;" 2>/dev/null)

if [ -n "$FIRST_ASIN" ]; then
    echo "  Using product ASIN: $FIRST_ASIN"

    # Test prediction generation
    response=$(curl -s -X POST "$SPRING_URL/api/predictions/generate/$FIRST_ASIN" \
        -H "Content-Type: application/json" 2>&1)

    if echo "$response" | grep -qi "productId\|productAsin"; then
        echo -e "  ${GREEN}✓${NC} Single prediction generation WORKS!"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗${NC} Prediction generation failed"
        echo "  Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    echo ""
    echo "  🚀 Testing sync batch generation (10 products)..."
    response=$(curl -s -X POST "$SPRING_URL/api/predictions/generate/sync?limit=10" 2>&1)

    if echo "$response" | grep -qi "successCount"; then
        success_count=$(echo "$response" | grep -o '"successCount":[0-9]*' | grep -o '[0-9]*')
        echo -e "  ${GREEN}✓${NC} Batch generation completed: $success_count successes"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "  ${RED}✗${NC} Batch generation failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    echo -e "  ${YELLOW}⚠${NC} No products found in database"
fi

echo ""
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📊 TEST RESULTS SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Total Tests:   $TOTAL_TESTS"
echo -e "  ${GREEN}Passed:        $PASSED_TESTS${NC}"
echo -e "  ${RED}Failed:        $FAILED_TESTS${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════════════════"
    echo "✅ ALL TESTS PASSED! YOUR PREDICTION SYSTEM IS FULLY OPERATIONAL! 🎉"
    echo "════════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Access Swagger UI: http://localhost:8080/swagger-ui.html"
    echo "  2. Test predictions: POST /api/predictions/generate/{productId}"
    echo "  3. View stats: GET /api/predictions/stats"
    echo "  4. Check Flask logs: tail -f ml/flask.log"
    echo "  5. Check Spring logs: tail -f backend/spring.log"
    echo ""
    echo "🔥 Key Fixes Applied:"
    echo "  ✅ Transaction isolation (REQUIRES_NEW) prevents cascade failures"
    echo "  ✅ Defensive null checking in prediction mapping"
    echo "  ✅ Added missing /status endpoint to Flask"
    echo "  ✅ Each prediction now runs independently"
    echo ""
    exit 0
else
    echo -e "${RED}════════════════════════════════════════════════════════════════════════════════"
    echo "❌ SOME TESTS FAILED - CHECK LOGS FOR DETAILS"
    echo "════════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check Flask logs: tail -f ml/flask.log"
    echo "  2. Check Spring logs: tail -f backend/spring.log"
    echo "  3. Check database: mysql -u root -pkali -D dashboard_db"
    echo "  4. Verify models: ls -la ml/models/"
    echo ""
    exit 1
fi