
## M11 security review (tester)
Checks: `check.sh quick` PASSED. Verified OK: CSRF double-submit on all unsafe /api methods, role read from DB per request (no JWT role claim), admin routes guarded (socks POST/PUT/DELETE, /admin/orders), upload (mime whitelist + magic bytes + 2 MB + random name, basename on delete), parameterized SQL + LIKE escaping, order prices from DB in a transaction, bcrypt, httpOnly cookie, labels on all inputs, .btn contrast (bold 1.2rem = 19.2px >= 18.66px), no secrets tracked (.env ignored, only .env.example).

### major
- backend/src/config/env.ts:12, seed.ts:23-24: ADMIN_PASSWORD defaults to public 'change-me-admin-password' (and ADMIN_EMAIL admin@example.com); seed creates an admin with it even when NODE_ENV=production. Repro: start prod without ADMIN_PASSWORD, log in as admin@example.com. Expected: refuse to start / require explicit value in production.

### minor
- backend/src/app.ts (no 'trust proxy'): behind a reverse proxy all clients share one IP, so rate limits (global and 10/15min auth) lock everyone out; conversely no per-account throttling on login.
- backend/src/routes/auth.ts:25: register returns 409 EMAIL_TAKEN, enabling email enumeration.
- backend/src/middleware/csrf.ts:8: csrf cookie is host-scoped but not __Host- prefixed; sibling subdomain could plant it (double-submit weakness). Low risk locally.
- backend/src/routes/auth.ts:17,40: JWT is stateless (2h); logout does not revoke it, and no CSRF-independent session invalidation on password change (no such feature yet).
- frontend/src/pages/Cart.tsx:37: qty label wraps input, ok, but input lacks an accessible name tied to the product ("Qty" repeated per line); add aria-label with title.

## M11 resolution
Fixed: production requires explicit ADMIN_PASSWORD (test added); focus-visible outline; themed admin links; cart qty accessible name; duplicate body rule. Left (minor/polish): trust proxy, account enumeration on register, add-to-cart toast, cart stepper, admin inline delete confirmation.
