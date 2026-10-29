# Architecture
Stack (all runnable here, no Docker): Node 22.
- backend/: Express 4 + TypeScript (tsx), `node:sqlite` (built into Node 22, no native build), zod, bcryptjs, jsonwebtoken, cookie-parser, helmet, cors, express-rate-limit, multer, csrf via double-submit token (own small middleware: cookie `csrf` readable + header `X-CSRF-Token`, verified on POST/PUT/PATCH/DELETE). Tests: Vitest + supertest.
- frontend/: React 18 + Vite + TypeScript, react-router, plain CSS. Tests: Vitest + Testing Library. Vite dev proxy not used; API base from `VITE_API_URL` (http://localhost:4000), fetch with `credentials: 'include'`.
- e2e/: Playwright (chromium installed into $TOOLS/ or via npx; if libs are missing, note in SOLUTIONS and use `tool` or fall back to API-level tests).
Folders: backend/src/{config/env.ts, app.ts, server.ts, db.ts, middleware/{auth,csrf,rateLimit,validate,error}.ts, routes/{auth,socks,orders,csrf}.ts, schemas.ts, seed.ts}, backend/uploads/, backend/tests/, frontend/src/{api,components,pages,context,styles}, e2e/, tools/ (image generator), deliverable/.
Env backend: NODE_ENV, PORT=4000, FRONTEND_ORIGIN=http://localhost:5173, JWT_SECRET (>=32 chars), JWT_EXPIRES_IN, DB_PATH, UPLOAD_DIR, ADMIN_EMAIL, ADMIN_PASSWORD, BCRYPT_ROUNDS. Frontend: VITE_API_URL.
API contract (JSON, prefix /api):
- GET /csrf → {csrfToken} (sets csrf cookie)
- POST /auth/register {name,email,password} ; POST /auth/login {email,password} ; POST /auth/logout ; GET /auth/me → {user:{id,name,email,role}}
- GET /socks?q&page ; GET /socks/:id ; POST/PUT/DELETE /socks (admin) multipart `image` + fields title,description,priceCents,stock
- POST /orders {items:[{sockId,qty}]} (auth) ; GET /orders (own) ; GET /admin/orders (admin)
Sock: {id,title,description,priceCents,imageUrl,stock}. Images served at /uploads/* with nosniff. Errors: {error:{code,message,details?}}.
Auth cookie `token`: httpOnly, sameSite=lax, secure in production. Login/register rate-limited stricter (10/15min); global 100/min. Tests set a high limit via env override only in test.
check.sh: `quick [pattern]` = backend+frontend vitest (pattern-filtered) ; full = typecheck, builds, all unit tests, Playwright e2e + screenshots into .athanor/screenshots/, prints CHECK: PASSED.
Delivery: deliverable/ = built frontend (static) + README run instructions; backend start script.
