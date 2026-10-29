# Log: older entries

Archived automatically by the pilot. Nothing in it is modified.

## 2026-10-28 Framing
Requirements, design, architecture and 12-milestone plan written (Express+node:sqlite backend, React/Vite frontend). Next: M1.
- Plan reviewed by critic; 20 findings applied (M5 split into M5/M5b, acceptance made checkable).

## 2026-10-28 M1
Backend (Express+Zod env, /api/health, tests) and Vite React frontend with brand colours; check.sh (quick/full) passes. Workarounds in SOLUTIONS (npm10, tsx). Next: M2.

## 2026-10-28 M2
Helmet+CSP, strict CORS, global rate limit, double-submit CSRF (GET /api/csrf), Zod validate and error middleware; 9 backend tests. SECRETS_FOUND was a false positive (REQUEST.md), noted in BLOCKERS. Next: M3.

## 2026-10-28 M3
node:sqlite users table, Zod schemas with HTML stripping, bcrypt register/login (httpOnly SameSite=Lax JWT cookie), /auth/me, logout, requireAuth/requireAdmin, 409/400 handling; 7 auth tests + setup helper with seeded admin. check.sh full passes. Next: M4.

## 2026-10-28 M4
Socks table, public list/get with ?q (LIKE escaped) and ?page (12/page), admin-only POST/PUT/DELETE with multer upload (mime + magic bytes, 2 MB, random names, file removed on delete/replace/invalid), /uploads served nosniff; 5 socks tests. check.sh full passes. Next: M5.

## 2026-10-28 M5
orders/order_items tables (price and title snapshots), POST /orders (server-side total, merged lines, stock check + decrement in one transaction, 409/400), GET /orders (own), GET /admin/orders (401/403/200); 4 orders tests. check.sh full passes. Next: M5b.

