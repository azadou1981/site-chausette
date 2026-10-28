import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, assetUrl } from '../api/client'
import { euro, type Sock } from '../api/types'
import { useCart } from '../context/CartContext'

export default function Product() {
  const { id } = useParams()
  const { add } = useCart()
  const [sock, setSock] = useState<Sock | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { api<Sock>(`/socks/${id}`).then(setSock).catch((e) => setError(e.message)) }, [id])
  if (error) return <p className="error" role="alert">{error}</p>
  if (!sock) return <p>Loading…</p>
  return (
    <article className="card product">
      <img src={assetUrl(sock.imageUrl)} alt={sock.title} />
      <div>
        <h1>{sock.title}</h1>
        <p>{sock.description}</p>
        <p className="price">{euro(sock.priceCents)}</p>
        <p>{sock.stock > 0 ? `${sock.stock} in stock` : 'Sold out'}</p>
        <button className="btn" disabled={sock.stock < 1} onClick={() => add({ sockId: sock.id, title: sock.title, priceCents: sock.priceCents, imageUrl: sock.imageUrl })}>Add to cart</button>
      </div>
    </article>
  )
}
