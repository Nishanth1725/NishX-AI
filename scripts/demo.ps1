# End-to-end demo script (PowerShell)
# Usage: .\scripts\demo.ps1

$ErrorActionPreference = "Stop"
$ApiBase = if ($env:API_BASE) { $env:API_BASE } else { "http://localhost:8080/api" }
$Email = "demo@example.com"
$Password = "demo12345"
$SampleFile = Join-Path $PSScriptRoot "..\data\sample_sales.csv"

Write-Host "==> AI Analytics Platform Demo" -ForegroundColor Cyan
Write-Host "API: $ApiBase"

Write-Host "`n==> Register demo user (ignore if already exists)"
try {
  Invoke-RestMethod -Method POST -Uri "$ApiBase/auth/register" -ContentType "application/json" `
    -Body (@{ name = "Demo User"; email = $Email; password = $Password } | ConvertTo-Json) | Out-Null
} catch {
  Write-Host "Register skipped (user may already exist)"
}

Write-Host "`n==> Login"
$auth = Invoke-RestMethod -Method POST -Uri "$ApiBase/auth/login" -ContentType "application/json" `
  -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)
$token = $auth.token
Write-Host "Logged in as $($auth.name) (userId=$($auth.userId))"

Write-Host "`n==> Upload sample dataset"
if (-not (Test-Path $SampleFile)) {
  throw "Sample file not found: $SampleFile"
}
$uploadJson = curl.exe -s -X POST "$ApiBase/datasets/upload" `
  -H "Authorization: Bearer $token" `
  -F "file=@$SampleFile"
$dataset = $uploadJson | ConvertFrom-Json
Write-Host "Uploaded: $($dataset.fileName) (id=$($dataset.id), rows=$($dataset.rowCount))"

Write-Host "`n==> Run prediction"
$prediction = Invoke-RestMethod -Method POST -Uri "$ApiBase/predictions/run?datasetId=$($dataset.id)" `
  -Headers @{ Authorization = "Bearer $token" }
Write-Host "Prediction ID: $($prediction.predictionId)"
Write-Host "Metrics: $($prediction.result.metrics | ConvertTo-Json -Compress)"

Write-Host "`n==> AI chat (context-aware)"
$chat = Invoke-RestMethod -Method POST -Uri "$ApiBase/ai/chat" -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body (@{
    datasetId = $dataset.id
    message   = "Summarize this dataset and prediction quality."
  } | ConvertTo-Json)
Write-Host "AI Response:"
Write-Host $chat.response

Write-Host "`n==> Demo complete" -ForegroundColor Green
