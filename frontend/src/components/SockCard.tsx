import { Link } from 'react-router-dom'
import { assetUrl } from '../api/client'
import { euro, type Sock } from '../api/types'
import { useCart } from '../context/CartContext'

export default function SockCard({ sock }: { sock: Sock }) {
  const { add } = useCart()
  return (
    <article className="card sock-card">
      <Link to={`/socks/${sock.id}`}>
        <img src={assetUrl(sock.imageUrl)} alt={sock.title} loading="lazy" />
        <h2>{sock.title}</h2>
      </Link>
      <p className="desc">{sock.description}</p>
      <p className="price">{euro(sock.priceCents)}</p>
      <button className="btn" disabled={sock.stock < 1} onClick={() => add({ sockId: sock.id, title: sock.title, priceCents: sock.priceCents, imageUrl: sock.imageUrl })}>
        {sock.stock < 1 ? 'Sold out' : 'Add to cart'}
      </button>
    </article>
  )
}
