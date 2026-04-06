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
  const trending = site.pages.filter(p => p.trendPct > 10).sort((a, b) => b.trendPct - a.trendPct).slice(0, 4)

  return (
    <div
      style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, overflow: 'hidden', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column' }}
      onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.16)')}
      onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(0,0,0,0.08)')}
    >
      {/* Color top line */}
      <div style={{ height: 3, background: site.color }} />

      {/* Main content */}
      <div style={{ padding: '12px 14px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{ fontSize: 11, color: site.color, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
            {site.displayName ?? site.url}
          </div>
          <button
            onClick={() => onSync(site.id)}
            disabled={syncing}
            style={{ fontSize: 10, padding: '1px 6px', borderRadius: 5, border: '0.5px solid rgba(0,0,0,0.1)', background: 'transparent', color: syncing ? '#d1d5db' : '#9ca3af', cursor: syncing ? 'not-allowed' : 'pointer', flexShrink: 0, marginLeft: 6 }}
          >
            {syncing ? '…' : 'Sync'}
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 26, fontWeight: 500, color: '#111', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {fmtN(totals.clicks)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: tUp ? '#059669' : '#dc2626' }}>
            {tUp ? '+' : ''}{totals.trend}%
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>clicks · 28 days</div>
      </div>

      {/* Sparkline */}
      <div style={{ padding: '6px 8px 0' }}>
        {site.metrics.length > 0
          ? <SparkLine data={site.metrics} color={site.color} height={44} />
          : <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d1d5db', fontSize: 10 }}>Sync för data</div>
        }
      </div>

      {/* Stats row */}
      <div style={{ padding: '8px 14px', display: 'flex', justifyContent: 'space-between' }}>
        {[{ label: 'Impr', val: fmtN(totals.impressions) }, { label: 'CTR', val: `${totals.ctr}%` }, { label: 'Pos', val: String(totals.position) }].map(({ label, val }) => (
          <div key={label}>
            <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Tags */}
      {site.tags.length > 0 && (
        <div style={{ padding: '0 14px 8px', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {site.tags.map(t => (
            <span key={t.id} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: t.color + '12', color: t.color, border: `0.5px solid ${t.color}40` }}>{t.name}</span>
          ))}
        </div>
      )}

      {/* More data button */}
      <div style={{ padding: '0 14px 12px', marginTop: 'auto' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%', padding: '5px', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 7, background: 'transparent', cursor: 'pointer', fontSize: 11, color: '#9ca3af', transition: 'all 0.15s' }}
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}>
            <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {expanded ? 'Less' : 'More data'}
        </button>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.06)', padding: '12px 14px 14px' }}>

          {/* Trending pages */}
          {trending.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 6 }}>Trending pages</div>
              {trending.map(p => (
                <div key={p.pageUrl} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#059669', minWidth: 36, flexShrink: 0 }}>+{Math.round(p.trendPct)}%</span>
                  <span style={{ fontSize: 10, color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-mono)' }}>
                    {p.pageUrl.length > 32 ? p.pageUrl.slice(0, 32) + '…' : p.pageUrl}
                  </span>
                  <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{fmtN(p.clicks)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Keywords */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 6 }}>Keywords</div>
            {site.keywords.slice(0, 6).map(k => (
              <div key={k.keyword} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', borderBottom: '0.5px solid rgba(0,0,0,0.05)' }}>
                <span style={{ fontSize: 10, padding: '1px 5px', borderRadius: 4, fontWeight: 500, flexShrink: 0, ...posBadge(k.position) }}>#{Math.round(k.position)}</span>
                <span style={{ fontSize: 11, color: '#374151', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.keyword}</span>
                <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{fmtN(k.clicks)}</span>
              </div>
            ))}
          </div>

          {/* Top pages */}
          <div>
            <div style={{ fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', fontWeight: 500, marginBottom: 6 }}>Top pages</div>
            {site.pages.slice(0, 5).map(p => {
              const pct = Math.round((p.clicks / maxP) * 100)
              return (
                <div key={p.pageUrl} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 3 }}>
                    <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {p.pageUrl.length > 32 ? p.pageUrl.slice(0, 32) + '…' : p.pageUrl}
                    </span>
                    <span style={{ color: '#374151', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{fmtN(p.clicks)}</span>
                  </div>
                  <div style={{ height: 2, background: 'rgba(0,0,0,0.06)', borderRadius: 2 }}>
                    <div style={{ height: 2, width: `${pct}%`, background: site.color, borderRadius: 2, opacity: 0.6 }} />
                  </div>
                </div>
              )
            })}
          </div>

          <button
            onClick={() => { if (confirm(`Ta bort ${site.displayName ?? site.url}?`)) onDelete(site.id) }}
            style={{ marginTop: 12, fontSize: 10, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Ta bort sajt
          </button>
        </div>
      )}
    </div>
  )
}
