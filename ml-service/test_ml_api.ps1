
Write-Host "ML Service API Test Script"


Write-Host "`n1. Health Check"
$health = Invoke-RestMethod http://localhost:5001/health
$health | ConvertTo-Json -Depth 10
Write-Host "Status: $($health.status)"
Write-Host "Database: $($health.database_connected)"
Write-Host "Models: Bestseller=$($health.models_loaded.bestseller), Ranking=$($health.models_loaded.ranking)"

Write-Host "`n2. Test Bestseller Prediction"
$bestsellerBody = @{
    asin = "B00005N5PF"
    product_name = "Test Product"
    price = 29.99
    rating = 4.5
    reviews_count = 150
    sales_count = 50
    ranking = 100
    stock_quantity = 100
    discount_percentage = 10.0
    days_since_listed = 30
} | ConvertTo-Json

try {
    $bestsellerResult = Invoke-RestMethod -Uri http://localhost:5001/predict/bestseller -Method POST -Body $bestsellerBody -ContentType "application/json"
    Write-Host "Bestseller Probability: $($bestsellerResult.bestseller_probability)"
    Write-Host "Is Potential Bestseller: $($bestsellerResult.is_potential_bestseller)"
    Write-Host "Confidence: $($bestsellerResult.confidence_level)"
    Write-Host "Recommendation: $($bestsellerResult.recommendation)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}

Write-Host "`n3. Test Complete Prediction"
$completeBody = @{
    asin = "B00005N5PF"
    product_name = "Test Product"
    price = 29.99
    rating = 4.5
    reviews_count = 150
    sales_count = 50
    ranking = 100
    stock_quantity = 100
    discount_percentage = 10.0
    days_since_listed = 30
    category_avg_price = 35.00
    category_min_price = 20.00
    category_max_price = 50.00
    category_avg_reviews = 100.0
} | ConvertTo-Json

try {
    $completeResult = Invoke-RestMethod -Uri http://localhost:5001/predict/complete -Method POST -Body $completeBody -ContentType "application/json"

    Write-Host "`nBestseller Prediction:"
    Write-Host "  Probability: $($completeResult.bestseller.bestseller_probability)"
    Write-Host "  Confidence: $($completeResult.bestseller.confidence_level)"

    Write-Host "`nRanking Trend:"
    Write-Host "  Current Rank: $($completeResult.ranking_trend.current_rank)"
    Write-Host "  Predicted Trend: $($completeResult.ranking_trend.predicted_trend)"
    Write-Host "  Estimated Change: $($completeResult.ranking_trend.estimated_change)"

    Write-Host "`nPrice Intelligence:"
    Write-Host "  Current Price: $($completeResult.price_intelligence.current_price)"
    Write-Host "  Recommended Price: $($completeResult.price_intelligence.recommended_price)"
    Write-Host "  Action: $($completeResult.price_intelligence.price_action)"
    Write-Host "  Positioning: $($completeResult.price_intelligence.positioning)"
} catch {
    Write-Host "Error: $($_.Exception.Message)"
}


Write-Host "API Test Complete"
