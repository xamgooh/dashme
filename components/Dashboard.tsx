'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import SiteCard from './SiteCard'
import { SiteWithData, DailyMetric } from '@/lib/types'

const MainChart = dynamic(() => import('./charts/MainChart'), { ssr: false })

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

type View = 'overview' | 'sites' | 'countries' | 'pages' | 'manage'

const PALETTE = ['#818cf8','#34d399','#f472b6','#fb923c','#38bdf8','#a78bfa','#4ade80','#fbbf24']

const s: Record<string, React.CSSProperties> = {
  wrap:      { background: '#0b0b0f', minHeight: '100vh', padding: '1.75rem 2rem', fontFamily: 'var(--font-sans, system-ui)' },
  label:     { fontSize: 11, letterSpacing: '0.12em', color: '#50507a', textTransform: 'uppercase' as const, marginBottom: 5 },
  title:     { fontSize: 24, fontWeight: 500, color: '#e8e8f4', letterSpacing: '-0.3px' },
  kpi:       { background: '#131318', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '1rem 1.25rem' },
  kpiLabel:  { fontSize: 11, color: '#50507a', marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' },
  kpiVal:    { fontSize: 32, fontWeight: 500, color: '#e8e8f4', lineHeight: 1, letterSpacing: '-0.5px' },
  card:      { background: '#131318', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '1.25rem' },
  cardTitle: { fontSize: 13, fontWeight: 500, marginBottom: '1rem', color: '#e8e8f4' },
  tabBtn:    { padding: '6px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 13, color: '#7070a0', transition: 'all 0.15s' },
}

export default function Dashboard() {
  const [view, setView]             = useState<View>('overview')
  const [sites, setSites]           = useState<SiteWithData[]>([])
  const [overviewData, setOverview] = useState<{ totals: any; daily: DailyMetric[] } | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [syncing, setSyncing]       = useState<Record<string, boolean>>({})
  const [syncingAll, setSyncingAll] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      const [sr, or] = await Promise.all([fetch('/api/sites'), fetch('/api/overview')])
      if (!sr.ok || !or.ok) throw new Error(`API ${sr.status} / ${or.status}`)
      const [sj, oj] = await Promise.all([sr.json(), or.json()])
      setSites(sj)
      setOverview(oj)
    } catch (e: any) {
      setError(e.message ?? 'Okänt fel')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  async function handleSync(id: string) {
    setSyncing(p => ({ ...p, [id]: true }))
    await fetch(`/api/sites/${id}/sync`, { method: 'POST' })
    await loadData()
    setSyncing(p => ({ ...p, [id]: false }))
  }

  async function handleSyncAll() {
    setSyncingAll(true)
    const active = sites.filter(s => s.active)
    await Promise.all(active.map(s => fetch(`/api/sites/${s.id}/sync`, { method: 'POST' })))
    await loadData()
    setSyncingAll(false)
  }

  async function handleDelete(id: string) {
    await fetch(`/api/sites/${id}`, { method: 'DELETE' })
    setSites(p => p.filter(s => s.id !== id))
  }

  async function toggleActive(id: string, active: boolean) {
    setTogglingId(id)
    await fetch(`/api/sites/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active }),
    })
    setSites(p => p.map(s => s.id === id ? { ...s, active } : s))
    setTogglingId(null)
  }

  const activeSites = sites.filter(s => s.active)
  const totals = overviewData?.totals
  const daily  = overviewData?.daily ?? []
  const trendUp = (totals?.trend ?? 0) >= 0

  // Group sites by account email for manage view
  const byAccount = sites.reduce<Record<string, SiteWithData[]>>((acc, site) => {
    const key = site.accountEmail ?? 'Unknown account'
    if (!acc[key]) acc[key] = []
    acc[key].push(site)
    return acc
  }, {})

  if (loading) return (
    <div style={{ ...s.wrap, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#50507a', fontSize: 13 }}>Laddar...</div>
    </div>
  )

  if (error) return (
    <div style={{ ...s.wrap, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
      <div style={{ color: '#f87171', fontSize: 14, fontWeight: 500 }}>Fel vid laddning</div>
      <div style={{ color: '#50507a', fontSize: 12, fontFamily: 'monospace', background: '#131318', padding: '8px 16px', borderRadius: 8 }}>{error}</div>
      <button onClick={loadData} style={{ padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#7070a0', cursor: 'pointer', fontSize: 13 }}>Försök igen</button>
    </div>
  )

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: '1.75rem' }}>
        <div>
          <div style={s.label}>iCyber AB</div>
          <div style={s.title}>Dashme</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: '#50507a', padding: '6px 12px', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>Last 28 days</span>
          {(['overview','sites','countries','pages','manage'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ ...s.tabBtn, ...(view === v ? { background: 'rgba(255,255,255,0.08)', color: '#e8e8f4', borderColor: 'rgba(255,255,255,0.18)', fontWeight: 500 } : {}) }}>
              {v === 'manage' ? 'Manage sites' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
          <button onClick={handleSyncAll} disabled={syncingAll} style={{ ...s.tabBtn, color: syncingAll ? '#50507a' : '#818cf8', borderColor: 'rgba(129,140,248,0.3)' }}>
            {syncingAll ? 'Syncing…' : 'Sync all'}
          </button>
          <a href={`/api/auth/google?secret=${process.env.NEXT_PUBLIC_DASHBOARD_SECRET ?? ''}`}
            style={{ ...s.tabBtn as any, textDecoration: 'none', display: 'inline-block', color: '#34d399', borderColor: 'rgba(52,211,153,0.3)' }}>
            + Connect site
          </a>
          <button onClick={async () => { await fetch('/api/logout', { method: 'POST' }); window.location.href = '/login' }}
            style={{ ...s.tabBtn, color: '#50507a' }}>
            Logga ut
          </button>
        </div>
      </div>

      {/* OVERVIEW */}
      {view === 'overview' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 12, marginBottom: '1.5rem' }}>
            {[
              { label: 'Total Clicks',  val: fmtN(totals?.clicks ?? 0) },
              { label: 'Impressions',   val: fmtN(totals?.impressions ?? 0) },
              { label: 'Avg. CTR',      val: `${totals?.ctr ?? 0}%` },
              { label: 'Avg. Position', val: String(totals?.position ?? 0) },
            ].map(({ label, val }) => (
              <div key={label} style={s.kpi}>
                <div style={s.kpiLabel}>{label}</div>
                <div style={s.kpiVal}>{val}</div>
                <div style={{ fontSize: 12, color: trendUp ? '#34d399' : '#f87171', marginTop: 8 }}>
                  {trendUp ? '+' : ''}{totals?.trend ?? 0}% vs prev period
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...s.card, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={s.cardTitle}>Clicks & Impressions — 28 days</div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#7070a0' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: '#818cf8', display: 'inline-block' }} />Clicks</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 3, borderRadius: 2, background: '#34d399', display: 'inline-block' }} />Impressions ÷100</span>
              </div>
            </div>
            <div style={{ position: 'relative', height: 260 }}>
              {daily.length > 0
                ? <MainChart data={daily} />
                : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#50507a', fontSize: 13 }}>Synca sajter för att se data</div>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={s.card}>
              <div style={s.cardTitle}>Top sites</div>
              {activeSites.length === 0 && <div style={{ fontSize: 13, color: '#50507a' }}>Inga aktiva sajter</div>}
              {activeSites.map(site => {
                const maxC = activeSites[0]?.totals.clicks || 1
                const pct = Math.round((site.totals.clicks / maxC) * 100)
                return (
                  <div key={site.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: '#c8c8e0', fontWeight: 500 }}>{site.displayName ?? site.url}</span>
                      <span style={{ color: '#7070a0' }}>{fmtN(site.totals.clicks)} clicks</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: 2, width: `${pct}%`, background: site.color, borderRadius: 2 }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={s.card}>
              <div style={s.cardTitle}>Top countries</div>
              {(() => {
                const merged: Record<string, number> = {}
                activeSites.flatMap(s => s.countries).forEach(c => { merged[c.country] = (merged[c.country] ?? 0) + c.clicks })
                const sorted = Object.entries(merged).sort(([,a],[,b]) => b - a).slice(0, 7)
                const maxC = sorted[0]?.[1] ?? 1
                return sorted.map(([country, clicks], i) => (
                  <div key={country} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: '#c8c8e0', fontWeight: 500 }}>{country}</span>
                      <span style={{ color: '#7070a0' }}>{fmtN(clicks)}</span>
                    </div>
                    <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
                      <div style={{ height: 2, width: `${Math.round((clicks/maxC)*100)}%`, background: PALETTE[i % PALETTE.length], borderRadius: 2 }} />
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </>
      )}

      {/* SITES */}
      {view === 'sites' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 14 }}>
          {activeSites.map(site => (
            <SiteCard key={site.id} site={site} onSync={handleSync} onDelete={handleDelete} syncing={!!syncing[site.id]} />
          ))}
          <a href={`/api/auth/google?secret=${process.env.NEXT_PUBLIC_DASHBOARD_SECRET ?? ''}`}
            style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', minHeight: 320, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="#50507a" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </div>
            <div style={{ fontSize: 13, color: '#7070a0' }}>Connect site</div>
            <div style={{ fontSize: 11, color: '#50507a' }}>via Google Search Console</div>
          </a>
        </div>
      )}

      {/* COUNTRIES */}
      {view === 'countries' && (
        <div style={s.card}>
          <div style={s.cardTitle}>Alla länder</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Country','Clicks','Impressions','CTR','Pos'].map((h, i) => (
                <th key={h} style={{ textAlign: i === 0 ? 'left' : 'right', padding: '8px 0', fontWeight: 500, color: '#50507a' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {(() => {
                const merged: Record<string, { clicks: number; impressions: number; ctr: number[]; pos: number[] }> = {}
                activeSites.flatMap(s => s.countries).forEach(c => {
                  if (!merged[c.country]) merged[c.country] = { clicks: 0, impressions: 0, ctr: [], pos: [] }
                  merged[c.country].clicks += c.clicks
                  merged[c.country].impressions += c.impressions
                  merged[c.country].ctr.push(c.ctr)
                  merged[c.country].pos.push(c.position)
                })
                return Object.entries(merged).sort(([,a],[,b]) => b.clicks - a.clicks).map(([country, v]) => (
                  <tr key={country} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 0', color: '#c8c8e0' }}>{country}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', fontWeight: 500, color: '#e8e8f4' }}>{fmtN(v.clicks)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', color: '#7070a0' }}>{fmtN(v.impressions)}</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', color: '#7070a0' }}>{(v.ctr.reduce((a,b)=>a+b,0)/v.ctr.length).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', padding: '10px 0', color: '#7070a0' }}>{(v.pos.reduce((a,b)=>a+b,0)/v.pos.length).toFixed(1)}</td>
                  </tr>
                ))
              })()}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGES */}
      {view === 'pages' && (
        <div style={s.card}>
          <div style={s.cardTitle}>Top pages — alla sajter</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              {['Page','Site','Clicks','Impr','CTR','Pos','Trend'].map((h, i) => (
                <th key={h} style={{ textAlign: i < 2 ? 'left' : 'right', padding: '8px 0', fontWeight: 500, color: '#50507a' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activeSites
                .flatMap(site => site.pages.map(p => ({ ...p, siteName: site.displayName ?? site.url, siteColor: site.color })))
                .sort((a, b) => b.clicks - a.clicks)
                .slice(0, 50)
                .map((p, i) => {
                  const short = p.pageUrl.length > 55 ? p.pageUrl.slice(0, 55) + '…' : p.pageUrl
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '9px 0', color: '#c8c8e0', fontFamily: 'var(--font-mono)', fontSize: 12 }}>{short}</td>
                      <td style={{ padding: '9px 12px 9px 0' }}>
                        <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 5, background: p.siteColor + '20', color: p.siteColor }}>{p.siteName}</span>
                      </td>
                      <td style={{ textAlign: 'right', padding: '9px 0', fontWeight: 500, color: '#e8e8f4' }}>{fmtN(p.clicks)}</td>
                      <td style={{ textAlign: 'right', padding: '9px 0', color: '#7070a0' }}>{fmtN(p.impressions)}</td>
                      <td style={{ textAlign: 'right', padding: '9px 0', color: '#7070a0' }}>{p.ctr}%</td>
                      <td style={{ textAlign: 'right', padding: '9px 0', color: '#7070a0' }}>{p.position}</td>
                      <td style={{ textAlign: 'right', padding: '9px 0', color: p.trendPct > 0 ? '#34d399' : p.trendPct < 0 ? '#f87171' : '#50507a', fontWeight: 500 }}>
                        {p.trendPct > 0 ? '+' : ''}{p.trendPct}%
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* MANAGE SITES */}
      {view === 'manage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {Object.entries(byAccount).map(([email, accountSites]) => (
            <div key={email} style={s.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(129,140,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#818cf8" strokeWidth="1.5"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#e8e8f4' }}>{email}</div>
                  <div style={{ fontSize: 11, color: '#50507a' }}>{accountSites.filter(s => s.active).length} av {accountSites.length} aktiva</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {accountSites.map(site => (
                  <div key={site.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderRadius: 8, background: site.active ? 'rgba(255,255,255,0.03)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: site.color, opacity: site.active ? 1 : 0.3 }} />
                      <div>
                        <div style={{ fontSize: 13, color: site.active ? '#e8e8f4' : '#50507a', fontWeight: 500 }}>{site.displayName ?? site.url}</div>
                        <div style={{ fontSize: 11, color: '#50507a', marginTop: 2 }}>
                          {site.totals.clicks > 0 ? `${fmtN(site.totals.clicks)} clicks · pos ${site.totals.position}` : 'Ingen data ännu'}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {site.lastSynced && (
                        <span style={{ fontSize: 11, color: '#50507a' }}>
                          Synced {new Date(site.lastSynced).toLocaleDateString('sv-SE')}
                        </span>
                      )}
                      {/* Toggle */}
                      <div
                        onClick={() => togglingId !== site.id && toggleActive(site.id, !site.active)}
                        style={{
                          width: 40, height: 22, borderRadius: 11, position: 'relative', cursor: togglingId === site.id ? 'not-allowed' : 'pointer',
                          background: site.active ? '#818cf8' : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.2s', opacity: togglingId === site.id ? 0.5 : 1,
                        }}
                      >
                        <div style={{
                          position: 'absolute', top: 3, left: site.active ? 21 : 3, width: 16, height: 16,
                          borderRadius: '50%', background: '#fff', transition: 'left 0.2s',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(byAccount).length === 0 && (
            <div style={{ ...s.card, textAlign: 'center', padding: '3rem', color: '#50507a' }}>
              Inga sajter connectedade ännu — klicka Connect site
            </div>
          )}
        </div>
      )}
    </div>
  )
}
