# Chaussette – sock e-commerce platform

React (Vite) frontend + Express/TypeScript API, strictly separated.

## Structure
```
backend/            Express 4 + TypeScript API (node:sqlite, Zod, bcrypt, JWT cookies)
  src/config/env.ts   validated environment (rejects JWT_SECRET < 32 chars)
  src/app.ts          Express app factory (helmet+CSP, strict CORS, rate limit, CSRF, GET /api/health, GET /api/csrf)
  src/middleware/     csrf, rateLimit, validate (Zod), error
  src/routes/csrf.ts  CSRF token endpoint
  src/server.ts       entry point
  tests/              Vitest + supertest
  .env.example        environment template
frontend/           React 19 + Vite + TypeScript (background #F6E6D1, CTA #ED2939)
  src/                App, styles, tests
.athanor/check.sh   build + tests (use `quick` for tests only)
```
Also: `backend/src/{db,schemas,seed}.ts`, `routes/` (auth, socks, orders, admin), `frontend/src/{api,components,pages,context}`, `e2e/` (Playwright), `deliverable/` (built site + start scripts), `docs/CREDITS.md`, `TEST_GUIDE.md`.

## Backend init
```
cd backend && npm install
cp .env.example .env        # then set JWT_SECRET (>= 32 chars) and admin credentials
npm start                   # http://localhost:4000/api/health
```
## Environment variables (backend/.env)
NODE_ENV, PORT (4000), FRONTEND_ORIGIN (http://localhost:5173, the only allowed CORS origin), JWT_SECRET (>= 32 chars, required), JWT_EXPIRES_IN, DB_PATH, UPLOAD_DIR, ADMIN_EMAIL, ADMIN_PASSWORD, BCRYPT_ROUNDS, GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REDIRECT_URI (optional, see below), RATE_LIMIT_MAX (100/min), AUTH_RATE_LIMIT_MAX (10/15min).

Security: every POST/PUT/PATCH/DELETE needs the `X-CSRF-Token` header equal to the `csrf` cookie (call `GET /api/csrf` first).
Frontend: `VITE_API_URL` (default http://localhost:4000).

## Frontend
`cd frontend && npm install && npm run dev` (http://localhost:5173).

## Quick start (built site)
`bash deliverable/start.sh` serves the site on http://localhost:8080 and the API on :4000 (creates `backend/.env` with random secrets on first run). Rebuild with `bash deliverable/build.sh`.
Production: set `NODE_ENV=production`, `JWT_SECRET`, `ADMIN_PASSWORD` (required), `FRONTEND_ORIGIN`; build the frontend with `VITE_API_URL` pointing at the API.

## Google sign-in
Create an OAuth 2.0 *Web application* client at https://console.cloud.google.com/apis/credentials, add the authorized redirect URI `http://localhost:4000/api/auth/google/callback` (or your own `GOOGLE_REDIRECT_URI`), then set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `backend/.env`. Without them "Continuer avec Google" answers 503.

## Test admin (development only)
`cd backend && npm run seed:admin` creates `admin@unik.com` / `admin123` (role admin). It refuses to run when `NODE_ENV=production`.
