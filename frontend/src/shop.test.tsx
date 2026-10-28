import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import Home from './pages/Home'
import Product from './pages/Product'
import Cart from './pages/Cart'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
const sock = (id: number, title: string) => ({ id, title, description: `desc ${title}`, priceCents: 1250, imageUrl: `/uploads/${id}.png`, stock: 5 })
const urls: string[] = []
const posted: unknown[] = []

function mock(user: unknown) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url); urls.push(u)
    if (u.endsWith('/csrf')) return json({ csrfToken: 't' })
    if (u.endsWith('/auth/me')) return user ? json({ user }) : json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401)
    if (u.endsWith('/orders') && init?.method === 'POST') { posted.push(JSON.parse(String(init.body))); return json({ id: 1 }, 201) }
    if (u.includes('/socks/2')) return json(sock(2, 'Blue'))
    if (u.includes('/socks?')) {
      const page = Number(new URL(u).searchParams.get('page'))
      return json({ items: [sock(page * 10 + 1, `Red${page}`)], page, pageSize: 1, total: 2 })
    }
    return json({})
  }))
}
function renderAt(path: string) {
  return render(
    <AuthProvider><CartProvider><MemoryRouter initialEntries={[path]}>
      <Routes><Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="socks/:id" element={<Product />} />
        <Route path="cart" element={<Cart />} />
        <Route path="orders" element={<p>ORDERS</p>} />
      </Route></Routes>
    </MemoryRouter></CartProvider></AuthProvider>,
  )
}
beforeEach(() => { localStorage.clear(); urls.length = 0; posted.length = 0 })
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('shows the grid, paginates and searches', async () => {
  mock(null)
  renderAt('/')
  expect(await screen.findByText('Red1')).toBeTruthy()
  expect(screen.getByText('desc Red1')).toBeTruthy()
  expect(screen.getByText('€12.50')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Next' }))
  expect(await screen.findByText('Red2')).toBeTruthy()
  await userEvent.type(screen.getByLabelText('Search socks'), 'wool')
  await userEvent.click(screen.getByRole('button', { name: 'Search' }))
  await waitFor(() => expect(urls.some((u) => u.includes('q=wool') && u.includes('page=1'))).toBe(true))
})

it('adds from the product page to the cart and checks out', async () => {
  mock({ id: 1, name: 'Ann', email: 'a@b.c', role: 'user' })
  renderAt('/socks/2')
  await userEvent.click(await screen.findByRole('button', { name: 'Add to cart' }))
  expect(await screen.findByText('Cart (1)')).toBeTruthy()
  await userEvent.click(screen.getByText('Cart (1)'))
  expect(await screen.findByText('Total: €12.50')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Place order' }))
  expect(await screen.findByText('ORDERS')).toBeTruthy()
  expect(posted).toEqual([{ items: [{ sockId: 2, qty: 1 }] }])
  expect(screen.getByText('Cart (0)')).toBeTruthy()
})

it('asks anonymous users to log in at checkout', async () => {
  mock(null)
  localStorage.setItem('chaussette.cart', JSON.stringify([{ sockId: 2, title: 'Blue', priceCents: 100, imageUrl: null, qty: 2 }]))
  renderAt('/cart')
  expect(await screen.findByText('Total: €2.00')).toBeTruthy()
  expect(screen.queryByRole('button', { name: 'Place order' })).toBeNull()
})
