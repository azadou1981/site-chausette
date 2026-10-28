#!/usr/bin/env bash
# Rebuilds the frontend (API URL via VITE_API_URL, default http://localhost:4000) into deliverable/app.
set -eu
cd "$(dirname "$0")/../frontend"
npm run build
rm -rf ../deliverable/app && cp -r dist ../deliverable/app
