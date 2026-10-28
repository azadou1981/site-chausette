import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { addItem, cartCount, cartTotal, CART_KEY, loadCart, setQty, type CartItem } from './cart'

interface CartValue {
  items: CartItem[]
  count: number
  totalCents: number
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  setQty: (sockId: number, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart)
  useEffect(() => localStorage.setItem(CART_KEY, JSON.stringify(items)), [items])
  const value = useMemo<CartValue>(() => ({
    items,
    count: cartCount(items),
    totalCents: cartTotal(items),
    add: (item, qty) => setItems((c) => addItem(c, item, qty)),
    setQty: (id, qty) => setItems((c) => setQty(c, id, qty)),
    clear: () => setItems([]),
  }), [items])
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
