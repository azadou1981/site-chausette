export interface Sock { id: number; title: string; description: string; priceCents: number; imageUrl: string | null; stock: number }
export interface SockPage { items: Sock[]; page: number; pageSize: number; total: number }
export interface Order { id: number; totalCents: number; createdAt: string; items: { sockId: number; title: string; unitPriceCents: number; qty: number }[] }
export const euro = (cents: number) => `€${(cents / 100).toFixed(2)}`
