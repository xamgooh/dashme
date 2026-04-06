'use client'

import { useState } from 'react'
import { Account } from '@/lib/types'

type Props = {
  accounts: Account[]
  onRefresh: () => void
  connectUrl: string
}

export default function AccountsView({ accounts, onRefresh, connectUrl }: Props) {
  const [busy, setBusy]           = useState<Record<string, boolean>>({})
  const [confirming, setConfirming] = useState<string | null>(null)
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})

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

  const card: React.CSSProperties = {
    background: '#131318',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  }

  return (
    <div>
      {accounts.length === 0 && (
        <div style={{ ...card, padding: '3rem', textAlign: 'center', color: '#50507a' }}>
          Inga konton connectedade — klicka Connect account nedan
        </div>
      )}

      {accounts.map(account => {
        const isExpanded = !!expanded[account.id]
        const activeCnt  = account.sites.filter(s => s.active).length

        return (
          <div key={account.id} style={card}>
            {/* Account row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
              {/* Left: expand arrow + info */}
              <div
                style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1, minWidth: 0 }}
                onClick={() => setExpanded(p => ({ ...p, [account.id]: !p[account.id] }))}
              >
                <svg
                  width="14" height="14" viewBox="0 0 14 14" fill="none"
                  style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}
                >
                  <path d="M5 3l4 4-4 4" stroke="#50507a" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: account.connected ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="8" r="4" stroke={account.connected ? '#34d399' : '#50507a'} strokeWidth="1.5"/>
                    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={account.connected ? '#34d399' : '#50507a'} strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f4', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {account.email}
                  </div>
                  <div style={{ fontSize: 11, color: '#50507a', marginTop: 2 }}>
                    {activeCnt} av {account.sites.length} sajter aktiva · Connected {new Date(account.createdAt).toLocaleDateString('sv-SE')}
                  </div>
                </div>
              </div>

              {/* Right: buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 16 }}>
                {!account.connected && (
                  <button
                    onClick={() => setConfirming(confirming === account.id ? null : account.id)}
                    style={{ padding: '4px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(248,113,113,0.3)', background: 'transparent', color: '#f87171', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
                <button
                  onClick={() => toggleConnect(account)}
                  disabled={busy[account.id]}
                  style={{
                    padding: '4px 12px', fontSize: 12, borderRadius: 6, cursor: busy[account.id] ? 'not-allowed' : 'pointer',
                    border: account.connected ? '1px solid rgba(248,113,113,0.3)' : '1px solid rgba(52,211,153,0.3)',
                    background: 'transparent',
                    color: busy[account.id] ? '#50507a' : account.connected ? '#f87171' : '#34d399',
                  }}
                >
                  {busy[account.id] ? '…' : account.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>

            {/* Remove confirmation */}
            {confirming === account.id && (
              <div style={{ margin: '0 16px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: '#f87171' }}>Ta bort kontot och alla sajter permanent?</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirming(null)} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#7070a0', cursor: 'pointer' }}>Avbryt</button>
                  <button onClick={() => removeAccount(account.id)} disabled={busy[account.id]} style={{ padding: '3px 10px', fontSize: 11, borderRadius: 6, border: 'none', background: '#f87171', color: '#fff', cursor: 'pointer', fontWeight: 500 }}>
                    {busy[account.id] ? '…' : 'Ta bort'}
                  </button>
                </div>
              </div>
            )}

            {/* Expanded: sites as chips */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '14px 16px' }}>
                {!account.connected && (
                  <div style={{ fontSize: 12, color: '#50507a', marginBottom: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
                    Kontot är disconnectat — aktivera kontot för att synca data
                  </div>
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {account.sites.map(site => {
                    const isActive = site.active
                    const isBusy   = busy[site.id]
                    return (
                      <div
                        key={site.id}
                        onClick={() => account.connected && !isBusy && toggleSite(site.id, !isActive)}
                        title={site.url}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '5px 10px', borderRadius: 20,
                          border: isActive ? `1px solid ${site.color}50` : '1px solid rgba(255,255,255,0.08)',
                          background: isActive ? `${site.color}12` : 'rgba(255,255,255,0.02)',
                          cursor: account.connected && !isBusy ? 'pointer' : 'not-allowed',
                          opacity: isBusy ? 0.5 : account.connected ? 1 : 0.4,
                          transition: 'all 0.15s',
                          maxWidth: 220,
                        }}
                      >
                        <div style={{ width: 7, height: 7, borderRadius: 2, background: site.color, flexShrink: 0, opacity: isActive ? 1 : 0.4 }} />
                        <span style={{
                          fontSize: 12, color: isActive ? '#e8e8f4' : '#7070a0',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {site.displayName ?? site.url}
                        </span>
                        {isActive && (
                          <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 4l2 2 3-3" stroke={site.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
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
      <a href={connectUrl} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '12px', borderRadius: 12, border: '1px dashed rgba(52,211,153,0.3)',
        background: 'transparent', textDecoration: 'none', color: '#34d399', fontSize: 13,
        marginTop: 4, cursor: 'pointer',
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        Connect account
      </a>
    </div>
  )
}
