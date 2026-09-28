import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function Login() {
  const [userName, setUserName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/login', { userName, password })
      localStorage.setItem('token', res.data.token)
      navigate('/dashboard')
    } catch {
      setError('Invalid username or password.')
    }
  }

  return (
    <div className="login-screen">
      <form className="card login-card" onSubmit={submit}>
        <h1>Employee Skill Matrix</h1>
        <label>
          Username
          <input value={userName} onChange={(e) => setUserName(e.target.value)} autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="error">{error}</p>}
        <button type="submit">Log in</button>
      </form>
    </div>
  )
}
