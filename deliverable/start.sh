#!/usr/bin/env bash
# Starts the API (:4000) and serves the built frontend (:8080). Ctrl+C stops both.
set -eu
cd "$(dirname "$0")"
API_PORT="${API_PORT:-4000}"; WEB_PORT="${WEB_PORT:-8080}"
if [ ! -f ../backend/.env ]; then
  # First run: generate a local .env with random secrets
  cp ../backend/.env.example ../backend/.env
  sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$(head -c 48 /dev/urandom | od -An -tx1 | tr -d ' \n')|; s|^ADMIN_PASSWORD=.*|ADMIN_PASSWORD=$(head -c 12 /dev/urandom | od -An -tx1 | tr -d ' \n')|" ../backend/.env
  echo "Created backend/.env - the admin password is in it (ADMIN_EMAIL / ADMIN_PASSWORD)."
fi
[ -d ../backend/node_modules ] || (cd ../backend && npm install)
(cd ../backend && PORT="$API_PORT" FRONTEND_ORIGIN="http://localhost:$WEB_PORT" node --import tsx --env-file=.env src/server.ts) & api=$!
trap 'kill $api 2>/dev/null' EXIT INT TERM
node serve.mjs "$WEB_PORT"
