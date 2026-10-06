import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [logoOk, setLogoOk] = useState(true)

  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)

    try {
      const res = await api.post('/auth/login', {
        userName,
        password
      })

      localStorage.setItem('token', res.data.token)

      if (rememberMe) {
        localStorage.setItem('rememberUser', userName)
      }

      navigate('/dashboard')
    } catch {
      setError('Invalid username or password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">

      {/* ================= LEFT HERO ================= */}
     <section className="login-hero">
  <div className="hero-overlay"></div>

  <div className="hero-top">
    <div className="hero-brand">
      {logoOk ? (
        <img src="/logo.png" alt="Eaton" onError={() => setLogoOk(false)} />
      ) : (
        <div className="hero-eaton-text">EATON</div>
      )}
    </div>
  </div>

  <div className="hero-content">
    <h1 className="hero-title">
      Building Skills.<br />
      <span className="accent">Driving Excellence.</span>
    </h1>

    <p className="hero-tags">
      Track Competencies <span className="dot">•</span>{" "}
      Training Status <span className="dot">•</span>{" "}
      Authorizations <span className="dot">•</span>{" "}
      Certifications
    </p>
  </div>

  {/* Bottom-left, over the employee's shirt */}
  <div className="tagline">
    <strong>Empower People. Enable Growth.</strong>
    <span>Build a Stronger Tomorrow.</span>
  </div>
</section>

      {/* ================= RIGHT LOGIN ================= */}
      <section className="login-panel">

        <div className="login-box">

          {/* Logo */}
          <div className="login-logo">

            {logoOk ? (
              <img
                src="/logo.png"
                alt="Eaton"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <span>EATON</span>
            )}

            <small>Powering Business Worldwide</small>

          </div>

          <h2>Employee Skill Matrix</h2>

          <p className="login-sub">
            Sign in to continue
          </p>

          <form onSubmit={submit}>

            {/* USERNAME */}
            <div className="input-group">

              <div className="input-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" />
                </svg>
              </div>

              <input
                type="text"
                placeholder="Username / Employee ID"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="username"
                autoFocus
                required
              />

            </div>

            {/* PASSWORD */}
            <div className="input-group">

              <div className="input-icon">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 018 0v3" />
                </svg>
              </div>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Show password"
              >
                {showPassword ? '◉' : '◌'}
              </button>

            </div>

            {/* OPTIONS */}
            <div className="login-options">

              <label className="remember-option">

                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />

                <span>Remember me</span>

              </label>

              <button
                type="button"
                className="forgot-btn"
                onClick={() => {
                  alert('Please contact your administrator to reset your password.')
                }}
              >
                Forgot password?
              </button>

            </div>

            {/* ERROR */}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="login-btn"
              disabled={busy}
            >
              {busy ? (
                'Signing in...'
              ) : (
                <>
                  Sign In
                  <span className="login-arrow">→</span>
                </>
              )}
            </button>

            {/* OR */}
           
            {/* MICROSOFT BUTTON */}
        

          </form>

          {/* SECURITY MESSAGE */}
          <div className="authorized-box">

            <div className="authorized-icon">
              ✓
            </div>

            <div>
              <strong>Authorized users only</strong>

              <p>
                This system is for Eaton internal use only.
              </p>
            </div>

          </div>

          <div className="login-footer">
            Together we make what matters work.
          </div>

        </div>

      </section>
      {/* ================= BOTTOM-RIGHT VALUES BOX ================= */}
      <div className="login-values">

        <div className="value-item">
          <div className="value-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="9" cy="8" r="3.2" />
              <path d="M2.5 19c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5z" />
              <circle cx="17" cy="9" r="2.5" />
              <path d="M16.5 13.6c2.9 0 5 1.8 5 4.4h-4.2c0-1.7-.4-3.2-.8-4.4z" />
            </svg>
          </div>
          <div>
            <strong>People Development</strong>
            <span>Grow together</span>
          </div>
        </div>

        <div className="value-item">
          <div className="value-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3.2" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1" />
            </svg>
          </div>
          <div>
            <strong>Operational Excellence</strong>
            <span>Build capability</span>
          </div>
        </div>

        <div className="value-item">
          <div className="value-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z" />
              <path d="M8.5 12l2.5 2.5 4.5-5" />
            </svg>
          </div>
          <div>
            <strong>A Safer Workplace</strong>
            <span>Skills for safety</span>
          </div>
        </div>

        <div className="value-item">
          <div className="value-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 4C11 4 5 8.5 5 14c0 1.6.6 3 1.6 4C7 13 11 9.5 16 8c-4 2.5-7 6-8.3 11.2C9 20 10.4 20.5 12 20.5c5 0 8-5 8-16.5z" />
            </svg>
          </div>
          <div>
            <strong>Sustainable Growth</strong>
            <span>A stronger tomorrow</span>
          </div>
        </div>

      </div>
    </div>
  )
}