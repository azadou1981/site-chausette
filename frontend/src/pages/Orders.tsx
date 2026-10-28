import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { euro, type Order } from '../api/types'

export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api<{ items: Order[] }>('/orders').then((r) => setOrders(r.items)).catch((e) => setError(e.message)) }, [])
  if (error) return <p className="error" role="alert">{error}</p>
  if (!orders) return <p>Loading…</p>
  return (
    <>
      <h1>Your orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <section key={o.id} className="card order">
          <h2>Order #{o.id} — {euro(o.totalCents)}</h2>
          <p>{new Date(o.createdAt).toLocaleString()}</p>
          <ul>{o.items.map((i) => <li key={i.sockId}>{i.qty} × {i.title} ({euro(i.unitPriceCents)})</li>)}</ul>
        </section>
      ))}
    </>
  )
}
