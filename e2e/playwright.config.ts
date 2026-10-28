import { defineConfig } from '@playwright/test'

const secret = 'e2e-secret-'.padEnd(48, 'x')
const backendEnv = {
  PORT: '4100', FRONTEND_ORIGIN: 'http://localhost:5174', JWT_SECRET: secret,
  DB_PATH: './data/e2e.db', UPLOAD_DIR: './uploads-e2e', ADMIN_EMAIL: 'admin@e2e.test', ADMIN_PASSWORD: 'admin-pass-e2e-123',
  BCRYPT_ROUNDS: '4', RATE_LIMIT_MAX: '5000', AUTH_RATE_LIMIT_MAX: '500',
}

export default defineConfig({
  testDir: '.',
  workers: 1,
  timeout: 30_000,
  use: { baseURL: 'http://localhost:5174', screenshot: 'off' },
  webServer: [
    {
      command: 'rm -rf data/e2e.db* uploads-e2e && mkdir -p data && node --import tsx src/seed.ts && node --import tsx src/server.ts',
      cwd: '../backend', url: 'http://localhost:4100/api/health', env: backendEnv, reuseExistingServer: false, timeout: 60_000,
    },
    {
      command: 'npx vite --port 5174 --strictPort',
      cwd: '../frontend', url: 'http://localhost:5174', env: { VITE_API_URL: 'http://localhost:4100' }, reuseExistingServer: false, timeout: 60_000,
    },
  ],
})
