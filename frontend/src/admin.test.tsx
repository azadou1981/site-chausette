import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import RequireAdmin from './components/RequireAdmin'
import Dashboard from './pages/admin/Dashboard'
import SockForm from './pages/admin/SockForm'
import AdminOrders from './pages/admin/AdminOrders'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
const sock = { id: 3, title: 'Wool', description: 'd', priceCents: 900, imageUrl: null, stock: 4 }
const calls: { method: string; url: string; body: unknown }[] = []

function mock(role: string) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url); const method = init?.method ?? 'GET'
    calls.push({ method, url: u, body: init?.body })
    if (u.endsWith('/csrf')) return json({ csrfToken: 't' })
    if (u.endsWith('/auth/me')) return json({ user: { id: 1, name: 'Ann', email: 'a@b.c', role } })
    if (u.endsWith('/admin/orders')) return json({ items: [{ id: 7, totalCents: 1800, createdAt: '2026-01-01T00:00:00Z', user: { name: 'Bob', email: 'b@x.y' }, items: [{ sockId: 3, title: 'Wool', unitPriceCents: 900, qty: 2 }] }] })
    if (method === 'GET' && u.includes('/socks?')) return json({ items: [sock], page: 1, pageSize: 12, total: 1 })
    return method === 'DELETE' ? new Response(null, { status: 204 }) : json(sock, 201)
  }))
}
function renderAt(path: string) {
  return render(
    <AuthProvider><CartProvider><MemoryRouter initialEntries={[path]}>
      <Routes><Route element={<Layout />}>
        <Route index element={<p>HOME</p>} />
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<Dashboard />} />
          <Route path="admin/socks/new" element={<SockForm />} />
          <Route path="admin/orders" element={<AdminOrders />} />
        </Route>
      </Route></Routes>
    </MemoryRouter></CartProvider></AuthProvider>,
  )
}
beforeEach(() => { calls.length = 0 })
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks() })

it('lists socks and deletes after confirmation', async () => {
  mock('admin')
  vi.spyOn(window, 'confirm').mockReturnValue(true)
  renderAt('/admin')
  expect(await screen.findByText('Wool')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Delete' }))
  await waitFor(() => expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/socks/3'))).toBe(true))
})

it('does not delete when the confirmation is declined', async () => {
  mock('admin')
  vi.spyOn(window, 'confirm').mockReturnValue(false)
  renderAt('/admin')
  await userEvent.click(await screen.findByRole('button', { name: 'Delete' }))
  expect(calls.some((c) => c.method === 'DELETE')).toBe(false)
})

it('creates a sock with an image upload and shows a preview', async () => {
  mock('admin')
  URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn()
  renderAt('/admin/socks/new')
  await userEvent.type(await screen.findByLabelText('Title'), 'Stripe')
  await userEvent.type(screen.getByLabelText('Description'), 'Nice')
  await userEvent.type(screen.getByLabelText('Price (€)'), '7.5')
  await userEvent.upload(screen.getByLabelText('Image'), new File(['x'], 'a.png', { type: 'image/png' }))
  expect(screen.getByAltText('Preview')).toBeTruthy()
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  await waitFor(() => expect(calls.some((c) => c.method === 'POST' && c.url.endsWith('/socks'))).toBe(true))
  const fd = calls.find((c) => c.method === 'POST' && c.url.endsWith('/socks'))!.body as FormData
  expect(fd.get('priceCents')).toBe('750')
  expect((fd.get('image') as File).name).toBe('a.png')
})

it('rejects an invalid price client-side', async () => {
  mock('admin')
  renderAt('/admin/socks/new')
  await userEvent.type(await screen.findByLabelText('Title'), 'S')
  await userEvent.type(screen.getByLabelText('Description'), 'D')
  await userEvent.click(screen.getByRole('button', { name: 'Save' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/price/i)
})

it('shows all orders to the admin and blocks a regular user', async () => {
  mock('admin')
  renderAt('/admin/orders')
  expect(await screen.findByText(/Bob/)).toBeTruthy()
  cleanup()
  mock('user')
  renderAt('/admin')
  expect(await screen.findByText('HOME')).toBeTruthy()
})
