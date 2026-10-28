import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import App from './App'

it('renders the shop call to action and the header', async () => {
  vi.stubGlobal('fetch', vi.fn(async (url: string) =>
    String(url).endsWith('/csrf') ? new Response(JSON.stringify({ csrfToken: 't' })) : new Response('{}', { status: 401 })))
  render(<App />)
  expect(await screen.findByRole('button', { name: /shop now/i })).toBeTruthy()
  expect(screen.getByRole('link', { name: /cart \(0\)/i })).toBeTruthy()
  expect(await screen.findByRole('link', { name: /log in/i })).toBeTruthy()
})
