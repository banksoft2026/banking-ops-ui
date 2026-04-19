#!/bin/sh
set -e

# Write runtime config from container environment variables.
# Defaults fall back to localhost so the image also works locally via Docker.
cat > /usr/share/nginx/html/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  USER_ADMIN_URL:      "${USER_ADMIN_URL:-http://localhost:8084}",
  CBS_MAINTENANCE_URL: "${CBS_MAINTENANCE_URL:-http://localhost:8080}",
  ACCOUNT_MASTER_URL:  "${ACCOUNT_MASTER_URL:-http://localhost:8082}",
  TXN_POSTING_URL:     "${TXN_POSTING_URL:-http://localhost:8083}",
  CUSTOMER_ENTITY_URL: "${CUSTOMER_ENTITY_URL:-http://localhost:8081}"
};
EOF

exec nginx -g "daemon off;"
