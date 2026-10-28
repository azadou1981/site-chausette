import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { SockPage } from '../api/types'
import SockCard from '../components/SockCard'

export default function Home() {
  const [q, setQ] = useState('')
  const [term, setTerm] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<SockPage | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    api<SockPage>(`/socks?page=${page}&q=${encodeURIComponent(term)}`).then(setData).catch((e) => setError(e.message))
  }, [page, term])

  const submit = (e: FormEvent) => { e.preventDefault(); setPage(1); setTerm(q.trim()) }
  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  return (
    <>
      <section className="hero">
        <h1>Chaussette</h1>
        <p>Warm, cosy socks for every day.</p>
      </section>
      <form className="search" role="search" onSubmit={submit}>
        <label htmlFor="q">Search socks</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" type="submit">Search</button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
      {data && data.items.length === 0 && <p>No socks found.</p>}
      <div className="grid">{data?.items.map((s) => <SockCard key={s.id} sock={s} />)}</div>
      {data && pages > 1 && (
        <nav className="pager" aria-label="Pagination">
          <button className="btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {pages}</span>
          <button className="btn" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
        </nav>
      )}
    </>
  )
}
