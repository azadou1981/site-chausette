# Test guide

## Launch
`bash deliverable/start.sh` then open http://localhost:8080 (API on :4000).
First run creates `backend/.env` with random secrets; the admin login is `ADMIN_EMAIL` / `ADMIN_PASSWORD` from that file.
Automated: `bash .athanor/check.sh` (unit, component, build, health, Playwright e2e). `bash deliverable/smoke.sh` checks the packaged site.

## Manual tests
1. Home: background is cream (#F6E6D1), buttons red (#ED2939); catalogue shows images, titles, descriptions, prices; search and pagination work.
2. Resize to 375px and 1280px: no horizontal scroll, grid goes 1 to 4 columns.
3. Register with a new email (password >= 8 chars); invalid input shows errors; you are logged in and the header updates.
4. Logout, log in again with wrong then right password.
5. Add socks to the cart, change quantities, remove a line, checkout; the order appears under Orders.
6. Visit /admin as visitor and as a normal user: redirected/blocked.
7. As admin: create a sock with an image upload (png/jpg <= 2 MB; other files refused), edit it, delete it (confirmation), see all orders.
8. Security: more than 10 auth attempts in 15 min give 429; a POST without the CSRF header gives 403; other origins are refused by CORS.
9. Branding: the header shows "unik." in rounded red letters with "comme vous" below, on the cream background.
10. Test admin: run `cd backend && npm run seed:admin`, log in as admin@unik.com / admin123, open /admin.
11. Google: "Continuer avec Google" is on /login and /register. Without keys it shows a 503 JSON error; with keys from README it signs you in and returns to the shop.
