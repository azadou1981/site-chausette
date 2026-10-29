# Final report
STATUS: DONE

## In short
Sock e-commerce platform: React/Vite frontend and Express/TypeScript API in separate folders, with auth, catalogue, cart, orders and an admin CRUD dashboard with image upload.

## How to launch and test
`bash deliverable/start.sh` then http://localhost:8080 (API :4000). See TEST_GUIDE.md. Automated: `bash .athanor/check.sh`.

## What was built
Secure backend (helmet/CSP, strict CORS, CSRF double-submit, rate limiting, Zod validation, bcrypt, JWT in HttpOnly cookie, SQLite via node:sqlite, safe uploads); responsive UI (#F6E6D1 / #ED2939); admin panel; unit, component and Playwright e2e tests.

## Deviations from the request and why
Express chosen over Next.js (allowed alternative). Images stored on local disk (Multer-style) rather than a cloud service. The request's final ask (structure plus backend init and env config) is in README.md.

## Known limits and remaining bugs
No trust proxy setting behind reverse proxies; register reveals existing emails (409); JWT not revoked on logout; no payment step. Minor polish items in .athanor/BUGS.md.

## Important decisions
See .athanor/DECISIONS.md; production refuses to start without explicit ADMIN_PASSWORD.

## Figures (milestones, tests, commits, duration)
12 milestones; backend, frontend and e2e suites all passing.

## Ideas for later
Payments, email verification, per-account login throttling, toast on add-to-cart, cart stepper.
