# Requirements — Sock e-commerce platform

Goal: full-stack sock shop, strictly split into `frontend/` (React + Vite) and `backend/` (Node.js/Express API only). Audience: shoppers + one admin. The request's first deliverable: complete folder structure, then the secure backend init and env configuration (documented in README + backend/.env.example).

## Essential
- Backend: secure Express server init, env validation (Zod), strict CORS (frontend origin only), helmet, rate limiting, CSRF protection, Zod validation, bcrypt hashing, JWT in HTTP-only cookie.
- Register / login / logout / me. Roles `user` and `admin`.
- Public catalogue (image, title, description, price) with detail view.
- Cart (client-side persisted, price re-checked server-side at checkout).
- Admin: route protected by role; CRUD socks; image upload (Multer, local disk, type/size checked).
- Colors: background #F6E6D1, CTA buttons #ED2939; responsive, clean.
## Important
- Orders: checkout creates an order from the cart (no real payment), user order history, admin orders list.
- XSS: output escaping (React) + CSP header + input sanitisation of text.
- Seed script creating admin from env + a few demo socks (original generated images).
- README, TEST_GUIDE.md, .env.example for both folders.
## Bonus
- Catalogue search/filter, pagination, accessible UI (WCAG AA contrast on CTA).
## Out of scope
- Real payments, email, cloud storage (Cloudinary/S3), Next.js.
## Success criteria
- `bash .athanor/check.sh` passes: backend tests (Vitest+supertest) for auth, CSRF, CORS, rate limit, role guard, CRUD, upload; frontend build + unit tests; Playwright e2e + screenshots (shopper flow, admin flow).
- Non-admin gets 403 on admin routes; no password hash ever returned.
