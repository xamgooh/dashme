'use client'
import { useState } from 'react'
import SparkLine from './charts/SparkLine'
import { SiteWithData } from '@/lib/types'

function fmtN(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1_000) return Math.round(n / 1_000) + 'K'
  return String(n)
}

function posBadge(pos: number): React.CSSProperties {
  if (pos <= 3)  return { background: '#f0fdf4', color: '#166534' }
  if (pos <= 10) return { background: '#eff6ff', color: '#1e40af' }
  return { background: '#f9fafb', color: '#6b7280' }
}

type Props = { site: SiteWithData; onSync: (id: string) => void; onDelete: (id: string) => void; syncing: boolean }

export default function SiteCard({ site, onSync, onDelete, syncing }: Props) {
  const [expanded, setExpanded] = useState(false)
  const { totals } = site
  const tUp = totals.trend >= 0
  const maxP = site.pages[0]?.clicks ?? 1
  const trending = site.pages.filter(p => p.trendPct > 10).sort((a, b) => b.trendPct - a.trendPct).slice(0, 5)

  return (
    <div
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.16)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)')}
    >
<div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16, color: '#111', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.02em' }}>
              {(site.displayName ?? site.url).replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: site.lastSynced ? '#10b981' : '#d1d5db', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#9ca3af' }}>
                {site.lastSynced ? `Synced ${new Date(site.lastSynced).toLocaleDateString('sv-SE')}` : 'Not synced'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: tUp ? '#059669' : '#dc2626' }}>
              {tUp ? '+' : ''}{totals.trend}%
            </span>
            <button
              onClick={() => onSync(site.id)}
              disabled={syncing}
              style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.08)', background: 'transparent', color: syncing ? '#d1d5db' : '#9ca3af', cursor: syncing ? 'not-allowed' : 'pointer' }}
            >
              {syncing ? '…' : 'Sync'}
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 36, fontWeight: 500, color: '#111', letterSpacing: '-0.8px', lineHeight: 1 }}>
            {fmtN(totals.clicks)}
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>clicks · 28 days</div>
        </div>
      </div>

      <div style={{ padding: '10px 12px 0' }}>
        {site.metrics.length > 0
          ? <SparkLine data={site.metrics} color={site.color} height={60} />
          : <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 12 }}>Sync för data</div>
        }
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '12px 18px' }}>
        {[
          { label: 'Impressions', val: fmtN(totals.impressions) },
          { label: 'CTR',         val: `${totals.ctr}%` },
          { label: 'Position',    val: String(totals.position) },
        ].map(({ label, val }) => (
          <div key={label} style={{ background: '#f8f7f5', borderRadius: 8, padding: '8px 10px' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 500, color: '#111' }}>{val}</div>
          </div>
        ))}
      </div>

      {site.tags.length > 0 && (
        <div style={{ padding: '0 18px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {site.tags.map(t => (
            <span key={t.id} style={{ fontSize: 11, padding: '2px 9px', borderRadius: 10, background: t.color + '12', color: t.color, border: `0.5px solid ${t.color}40` }}>{t.name}</span>
          ))}
        </div>
      )}

      <div style={{ padding: '0 18px 14px', marginTop: 'auto' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, width: '100%', padding: '7px', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 8, background: 'transparent', cursor: 'pointer', fontSize: 12, color: '#9ca3af', transition: 'background 0.15s' }}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            <path d="M2 4l3.5 3.5L9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? 'Less' : 'More data'}
        </button>
      </div>

      {expanded && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '14px 18px 16px' }}>

          {trending.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 7 }}>Trending pages</div>
              {trending.map(p => (
                <div key={p.pageUrl} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#059669', minWidth: 38, flexShrink: 0 }}>+{Math.round(p.trendPct)}%</span>
                  <span style={{ fontSize: 11, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {p.pageUrl.length > 36 ? p.pageUrl.slice(0, 36) + '…' : p.pageUrl}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtN(p.clicks)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 7 }}>Keywords</div>
            {site.keywords.slice(0, 7).map(k => (
              <div key={k.keyword} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 11, padding: '1px 5px', borderRadius: 4, fontWeight: 500, flexShrink: 0, ...posBadge(k.position) }}>#{Math.round(k.position)}</span>
                <span style={{ fontSize: 12, color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{k.keyword}</span>
                <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{fmtN(k.clicks)}</span>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 7 }}>Top pages</div>
            {site.pages.slice(0, 5).map(p => {
              const pct = Math.round((p.clicks / maxP) * 100)
              return (
                <div key={p.pageUrl} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
                    <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {p.pageUrl.length > 36 ? p.pageUrl.slice(0, 36) + '…' : p.pageUrl}
                    </span>
                    <span style={{ color: '#374151', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{fmtN(p.clicks)}</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
                    <div style={{ height: 2, width: `${pct}%`, background: site.color, borderRadius: 2, opacity: 0.5 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { if (confirm(`Ta bort ${(site.displayName ?? site.url).replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()}?`)) onDelete(site.id) }}
            style={{ marginTop: 14, fontSize: 11, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Ta bort sajt
          </button>
        </div>
      )}
    </div>
  )
}
