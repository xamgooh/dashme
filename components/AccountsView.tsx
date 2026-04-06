'use client'

import { useState } from 'react'

type AccountSite = {
  id: string
  url: string
  displayName: string | null
  active: boolean
  color: string
  lastSynced: string | null
}

type Account = {
  id: string
  email: string
  connected: boolean
  createdAt: string
  sites: AccountSite[]
}

type Props = {
  accounts: Account[]
  onRefresh: () => void
  connectUrl: string
}

function fmtN(n: number) {
  if (n >= 1000) return Math.round(n / 1000) + 'K'
  return String(n)
}

export default function AccountsView({ accounts, onRefresh, connectUrl }: Props) {
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [confirming, setConfirming] = useState<string | null>(null)

  async function toggleConnect(account: Account) {
    setBusy(p => ({ ...p, [account.id]: true }))
    await fetch(`/api/accounts/${account.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: !account.connected }),
    })
    await onRefresh()
    setBusy(p => ({ ...p, [account.id]: false }))
  }

  async function removeAccount(id: string) {
    setBusy(p => ({ ...p, [id]: true }))
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
    setConfirming(null)
    await onRefresh()
    setBusy(p => ({ ...p, [id]: false }))
  }

  async function toggleSite(siteId: string, active: boolean) {
    setBusy(p => ({ ...p, [siteId]: true }))
    await fetch(`/api/sites/${siteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    await onRefresh()
    setBusy(p => ({ ...p, [siteId]: false }))
  }

  const card: React.CSSProperties = { background: '#131318', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem', marginBottom: 16 }

  return (
    <div>
      {accounts.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '3rem', color: '#50507a' }}>
          Inga konton connectedade — klicka Connect account
        </div>
      )}

      {accounts.map(account => (
        <div key={account.id} style={card}>
          {/* Account header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: account.connected ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke={account.connected ? '#34d399' : '#50507a'} strokeWidth="1.5"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={account.connected ? '#34d399' : '#50507a'} strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#e8e8f4' }}>{account.email}</div>
                <div style={{ fontSize: 11, color: '#50507a', marginTop: 2 }}>
                  {account.sites.filter(s => s.active).length} av {account.sites.length} sajter aktiva
                  {' · '}Connected {new Date(account.createdAt).toLocaleDateString('sv-SE')}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Disconnect/Connect toggle */}
              {!account.connected && (
                <button
                  onClick={() => setConfirming(confirming === account.id ? null : account.id)}
                  style={{ padding: '5px 12px', fontSize: 12, borderRadius: 7, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer' }}
                >
                  Remove
                </button>
              )}
              <button
                onClick={() => toggleConnect(account)}
                disabled={busy[account.id]}
                style={{
                  padding: '5px 14px', fontSize: 12, borderRadius: 7, cursor: busy[account.id] ? 'not-allowed' : 'pointer',
                  border: account.connected ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(52,211,153,0.3)',
                  background: 'transparent',
                  color: busy[account.id] ? '#50507a' : account.connected ? '#f87171' : '#34d399',
                  transition: 'all 0.15s',
                }}
              >
                {busy[account.id] ? '…' : account.connected ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>

          {/* Remove confirmation */}
          {confirming === account.id && (
            <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#f87171' }}>Ta bort kontot och alla dess sajter permanent?</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirming(null)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#7070a0', cursor: 'pointer' }}>Avbryt</button>
                <button onClick={() => removeAccount(account.id)} disabled={busy[account.id]} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 6, border: 'none', background: '#f87171', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                  {busy[account.id] ? '…' : 'Ta bort'}
                </button>
              </div>
            </div>
          )}

          {/* Disconnected notice */}
          {!account.connected && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12, fontSize: 12, color: '#50507a' }}>
              Kontot är disconnectat — data synkas inte. Klicka Connect för att aktivera igen, eller lägg till kontot på nytt via Connect account.
            </div>
          )}

          {/* Sites list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {account.sites.map(site => (
              <div key={site.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 12px', borderRadius: 8,
                background: site.active && account.connected ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: '1px solid rgba(255,255,255,0.05)',
                opacity: account.connected ? 1 : 0.4,
                transition: 'all 0.15s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: site.color, opacity: site.active ? 1 : 0.3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, color: site.active ? '#e8e8f4' : '#50507a', fontWeight: 500 }}>
                      {site.displayName ?? site.url}
                    </div>
                    {site.lastSynced && (
                      <div style={{ fontSize: 11, color: '#50507a', marginTop: 2 }}>
                        Senaste sync {new Date(site.lastSynced).toLocaleDateString('sv-SE')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: site.active ? '#34d399' : '#50507a' }}>
                    {site.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  {/* Toggle */}
                  <div
                    onClick={() => account.connected && !busy[site.id] && toggleSite(site.id, !site.active)}
                    style={{
                      width: 40, height: 22, borderRadius: 11, position: 'relative',
                      cursor: account.connected && !busy[site.id] ? 'pointer' : 'not-allowed',
                      background: site.active && account.connected ? '#818cf8' : 'rgba(255,255,255,0.1)',
                      transition: 'background 0.2s',
                      opacity: busy[site.id] ? 0.5 : 1,
                    }}
                  >
                    <div style={{
                      position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      left: site.active ? 21 : 3, transition: 'left 0.2s',
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Connect new account */}
      <a href={connectUrl} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        padding: '14px', borderRadius: 12, border: '1px dashed rgba(52,211,153,0.3)',
        background: 'transparent', textDecoration: 'none', color: '#34d399', fontSize: 13,
        transition: 'all 0.15s', cursor: 'pointer',
      }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        Connect account
      </a>
    </div>
  )
}
