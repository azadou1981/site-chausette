# Completed milestones

Archived automatically by the pilot. Nothing in it is modified.

- [x] M1 : Runnable skeleton and check.sh — Files: backend/ (package.json, tsconfig, src/app.ts, src/server.ts, src/config/env.ts, .env.example), frontend/ (Vite React TS, minimal App with colours #F6E6D1/#ED2939), .athanor/check.sh (with quick mode), .gitignore, README.md (with full folder structure, backend init and env sections; env.ts already rejects JWT_SECRET <32 chars). Depends on: none. Acceptance: GET /api/health returns 200; frontend builds; grep finds #F6E6D1 and #ED2939 in frontend CSS; check.sh quick and full print CHECK: PASSED. Read: ARCHITECTURE.md.

- [x] M2 : Secure backend base — Files: backend/src/app.ts, README init walkthrough, middleware/{csrf,rateLimit,validate,error}.ts, routes/csrf.ts, tests/security.test.ts. Depends on: M1. Acceptance: helmet headers present; CORS rejects other origins; CSRF-less or wrong-token POST gets 403 (GET /csrf then POST works); CSP header set; rate limit returns 429; env with short JWT_SECRET fails to start; tests pass. Read: ARCHITECTURE.md, REQUIREMENTS.md §Essential.

- [x] M3 : Database and auth API — Files: backend/src/db.ts, schemas.ts, routes/auth.ts, middleware/auth.ts, tests/auth.test.ts. Depends on: M2. Acceptance: register hashes with bcrypt, login sets httpOnly cookie, /auth/me works, logout clears, duplicate email 409, invalid input 400 via Zod, password hash never in responses; text fields stripped of HTML (title with <script> stored escaped/stripped); test helper inserts an admin. Read: ARCHITECTURE.md §API contract.

- [x] M4 : Socks API with admin CRUD and image upload — Files: backend/src/routes/socks.ts, upload middleware (multer, mime+size check, random filenames), tests/socks.test.ts, static /uploads with nosniff. Depends on: M3. Acceptance: public list/get with ?q search and ?page pagination; non-admin 403, anonymous 401 on write; create with image, update, delete (removes file); non-image upload rejected. Read: ARCHITECTURE.md.

- [x] M5 : Orders API — Files: backend/src/routes/orders.ts, tests/orders.test.ts. Depends on: M4. Acceptance: order totals computed server-side, stock checked, own history; GET /admin/orders gives 401 anonymous, 403 user, 200 admin. Read: ARCHITECTURE.md.

- [x] M5b : Seed and generated images — Files: backend/src/seed.ts, tools/gen-images.mjs, tests. Depends on: M4. Acceptance: seed creates admin from env + 8 demo socks with generated SVG/PNG images; idempotent (run twice, same counts). Read: ARCHITECTURE.md.

- [x] M6 : Frontend foundation — Files: frontend/src/{api/client.ts,context/AuthContext.tsx,context/CartContext.tsx,components/Layout.tsx,styles/}, tests. Depends on: M2, M6 uses GET /csrf. Acceptance: API client fetches CSRF token at app start, retries once on 403, sends credentials; cart persisted in localStorage with unit tests; no horizontal overflow at 375px (scrollWidth<=innerWidth); computed background is rgb(246,230,209). Read: DESIGN.md, ARCHITECTURE.md.

- [x] M7 : Auth pages and route guards — Files: pages/Login.tsx, Register.tsx, components/RequireAuth.tsx, RequireAdmin.tsx, tests. Depends on: M3, M6. Acceptance: forms validate client-side, show server errors, login updates header; admin route redirects non-admins; component tests pass. Read: DESIGN.md.

