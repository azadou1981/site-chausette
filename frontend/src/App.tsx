import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'

export function Home() {
  return (
    <>
      <h1>Chaussette</h1>
      <p>Warm, cosy socks.</p>
      <button className="btn">Shop now</button>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route element={<RequireAuth />}>
                <Route path="orders" element={<p>Orders</p>} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<p>Admin</p>} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
