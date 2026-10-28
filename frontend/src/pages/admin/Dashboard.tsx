import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, assetUrl } from '../../api/client'
import { euro, type Sock, type SockPage } from '../../api/types'

export default function Dashboard() {
  const [socks, setSocks] = useState<Sock[]>([])
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    try {
      const all: Sock[] = []
      for (let p = 1; ; p++) {
        const r = await api<SockPage>(`/socks?page=${p}`)
        all.push(...r.items)
        if (all.length >= r.total || !r.items.length) break
      }
      setSocks(all)
    } catch (e) { setError((e as Error).message) }
  }, [])
  useEffect(() => { load() }, [load])

  async function remove(s: Sock) {
    if (!window.confirm(`Delete "${s.title}"?`)) return
    try { await api(`/socks/${s.id}`, { method: 'DELETE' }); await load() } catch (e) { setError((e as Error).message) }
  }

  return (
    <>
      <h1>Admin</h1>
      <p><Link className="btn" to="/admin/socks/new">New sock</Link> <Link to="/admin/orders">All orders</Link></p>
      {error && <p className="error" role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead><tr><th>Image</th><th>Title</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
          <tbody>
            {socks.map((s) => (
              <tr key={s.id}>
                <td><img src={assetUrl(s.imageUrl)} alt="" width={48} height={48} /></td>
                <td>{s.title}</td><td>{euro(s.priceCents)}</td><td>{s.stock}</td>
                <td><Link to={`/admin/socks/${s.id}`}>Edit</Link> <button className="link" onClick={() => remove(s)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
