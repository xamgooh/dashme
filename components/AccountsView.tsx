'use client'
import { useState } from 'react'
import { Account } from '@/lib/types'

type Props = { accounts: Account[]; onRefresh: () => void; connectUrl: string }

export default function AccountsView({ accounts, onRefresh, connectUrl }: Props) {
  const [busy, setBusy]           = useState<Record<string, boolean>>({})
  const [confirming, setConfirming] = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})

  async function toggleConnect(account: Account) {
    setBusy(p => ({ ...p, [account.id]: true }))
    await fetch(`/api/accounts/${account.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connected: !account.connected }) })
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
    await fetch(`/api/sites/${siteId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ active }) })
    await onRefresh()
    setBusy(p => ({ ...p, [siteId]: false }))
  }

  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, marginBottom: 8, overflow: 'hidden' }
  const pill = (active: boolean, connected: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 20, cursor: connected && !active ? 'pointer' : connected ? 'pointer' : 'not-allowed',
    fontSize: 12, fontWeight: active ? 500 : 400,
    background: active && connected ? '#f0fdf4' : '#f8f7f5',
    color: active && connected ? '#166534' : '#9ca3af',
    border: `0.5px solid ${active && connected ? 'rgba(22,163,74,0.25)' : 'rgba(0,0,0,0.06)'}`,
    transition: 'all 0.15s',
  })

  return (
    <div style={{ maxWidth: 800 }}>
      {accounts.length === 0 && (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
          Inga konton connectedade
        </div>
      )}

      {accounts.map(account => {
        const isExpanded = !!expanded[account.id]
        const activeCnt  = account.sites.filter(s => s.active).length

        return (
          <div key={account.id} style={card}>
            {/* Account row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer' }}
              onClick={() => setExpanded(p => ({ ...p, [account.id]: !p[account.id] }))}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M4.5 2.5l4 3.5-4 3.5" stroke="#9ca3af" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: account.connected ? '#f0fdf4' : '#f8f7f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke={account.connected ? '#059669' : '#9ca3af'} strokeWidth="1.5"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={account.connected ? '#059669' : '#9ca3af'} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#111', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{account.email}</div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    {activeCnt} av {account.sites.length} aktiva · Connected {new Date(account.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }} onClick={e => e.stopPropagation()}>
                {!account.connected && (
                  <button onClick={() => setConfirming(confirming === account.id ? null : account.id)}
                    style={{ padding: '5px 12px', fontSize: 12, borderRadius: 8, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', fontWeight: 500 }}>
                    Remove
                  </button>
                )}
                <button onClick={() => toggleConnect(account)} disabled={busy[account.id]}
                  style={{ padding: '5px 14px', fontSize: 12, borderRadius: 8, border: 'none', cursor: busy[account.id] ? 'not-allowed' : 'pointer', fontWeight: 500, transition: 'all 0.15s',
                    background: busy[account.id] ? '#f0eeeb' : account.connected ? '#fef2f2' : '#f0fdf4',
                    color: busy[account.id] ? '#9ca3af' : account.connected ? '#ef4444' : '#059669',
                  }}>
                  {busy[account.id] ? '…' : account.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Remove confirmation */}
            {confirming === account.id && (
              <div style={{ margin: '0 18px 12px', background: '#fef2f2', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#ef4444' }}>Ta bort kontot och alla sajter permanent?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirming(null)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 7, border: 'none', background: '#f0eeeb', color: '#6b7280', cursor: 'pointer' }}>Avbryt</button>
                  <button onClick={() => removeAccount(account.id)} disabled={busy[account.id]}
                    style={{ padding: '4px 12px', fontSize: 12, borderRadius: 7, border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    {busy[account.id] ? '…' : 'Ta bort'}
                  </button>
                </div>
              </div>
            )}

            {/* Disconnected notice */}
            {!account.connected && (
              <div style={{ margin: '0 18px 12px', padding: '10px 14px', background: '#f8f7f5', borderRadius: 8, fontSize: 12, color: '#9ca3af' }}>
                Disconnectat — data synkas inte. Klicka Connect för att aktivera igen.
              </div>
            )}

            {/* Expanded — sites as chips */}
            {isExpanded && (
              <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '14px 18px 16px' }}>
                <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Sajter</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {account.sites.map(site => {
                    const isBusy = busy[site.id]
                    const short = (site.displayName ?? site.url).replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()
                    return (
                      <div key={site.id}
                        onClick={() => account.connected && !isBusy && toggleSite(site.id, !site.active)}
                        title={site.url}
                        style={{ ...pill(site.active, account.connected), opacity: isBusy ? 0.5 : 1 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: site.active && account.connected ? '#10b981' : '#d1d5db', display: 'inline-block', flexShrink: 0 }} />
                        {short}
                        {site.active && account.connected && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 4l2 2 3-3" stroke="#059669" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* Connect new account */}
      <a href={connectUrl} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, border: '0.5px dashed rgba(0,0,0,0.12)', background: 'transparent', textDecoration: 'none', color: '#059669', fontSize: 13, fontWeight: 500, marginTop: 4, cursor: 'pointer', transition: 'background 0.15s' }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
        Connect account
      </a>
    </div>
  )
}
