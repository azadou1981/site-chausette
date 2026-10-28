export interface CartItem { sockId: number; title: string; priceCents: number; imageUrl: string | null; qty: number }
export const CART_KEY = 'chaussette.cart'
export const MAX_QTY = 99

export function loadCart(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((i) => Number.isInteger(i?.sockId) && Number.isInteger(i?.qty) && i.qty > 0) : []
  } catch {
    return []
  }
}

export function addItem(items: CartItem[], item: Omit<CartItem, 'qty'>, qty = 1): CartItem[] {
  const found = items.find((i) => i.sockId === item.sockId)
  if (!found) return [...items, { ...item, qty: Math.min(qty, MAX_QTY) }]
  return items.map((i) => (i === found ? { ...i, qty: Math.min(i.qty + qty, MAX_QTY) } : i))
}

/** qty <= 0 removes the line. */
export function setQty(items: CartItem[], sockId: number, qty: number): CartItem[] {
  return qty <= 0 ? items.filter((i) => i.sockId !== sockId) : items.map((i) => (i.sockId === sockId ? { ...i, qty: Math.min(qty, MAX_QTY) } : i))
}

export const cartTotal = (items: CartItem[]) => items.reduce((s, i) => s + i.priceCents * i.qty, 0)
export const cartCount = (items: CartItem[]) => items.reduce((s, i) => s + i.qty, 0)
