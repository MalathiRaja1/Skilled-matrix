import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [logoOk, setLogoOk] = useState(true)
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const res = await api.post('/auth/login', { userName, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-hero" aria-hidden="true">
        <div className="login-hero-text">
          <h2>We make what matters work.</h2>
          <p>Know who is trained, authorised and competent on every station.</p>
        </div>
      </div>

      <div className="login-panel">
        <form className="login-box" onSubmit={submit}>
          <div className="login-logo">
            {logoOk ? (
              <img src="/logo.png" alt="Eaton" onError={() => setLogoOk(false)} />
            ) : (
              <span>EATON</span>
            )}
          </div>
          <h1>Employee Skill Matrix</h1>
          <p className="login-sub">Sign in to continue</p>

          <label>
            Username
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}
          <button type="submit" className="login-btn" disabled={busy}>
            {busy ? 'Signing in…' : 'Log in'}
          </button>
        </form>
      </div>
    </div>
  )
}
