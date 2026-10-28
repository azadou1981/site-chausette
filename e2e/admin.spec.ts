import { expect, test } from '@playwright/test'
import { deflateSync } from 'node:zlib'

// 1x1 red PNG built on the fly (no binary fixture needed)
function png(): Buffer {
  const crc = (b: Buffer) => { let c = ~0; for (const x of b) { c ^= x; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)) } return ~c >>> 0 }
  const chunk = (t: string, d: Buffer) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]) }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(1, 0); ihdr.writeUInt32BE(1, 4); ihdr[8] = 8; ihdr[9] = 2
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(Buffer.from([0, 237, 41, 57]))), chunk('IEND', Buffer.alloc(0))])
}

test('admin creates a sock with an image upload and it appears in the shop', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel('Email').fill('admin@e2e.test')
  await page.getByLabel('Password').fill('admin-pass-e2e-123')
  await page.getByRole('button', { name: /log in/i }).click()
  await page.getByRole('link', { name: 'Admin' }).click()
  await page.screenshot({ path: '../.athanor/screenshots/admin.png' })
  await page.getByRole('link', { name: 'New sock' }).click()
  await page.getByLabel('Title').fill('E2E Argyle')
  await page.getByLabel('Description').fill('Made by the end-to-end test')
  await page.getByLabel('Price (€)').fill('9.90')
  await page.getByLabel('Stock').fill('3')
  await page.getByLabel('Image').setInputFiles({ name: 'sock.png', mimeType: 'image/png', buffer: png() })
  await expect(page.getByAltText('Preview')).toBeVisible()
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('cell', { name: 'E2E Argyle' })).toBeVisible()
  await page.goto('/')
  await page.getByLabel('Search socks').fill('Argyle')
  await page.getByRole('button', { name: 'Search' }).click()
  await expect(page.getByRole('heading', { name: 'E2E Argyle' })).toBeVisible()
  await expect(page.getByText('€9.90')).toBeVisible()
})

test('a regular visitor cannot open the admin area', async ({ page }) => {
  await page.goto('/admin')
  await expect(page).not.toHaveURL(/\/admin$/)
})
