import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import RequireAuth from './components/RequireAuth'
import Home from './pages/Home'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Orders from './pages/Orders'
import Dashboard from './pages/admin/Dashboard'
import SockForm from './pages/admin/SockForm'
import AdminOrders from './pages/admin/AdminOrders'
import RequireAdmin from './components/RequireAdmin'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="socks/:id" element={<Product />} />
              <Route path="cart" element={<Cart />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route element={<RequireAuth />}>
                <Route path="orders" element={<Orders />} />
              </Route>
              <Route element={<RequireAdmin />}>
                <Route path="admin" element={<Dashboard />} />
                <Route path="admin/socks/new" element={<SockForm />} />
                <Route path="admin/socks/:id" element={<SockForm />} />
                <Route path="admin/orders" element={<AdminOrders />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  )
}
