#!/usr/bin/env bash
# Starts backend + static frontend, checks /api/health and the SPA, then stops. Used by check.sh.
set -u
cd "$(dirname "$0")"
sec=$(printf 'x%.0s' {1..40})
(cd ../backend && JWT_SECRET=$sec PORT=4791 FRONTEND_ORIGIN=http://localhost:4792 DB_PATH=$(mktemp -u).db UPLOAD_DIR=$(mktemp -d) node --import tsx src/server.ts) & api=$!
node serve.mjs 4792 > /dev/null & web=$!
ok=0
for i in $(seq 30); do curl -sf http://localhost:4791/api/health > /dev/null && curl -sf http://localhost:4792/cart | grep -q '<div id="root"' && ok=1 && break; sleep 0.5; done
kill $api $web 2>/dev/null
[ $ok = 1 ] && echo "smoke OK" || { echo "smoke FAILED"; exit 1; }
