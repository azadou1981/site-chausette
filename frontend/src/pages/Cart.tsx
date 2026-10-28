import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api, assetUrl } from '../api/client'
import { euro } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'

export default function Cart() {
  const { items, totalCents, setQty, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function checkout() {
    setBusy(true); setError('')
    try {
      await api('/orders', { method: 'POST', body: { items: items.map((i) => ({ sockId: i.sockId, qty: i.qty })) } })
      clear()
      navigate('/orders')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!items.length) return <><h1>Your cart</h1><p>Your cart is empty. <Link to="/">Browse socks</Link></p></>
  return (
    <>
      <h1>Your cart</h1>
      <ul className="cart-lines">
        {items.map((i) => (
          <li key={i.sockId} className="card cart-line">
            <img src={assetUrl(i.imageUrl)} alt="" />
            <span className="grow">{i.title}<br />{euro(i.priceCents)}</span>
            <label>Qty <input type="number" min={0} max={99} value={i.qty} onChange={(e) => setQty(i.sockId, Number(e.target.value) || 0)} /></label>
            <button className="link" onClick={() => setQty(i.sockId, 0)} aria-label={`Remove ${i.title}`}>Remove</button>
          </li>
        ))}
      </ul>
      <p className="price total">Total: {euro(totalCents)}</p>
      {error && <p className="error" role="alert">{error}</p>}
      {user
        ? <button className="btn" disabled={busy} onClick={checkout}>Place order</button>
        : <p><Link to="/login" state={{ from: '/cart' }}>Log in</Link> or <Link to="/register">register</Link> to check out.</p>}
    </>
  )
}
