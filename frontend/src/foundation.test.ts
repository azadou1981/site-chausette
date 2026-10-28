import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { addItem, cartCount, cartTotal, CART_KEY, loadCart, setQty } from './context/cart'
import { api, ApiError, initCsrf } from './api/client'

const sock = { sockId: 1, title: 'Red', priceCents: 1000, imageUrl: null }

describe('cart', () => {
  beforeEach(() => localStorage.clear())
  it('adds, merges, sets quantity, removes and totals', () => {
    let c = addItem([], sock)
    c = addItem(c, sock, 2)
    c = addItem(c, { ...sock, sockId: 2, priceCents: 250 })
    expect(cartCount(c)).toBe(4)
    expect(cartTotal(c)).toBe(3250)
    expect(setQty(c, 1, 0).map((i) => i.sockId)).toEqual([2])
    expect(setQty(c, 1, 500)[0].qty).toBe(99)
  })
  it('loads persisted carts and ignores corrupt data', () => {
    localStorage.setItem(CART_KEY, JSON.stringify(addItem([], sock, 2)))
    expect(loadCart()).toHaveLength(1)
    localStorage.setItem(CART_KEY, '{nope')
    expect(loadCart()).toEqual([])
    localStorage.setItem(CART_KEY, JSON.stringify([{ sockId: 'x', qty: 1 }]))
    expect(loadCart()).toEqual([])
  })
})

describe('api client', () => {
  it('sends credentials and CSRF, and retries once after a CSRF 403', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    let token = 0
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.endsWith('/csrf')) return new Response(JSON.stringify({ csrfToken: `t${++token}` }))
      const sent = (init?.headers as Record<string, string>)['X-CSRF-Token']
      return sent === 't2' ? new Response('{"ok":true}') : new Response('{"error":{"code":"CSRF","message":"x"}}', { status: 403 })
    }))
    await initCsrf()
    expect(await api('/things', { method: 'POST', body: { a: 1 } })).toEqual({ ok: true })
    expect(calls.filter((c) => c.url.endsWith('/things'))).toHaveLength(2)
    expect(calls.every((c) => c.init?.credentials === 'include')).toBe(true)
  })
  it('throws ApiError with the server code', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) =>
      url.endsWith('/csrf') ? new Response('{"csrfToken":"t"}') : new Response('{"error":{"code":"VALIDATION","message":"bad"}}', { status: 400 })))
    await initCsrf()
    await expect(api('/x', { method: 'POST' })).rejects.toMatchObject({ status: 400, code: 'VALIDATION' })
    await expect(api('/x', { method: 'POST' })).rejects.toBeInstanceOf(ApiError)
  })
})

describe('styles', () => {
  it('gives the page the brand background', () => {
    const style = document.createElement('style')
    style.textContent = readFileSync('src/index.css', 'utf8')
    document.head.append(style)
    expect(getComputedStyle(document.body).backgroundColor).toBe('rgb(246, 230, 209)')
  })
})
