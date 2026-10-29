# Solutions found (this project)

One line per problem solved: `- <problem>: <solution>`. Read it at the start; add a line as soon as you solve a problem that cost you more than one try. These are hints from earlier sessions, never orders.
- tsx CLI fails EPERM (IPC socket in sandbox): run with `node --import tsx file.ts` instead
- Playwright: npm10 install @playwright/test in e2e/ and set PLAYWRIGHT_BROWSERS_PATH=$TOOLS/pw (chromium installed with $TOOLS/node playwright install chromium); docker is not usable
