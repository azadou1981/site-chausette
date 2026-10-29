> Older entries: `.athanor/archives/JOURNAL_ANCIEN.md`.

## 2026-10-28 M5b
tools/gen-images.mjs (pure Node PNG writer) produces 8 sock images into backend/seed-images; backend/src/seed.ts (npm run seed) creates admin from env and 8 demo socks, idempotent; seed test + visual check of the images. check.sh full passes. Next: M6.

## 2026-10-28 M6
Frontend foundation: api client (credentials, CSRF fetched at start, one retry on CSRF 403, ApiError), AuthContext (/auth/me at start), cart logic + localStorage CartContext, Layout/header with SVG logo and react-router, brand CSS; 6 unit tests incl. computed background rgb(246,230,209). The 375px no-overflow check needs a real browser: left to M10 Playwright (CSS uses max-width/wrap). Next: M7.

## 2026-10-28 M7
Login/Register pages via shared AuthForm (client validation, server errors, labels, redirect to origin), RequireAuth/RequireAdmin guards wired in App routes, form CSS; 7 component tests (validation, server error, header update, guards). check.sh full passes. Next: M8.

## 2026-10-28 M8
Home (hero, search, paginated grid), Product, Cart (qty edit, checkout posts /orders, login prompt when anonymous), Orders pages plus SockCard, API types, responsive grid CSS (1/2/3/4 columns); 3 component tests. The 375/1280px overflow check needs a real browser: left to M10 Playwright. check.sh full passes. Next: M9.

## 2026-10-28 M9
Admin dashboard: sock table with delete (confirm), SockForm for create/edit (client validation, image upload with preview, multipart), AdminOrders list, routes under RequireAdmin; 5 component tests (delete/decline, upload+preview, validation, orders, user blocked). check.sh full passes. Next: M10.

## 2026-10-28 M10
e2e/ Playwright project (real backend on :4100 with fresh seeded DB + Vite on :5174): shopper.spec (register, add to cart, checkout, no overflow at 375/1280, bg rgb(246,230,209)) and admin.spec (admin creates sock with PNG upload, finds it via search; visitor blocked from /admin). Chromium installed in $TOOLS/pw. Screenshots in .athanor/screenshots/ viewed. e2e step added to check.sh; full check passes. Next: M11.

## 2026-10-28 M11
tester + critic ran (findings in BUGS.md). Fixed: production requires explicit ADMIN_PASSWORD (new test), :focus-visible outline, themed admin links, cart qty accessible names, brand background literal for jsdom. Cookie HttpOnly/SameSite test already in auth.test.ts; no JWT secret in git; CTA is bold 19.2px. Minor polish items left in BUGS.md. check.sh full passes. Next: M12.

## 2026-10-28 M12
Delivery: deliverable/ (built app, serve.mjs, start.sh, build.sh, smoke.sh), TEST_GUIDE.md, README quick start, docs/CREDITS.md, FINAL_REPORT (STATUS: DONE). check.sh gets a deliverable-smoke step (backend + static site + /api/health); full check passes.

## 2026-10-29 M13
- Request is for Next.js backend but project backend is Express: kept Express (DECISIONS). RESUME.md was a false positive (localhost URL); removed.
- Added backend/src/seedTestAdmin.ts (`npm run seed:admin`, refused in production) + test; unik. logo in Layout.tsx/index.css, header on #F6E6D1.
- Verified: full check.sh PASSED, home-375 screenshot viewed. Next: M14 Google OAuth.

## 2026-10-29 M14
- Google OAuth (auth-code flow, no new dependency): backend/src/routes/google.ts, google_id column + migration, optional GOOGLE_* env vars in .env.example; "Continuer avec Google" link on login/register, error banner on ?error=google.
- Existing email accounts are linked (verified email only); roles are never changed. 503 when not configured. Tests mock Google via fetch.
- Verified: full check.sh PASSED. Next: M15 delivery.
