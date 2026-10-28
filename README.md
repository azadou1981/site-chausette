# Chaussette – sock e-commerce platform

React (Vite) frontend + Express/TypeScript API, strictly separated.

## Structure
```
backend/            Express 4 + TypeScript API (node:sqlite, Zod, bcrypt, JWT cookies)
  src/config/env.ts   validated environment (rejects JWT_SECRET < 32 chars)
  src/app.ts          Express app factory (GET /api/health)
  src/server.ts       entry point
  tests/              Vitest + supertest
  .env.example        environment template
frontend/           React 19 + Vite + TypeScript (background #F6E6D1, CTA #ED2939)
  src/                App, styles, tests
.athanor/check.sh   build + tests (use `quick` for tests only)
```
Planned: `backend/src/{db,schemas,seed}.ts`, `middleware/`, `routes/`, `frontend/src/{api,components,pages,context}`, `e2e/`, `deliverable/`.

## Backend init
```
cd backend && npm install
cp .env.example .env        # then set JWT_SECRET (>= 32 chars) and admin credentials
npm start                   # http://localhost:4000/api/health
```
## Environment variables (backend/.env)
NODE_ENV, PORT (4000), FRONTEND_ORIGIN (http://localhost:5173, the only allowed CORS origin), JWT_SECRET (>= 32 chars, required), JWT_EXPIRES_IN, DB_PATH, UPLOAD_DIR, ADMIN_EMAIL, ADMIN_PASSWORD, BCRYPT_ROUNDS.
Frontend: `VITE_API_URL` (default http://localhost:4000).

## Frontend
`cd frontend && npm install && npm run dev` (http://localhost:5173).
