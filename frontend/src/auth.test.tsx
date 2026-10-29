import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import { CartProvider } from './context/CartContext'

const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status })
function mockApi(me: unknown, onPost: (url: string) => Response = () => json({}, 500)) {
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    const u = String(url)
    if (u.endsWith('/csrf')) return json({ csrfToken: 't' })
    if (u.endsWith('/auth/me')) return me ? json({ user: me }) : json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, 401)
    return init?.method === 'POST' ? onPost(u) : json({})
  }))
}
function renderAt(path: string) {
  return render(
    <AuthProvider><CartProvider><MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<p>HOME</p>} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route element={<RequireAuth />}><Route path="orders" element={<p>ORDERS</p>} /></Route>
          <Route element={<RequireAdmin />}><Route path="admin" element={<p>ADMIN</p>} /></Route>
        </Route>
      </Routes>
    </MemoryRouter></CartProvider></AuthProvider>)
}
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

it('validates the login form client-side without calling the API', async () => {
  mockApi(null)
  renderAt('/login')
  await userEvent.click(await screen.findByRole('button', { name: 'Log in' }))
  expect(await screen.findByText('Enter a valid email address')).toBeTruthy()
  expect(screen.getByText('Password is required')).toBeTruthy()
})

it('shows the server error on a failed login', async () => {
  mockApi(null, () => json({ error: { code: 'INVALID', message: 'Invalid email or password' } }, 401))
  renderAt('/login')
  await userEvent.type(await screen.findByLabelText('Email'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
  expect((await screen.findByRole('alert')).textContent).toMatch(/invalid email or password/i)
})

it('logs in, updates the header and redirects', async () => {
  const user = { id: 1, name: 'Ann', email: 'a@b.co', role: 'user' }
  mockApi(null, () => json({ user }))
  renderAt('/login')
  await userEvent.type(await screen.findByLabelText('Email'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Password'), 'secret')
  await userEvent.click(screen.getByRole('button', { name: 'Log in' }))
  expect(await screen.findByText('HOME')).toBeTruthy()
  expect(screen.getByRole('button', { name: /log out \(ann\)/i })).toBeTruthy()
})

it('register requires a password of 8+ characters', async () => {
  mockApi(null)
  renderAt('/register')
  await userEvent.type(await screen.findByLabelText('Name'), 'Ann')
  await userEvent.type(screen.getByLabelText('Email'), 'a@b.co')
  await userEvent.type(screen.getByLabelText('Password'), 'short')
  fireEvent.click(screen.getByRole('button', { name: 'Register' }))
  expect(await screen.findByText(/at least 8 characters/)).toBeTruthy()
})

it('guards: anonymous goes to login, user cannot open admin, admin can', async () => {
  mockApi(null)
  renderAt('/orders')
  expect(await screen.findByRole('heading', { name: 'Log in' })).toBeTruthy()
})
it('redirects a non-admin away from /admin', async () => {
  mockApi({ id: 2, name: 'U', email: 'u@b.co', role: 'user' })
  renderAt('/admin')
  expect(await screen.findByText('HOME')).toBeTruthy()
})
it('lets an admin open /admin', async () => {
  mockApi({ id: 3, name: 'A', email: 'a@b.co', role: 'admin' })
  renderAt('/admin')
  await waitFor(() => expect(screen.getByText('ADMIN')).toBeTruthy())
})

it('offers "Continuer avec Google" on login and register', async () => {
  for (const path of ['/login', '/register']) {
    renderAt(path)
    const link = await screen.findByRole('link', { name: 'Continuer avec Google' })
    expect(link.getAttribute('href')).toMatch(/\/api\/auth\/google$/)
    cleanup()
  }
})
