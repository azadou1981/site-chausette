import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Logo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden="true">
      <path d="M11 3h9v14l8 4a5 5 0 0 1-2 9H11a4 4 0 0 1-4-4V3z" fill="#ED2939" />
      <rect x="11" y="3" width="9" height="5" fill="#fff" />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand"><Logo /> Chaussette</Link>
        <nav aria-label="Main">
          <NavLink to="/">Shop</NavLink>
          <NavLink to="/cart">Cart ({count})</NavLink>
          {user && <NavLink to="/orders">Orders</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin">Admin</NavLink>}
          {user ? (
            <button className="link" onClick={async () => { await logout(); navigate('/') }}>Log out ({user.name})</button>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <NavLink to="/register">Register</NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="container"><Outlet /></main>
    </>
  )
}
