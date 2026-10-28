import { expect, test } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const shots = '../.athanor/screenshots'
mkdirSync(shots, { recursive: true })

test('shopper: register, add to cart, checkout; layout fits mobile and desktop', async ({ page }) => {
  for (const [w, h] of [[375, 800], [1280, 800]]) {
    await page.setViewportSize({ width: w, height: h })
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /./, level: 2 }).first()).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(246, 230, 209)')
    await page.screenshot({ path: `${shots}/home-${w}.png` })
  }
  await page.goto('/register')
  await page.getByLabel('Name').fill('Shopper')
  await page.getByLabel('Email').fill(`s${Date.now()}@e2e.test`)
  await page.getByLabel('Password').fill('shopper-pass-123')
  await page.getByRole('button', { name: /register|sign up|create/i }).click()
  await expect(page.getByText(/Log out \(Shopper\)/)).toBeVisible()
  await page.goto('/')
  await page.getByRole('button', { name: 'Add to cart' }).first().click()
  await expect(page.getByText('Cart (1)')).toBeVisible()
  await page.getByText('Cart (1)').click()
  await page.screenshot({ path: `${shots}/cart.png` })
  await page.getByRole('button', { name: 'Place order' }).click()
  await expect(page.getByRole('heading', { name: 'Your orders' })).toBeVisible()
  await expect(page.getByText(/Order #\d+/)).toBeVisible()
  await page.screenshot({ path: `${shots}/orders.png` })
})
