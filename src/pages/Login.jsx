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

        {/* Top Eaton branding */}
        <div className="hero-top">

          <div className="hero-brand">
            {logoOk ? (
              <img
                src="/logo.png"
                alt="Eaton"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="hero-eaton-text">
                EATON
              </div>
            )}

            <span>Powering Business Worldwide</span>
          </div>

          <div className="hero-language">
            <span>🌐</span>
            <span>English</span>
            <span>⌄</span>
          </div>

        </div>

        {/* Main hero content */}
        <div className="hero-content">

          <div className="hero-title">
            <h1>
              Building Skills.
              <br />
              <span>Driving Excellence.</span>
            </h1>

            <p className="hero-subtitle">
              Track Competencies&nbsp; • &nbsp;Training Status&nbsp; •
              &nbsp;Authorizations&nbsp; • &nbsp;Certifications
            </p>

            <div className="hero-line"></div>

            <p className="hero-description">
              Empower People. Enable Growth.
              <br />
              Build a Stronger Tomorrow.
            </p>
          </div>

        </div>

        {/* Employee image is the background */}
        <div className="employee-caption">
          <span>
            Empowered People.
            <br />
            Building a Stronger Eaton.
          </span>
        </div>

        {/* ================= BOTTOM VALUES ================= */}
        {/* <div className="login-values">

          <div className="value-item">
            <div className="value-icon">👥</div>
            <div>
              <strong>People Development</strong>
              <span>Grow Together</span>
            </div>
          </div>

          <div className="value-divider"></div>

          <div className="value-item">
            <div className="value-icon">⚙</div>
            <div>
              <strong>Operational Excellence</strong>
              <span>Build Capability</span>
            </div>
          </div>

          <div className="value-divider"></div>

          <div className="value-item">
            <div className="value-icon">🛡</div>
            <div>
              <strong>A Safer Workplace</strong>
              <span>Skills for Safety</span>
            </div>
          </div>

          <div className="value-divider"></div>

          <div className="value-item">
            <div className="value-icon">🌿</div>
            <div>
              <strong>Sustainable Growth</strong>
              <span>A Stronger Tomorrow</span>
            </div>
          </div>

        </div> */}

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

    </div>
  )
}