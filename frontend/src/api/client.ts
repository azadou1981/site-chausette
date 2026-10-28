export const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export class ApiError extends Error {
  status: number
  code: string
  details?: { path: string; message: string }[]
  constructor(status: number, code: string, message: string, details?: { path: string; message: string }[]) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

let csrfToken: string | null = null

export async function initCsrf(): Promise<void> {
  const res = await fetch(`${API_URL}/api/csrf`, { credentials: 'include' })
  csrfToken = (await res.json()).csrfToken
}

/** Absolute URL for an image path returned by the API (e.g. /uploads/x.png). */
export const assetUrl = (p: string | null) => (p ? `${API_URL}${p}` : '')

async function send(method: string, path: string, body?: unknown): Promise<Response> {
  if (!csrfToken) await initCsrf()
  const headers: Record<string, string> = { 'X-CSRF-Token': csrfToken! }
  let payload: BodyInit | undefined
  if (body instanceof FormData) payload = body
  else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  return fetch(`${API_URL}/api${path}`, { method, headers, body: payload, credentials: 'include' })
}

/** JSON API call with credentials and CSRF; refetches the token and retries once on 403 CSRF. */
export async function api<T = unknown>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const method = opts.method ?? 'GET'
  let res = await send(method, path, opts.body)
  if (res.status === 403 && method !== 'GET') {
    const peek = await res.clone().json().catch(() => null)
    if (peek?.error?.code === 'CSRF') {
      await initCsrf()
      res = await send(method, path, opts.body)
    }
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new ApiError(res.status, data?.error?.code ?? 'ERROR', data?.error?.message ?? 'Request failed', data?.error?.details)
  return data as T
}
