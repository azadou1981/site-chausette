import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

function Logo() {
  return (
    <span className="logo">
      <span className="logo-word" aria-hidden="true">unik.</span>
      <span className="logo-tag" aria-hidden="true">comme vous</span>
    </span>
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const navigate = useNavigate()
  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand" aria-label="unik. comme vous, home"><Logo /></Link>
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
