#!/usr/bin/env bash
# End-to-end demo script (bash)
# Usage: ./scripts/demo.sh

set -euo pipefail

API_BASE="${API_BASE:-http://localhost:8080/api}"
EMAIL="demo@example.com"
PASSWORD="demo12345"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SAMPLE_FILE="$SCRIPT_DIR/../data/sample_sales.csv"

echo "==> AI Analytics Platform Demo"
echo "API: $API_BASE"

echo ""
echo "==> Register demo user (ignore if already exists)"
curl -s -X POST "$API_BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Demo User\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" || true

echo ""
echo "==> Login"
AUTH=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
TOKEN=$(echo "$AUTH" | python -c "import sys,json; print(json.load(sys.stdin)['token'])")
USER_ID=$(echo "$AUTH" | python -c "import sys,json; print(json.load(sys.stdin)['userId'])")
echo "Logged in as userId=$USER_ID"

echo ""
echo "==> Upload sample dataset"
DATASET=$(curl -s -X POST "$API_BASE/datasets/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@$SAMPLE_FILE")
DATASET_ID=$(echo "$DATASET" | python -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "Uploaded dataset id=$DATASET_ID"

echo ""
echo "==> Run prediction"
PREDICTION=$(curl -s -X POST "$API_BASE/predictions/run?datasetId=$DATASET_ID" \
  -H "Authorization: Bearer $TOKEN")
echo "$PREDICTION" | python -m json.tool

echo ""
echo "==> AI chat"
CHAT=$(curl -s -X POST "$API_BASE/ai/chat" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"datasetId\":$DATASET_ID,\"message\":\"Summarize this dataset and prediction quality.\"}")
echo "$CHAT" | python -m json.tool

echo ""
echo "==> Demo complete"
