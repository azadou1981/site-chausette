import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError, initCsrf } from '../api/client'

export interface User { id: number; name: string; email: string; role: 'user' | 'admin' }
interface AuthValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  register: (name: string, email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initCsrf()
      .then(() => api<{ user: User }>('/auth/me'))
      .then((r) => setUser(r.user))
      .catch((e) => { if (!(e instanceof ApiError)) console.error(e) }) // 401 = not logged in
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ user: User }>('/auth/login', { method: 'POST', body: { email, password } })
    setUser(r.user)
    return r.user
  }, [])
  const register = useCallback(async (name: string, email: string, password: string) => {
    const r = await api<{ user: User }>('/auth/register', { method: 'POST', body: { name, email, password } })
    setUser(r.user)
    return r.user
  }, [])
  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' })
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, register, logout }), [user, loading, login, register, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
