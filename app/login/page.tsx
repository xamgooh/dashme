'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
    if (res.ok) { router.push('/dashboard') }
    else { const d = await res.json(); setError(d.error ?? 'Inloggning misslyckades'); setLoading(false) }
  }

  return (
    <div style={{ background: '#f8f7f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '2.5rem', width: '100%', maxWidth: 360 }}>
        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 6 }}>iCyber AB</div>
          <div style={{ fontSize: 26, fontWeight: 500, color: '#111', letterSpacing: '-0.5px' }}>Dashme</div>
        </div>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Användarnamn</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username"
              style={{ width: '100%', background: '#f8f7f5', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '10px 14px', color: '#111', fontSize: 14, outline: 'none' }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Lösenord</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password"
              style={{ width: '100%', background: '#f8f7f5', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '10px 14px', color: '#111', fontSize: 14, outline: 'none' }} />
          </div>
          {error && <div style={{ fontSize: 12, color: '#ef4444', background: '#fef2f2', padding: '7px 12px', borderRadius: 7, border: '0.5px solid rgba(239,68,68,0.2)' }}>{error}</div>}
          <button type="submit" disabled={loading}
            style={{ marginTop: 4, padding: '11px', background: '#111', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}>
            {loading ? 'Loggar in…' : 'Logga in'}
          </button>
        </form>
      </div>
    </div>
  )
}
