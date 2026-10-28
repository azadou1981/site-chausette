import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, ApiError, assetUrl } from '../../api/client'
import type { Sock } from '../../api/types'

export default function SockForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('0')
  const [file, setFile] = useState<File | null>(null)
  const [current, setCurrent] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    api<Sock>(`/socks/${id}`).then((s) => {
      setTitle(s.title); setDescription(s.description); setPrice((s.priceCents / 100).toFixed(2)); setStock(String(s.stock)); setCurrent(s.imageUrl)
    }).catch((e) => setError(e.message))
  }, [id])

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    const priceCents = Math.round(Number(price) * 100)
    if (!title.trim() || !description.trim()) return setError('Title and description are required')
    if (!Number.isFinite(priceCents) || priceCents <= 0) return setError('Price must be greater than 0')
    if (!Number.isInteger(Number(stock)) || Number(stock) < 0) return setError('Stock must be a whole number, 0 or more')
    const fd = new FormData()
    fd.append('title', title.trim()); fd.append('description', description.trim())
    fd.append('priceCents', String(priceCents)); fd.append('stock', stock)
    if (file) fd.append('image', file)
    try {
      await api(id ? `/socks/${id}` : '/socks', { method: id ? 'PUT' : 'POST', body: fd })
      navigate('/admin')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save')
    }
  }

  const shown = preview ?? (current ? assetUrl(current) : null)
  return (
    <form className="auth-form card" onSubmit={submit} noValidate>
      <h1>{id ? 'Edit sock' : 'New sock'}</h1>
      <div className="field"><label htmlFor="title">Title</label><input id="title" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="field"><label htmlFor="desc">Description</label><textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="field"><label htmlFor="price">Price (€)</label><input id="price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
      <div className="field"><label htmlFor="stock">Stock</label><input id="stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} /></div>
      <div className="field"><label htmlFor="image">Image</label><input id="image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
      {shown && <img src={shown} alt="Preview" className="preview" />}
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn" type="submit">Save</button>
    </form>
  )
}
