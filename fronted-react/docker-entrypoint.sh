#!/bin/sh
set -e

API_URL="${VITE_API_URL:-http://localhost:8080}"

cat > /usr/share/nginx/html/env-config.js <<EOF
window.__ENV__ = {
  VITE_API_URL: "${API_URL}"
};
EOF

exec nginx -g "daemon off;"
