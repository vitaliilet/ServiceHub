import './Register.css'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('CLIENT')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setLoading(true)

    try {
      const csrfResponse = await fetch('/api/auth/csrf', {
        credentials: 'same-origin'
      })

      if (!csrfResponse.ok) {
        throw new Error('Could not initialize registration.')
      }

      const csrf = await csrfResponse.json()

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          [csrf.headerName]: csrf.token
        },
        body: JSON.stringify({ name, email, password, role })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed.')
      }

      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <h1>Create Account</h1>
      <p>Join ServiceHub today</p>

      <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            {[
              {
                value: 'CLIENT',
                title: "I'm a Client",
                description: 'Find and book professionals',
                icon: '👤'
              },
              {
                value: 'PROFESSIONAL',
                title: "I'm a Professional",
                description: 'Offer my services',
                icon: '💼'
              }
            ].map(item => (
              <button
                key={item.value}
                type="button"
                onClick={() => setRole(item.value)}
                style={{
                  flex: 1,
                  padding: '16px 10px',
                  border: role === item.value
                    ? '2px solid #2563eb'
                    : '2px solid #e5e7eb',
                  borderRadius: 12,
                  background: role === item.value ? '#eff6ff' : '#ffffff',
                  color: '#14213d',
                  cursor: 'pointer',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 26 }}>{item.icon}</div>
                <strong>{item.title}</strong>
                <div style={{ fontSize: 12, marginTop: 6 }}>
                  {item.description}
                </div>
              </button>
            ))}
          </div>
        <input
          type="text"
          placeholder="Full name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          minLength={8}
          required
        />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>

      <p>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </div>
  )
}
