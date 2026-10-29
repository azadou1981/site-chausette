import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { API_URL, ApiError } from '../api/client'
import { useAuth } from '../context/AuthContext'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Shared login/register form: client-side validation, server errors shown inline. */
export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/'
  const isRegister = mode === 'register'
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState(() => (new URLSearchParams(useLocation().search).get('error') === 'google' ? 'Google sign-in failed, please try again' : ''))
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const name = String(f.get('name') ?? '').trim()
    const email = String(f.get('email')).trim()
    const password = String(f.get('password'))
    const errs: Record<string, string> = {}
    if (isRegister && !name) errs.name = 'Name is required'
    if (!EMAIL_RE.test(email)) errs.email = 'Enter a valid email address'
    if (isRegister ? password.length < 8 : !password) errs.password = isRegister ? 'Password must be at least 8 characters' : 'Password is required'
    setErrors(errs)
    setFormError('')
    if (Object.keys(errs).length) return
    setBusy(true)
    try {
      if (isRegister) await register(name, email, password)
      else await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const fields: Record<string, string> = {}
        err.details?.forEach((d) => { fields[d.path] = d.message })
        setErrors(fields)
        setFormError(err.message)
      } else setFormError('Network error, please try again')
    } finally {
      setBusy(false)
    }
  }

  const field = (id: string, label: string, type: string, auto: string) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} name={id} type={type} autoComplete={auto} aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} />
      {errors[id] && <span id={`${id}-err`} className="error">{errors[id]}</span>}
    </div>
  )

  return (
    <form className="card auth-form" onSubmit={onSubmit} noValidate>
      <h1>{isRegister ? 'Create your account' : 'Log in'}</h1>
      {formError && <p role="alert" className="error">{formError}</p>}
      {isRegister && field('name', 'Name', 'text', 'name')}
      {field('email', 'Email', 'email', 'email')}
      {field('password', 'Password', 'password', isRegister ? 'new-password' : 'current-password')}
      <button className="btn" type="submit" disabled={busy}>{isRegister ? 'Register' : 'Log in'}</button>
      <a className="btn-google" href={`${API_URL}/api/auth/google`}>Continuer avec Google</a>
      <p>{isRegister ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}</p>
    </form>
  )
}
