import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { euro, type Order } from '../../api/types'

type AdminOrder = Order & { user?: { name: string; email: string } }

export default function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api<{ items: AdminOrder[] }>('/admin/orders').then((r) => setOrders(r.items)).catch((e) => setError(e.message)) }, [])
  if (error) return <p className="error" role="alert">{error}</p>
  if (!orders) return <p>Loading…</p>
  return (
    <>
      <h1>All orders</h1>
      {orders.length === 0 && <p>No orders yet.</p>}
      {orders.map((o) => (
        <section key={o.id} className="card order">
          <h2>Order #{o.id} — {euro(o.totalCents)}</h2>
          <p>{o.user?.name} ({o.user?.email}) · {new Date(o.createdAt).toLocaleString()}</p>
          <ul>{o.items.map((i) => <li key={i.sockId}>{i.qty} × {i.title}</li>)}</ul>
        </section>
      ))}
    </>
  )
}
