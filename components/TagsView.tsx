'use client'
import { useState } from 'react'
import { Tag, SiteWithData } from '@/lib/types'

const TAG_COLORS = ['#6366f1','#10b981','#ec4899','#3b82f6','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#84cc16','#f97316']

type Props = { tags: Tag[]; sites: SiteWithData[]; onRefresh: () => void }

export default function TagsView({ tags, sites, onRefresh }: Props) {
  const [creating, setCreating]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newColor, setNewColor]   = useState('#6366f1')
  const [busy, setBusy]           = useState<Record<string, boolean>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName]   = useState('')
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({})

  async function createTag() {
    if (!newName.trim()) return
    setBusy(p => ({ ...p, create: true }))
    await fetch('/api/tags', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName.trim(), color: newColor }) })
    setNewName(''); setCreating(false)
    await onRefresh()
    setBusy(p => ({ ...p, create: false }))
  }

  async function deleteTag(id: string) {
    if (!confirm('Ta bort taggen?')) return
    setBusy(p => ({ ...p, [id]: true }))
    await fetch(`/api/tags/${id}`, { method: 'DELETE' })
    await onRefresh()
    setBusy(p => ({ ...p, [id]: false }))
  }

  async function renameTag(id: string) {
    if (!editName.trim()) return
    await fetch(`/api/tags/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: editName.trim() }) })
    setEditingId(null)
    await onRefresh()
  }

  async function toggleSiteTag(tagId: string, siteId: string, hasTag: boolean) {
    setBusy(p => ({ ...p, [`${tagId}-${siteId}`]: true }))
    await fetch(`/api/tags/${tagId}/sites`, { method: hasTag ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ siteId }) })
    await onRefresh()
    setBusy(p => ({ ...p, [`${tagId}-${siteId}`]: false }))
  }

  const card: React.CSSProperties = { background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 18px', marginBottom: 8 }

  return (
    <div style={{ maxWidth: 900 }}>
      {tags.map(tag => {
        const tagSiteIds = new Set(tag.sites.map(s => s.id))
        const isExpanded = expanded[tag.id]
        return (
          <div key={tag.id} style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? 16 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 11, height: 11, borderRadius: 3, background: tag.color, flexShrink: 0 }} />
                {editingId === tag.id ? (
                  <input autoFocus value={editName} onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') renameTag(tag.id); if (e.key === 'Escape') setEditingId(null) }}
                    style={{ background: '#f8f7f5', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 7, padding: '4px 10px', color: '#111', fontSize: 13, width: 180, outline: 'none' }}
                  />
                ) : (
                  <span style={{ fontSize: 14, fontWeight: 500, color: '#111', cursor: 'pointer' }}
                    onDoubleClick={() => { setEditingId(tag.id); setEditName(tag.name) }} title="Dubbelklicka för att byta namn">
                    {tag.name}
                  </span>
                )}
                <span style={{ fontSize: 11, color: '#9ca3af', background: '#f8f7f5', padding: '2px 9px', borderRadius: 10 }}>
                  {tag.sites.length} {tag.sites.length === 1 ? 'sajt' : 'sajter'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {editingId === tag.id ? (
                  <>
                    <button onClick={() => renameTag(tag.id)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 7, border: 'none', background: '#f0fdf4', color: '#059669', cursor: 'pointer', fontWeight: 500 }}>Spara</button>
                    <button onClick={() => setEditingId(null)} style={{ padding: '4px 12px', fontSize: 12, borderRadius: 7, border: 'none', background: '#f8f7f5', color: '#6b7280', cursor: 'pointer' }}>Avbryt</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setExpanded(p => ({ ...p, [tag.id]: !p[tag.id] }))}
                      style={{ padding: '4px 12px', fontSize: 12, borderRadius: 7, border: 'none', background: '#f0eeeb', color: '#374151', cursor: 'pointer' }}>
                      {isExpanded ? 'Stäng' : 'Hantera sajter'}
                    </button>
                    <button onClick={() => { setEditingId(tag.id); setEditName(tag.name) }}
                      style={{ padding: '4px 10px', fontSize: 12, borderRadius: 7, border: 'none', background: '#f8f7f5', color: '#6b7280', cursor: 'pointer' }}>
                      Byt namn
                    </button>
                    <button onClick={() => deleteTag(tag.id)} disabled={busy[tag.id]}
                      style={{ padding: '4px 10px', fontSize: 12, borderRadius: 7, border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', opacity: busy[tag.id] ? 0.5 : 1 }}>
                      Ta bort
                    </button>
                  </>
                )}
              </div>
            </div>

            {isExpanded && (
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Välj sajter</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {sites.map(site => {
                    const has = tagSiteIds.has(site.id)
                    const key = `${tag.id}-${site.id}`
                    const short = (site.displayName ?? site.url).replace(/^https?:\/\//, '').replace(/\/$/, '').toUpperCase()
                    return (
                      <div key={site.id}
                        onClick={() => !busy[key] && toggleSiteTag(tag.id, site.id, has)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, cursor: busy[key] ? 'not-allowed' : 'pointer',
                          border: `0.5px solid ${has ? tag.color + '50' : 'rgba(0,0,0,0.08)'}`,
                          background: has ? tag.color + '10' : '#f8f7f5',
                          opacity: busy[key] ? 0.5 : 1, transition: 'all 0.15s',
                        }}>
                        <div style={{ width: 7, height: 7, borderRadius: 1, background: site.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 12, fontWeight: 500, color: has ? '#111' : '#6b7280' }}>{short}</span>
                        {has && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M1.5 4.5l2 2 4-4" stroke={tag.color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                        {site.accountEmail && (
                          <span style={{ fontSize: 10, color: '#9ca3af' }}>{site.accountEmail.split('@')[0]}</span>
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

      {tags.length === 0 && !creating && (
        <div style={{ ...card, textAlign: 'center', padding: '2.5rem', color: '#9ca3af', fontSize: 13 }}>
          Inga taggar ännu — skapa din första nedan
        </div>
      )}

      {creating ? (
        <div style={card}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 12 }}>Ny tagg</div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input autoFocus placeholder="Namn, t.ex. Betting" value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') createTag(); if (e.key === 'Escape') setCreating(false) }}
              style={{ background: '#f8f7f5', border: '0.5px solid rgba(0,0,0,0.1)', borderRadius: 8, padding: '8px 12px', color: '#111', fontSize: 13, flex: 1, minWidth: 160, outline: 'none' }}
            />
            <div style={{ display: 'flex', gap: 5 }}>
              {TAG_COLORS.map(c => (
                <div key={c} onClick={() => setNewColor(c)}
                  style={{ width: 20, height: 20, borderRadius: 5, background: c, cursor: 'pointer', outline: newColor === c ? `2px solid ${c}` : '2px solid transparent', outlineOffset: 2, transition: 'outline 0.1s' }} />
              ))}
            </div>
            <button onClick={createTag} disabled={!newName.trim() || busy.create}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#111', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', opacity: busy.create ? 0.5 : 1 }}>
              {busy.create ? '…' : 'Skapa'}
            </button>
            <button onClick={() => { setCreating(false); setNewName('') }}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: '#f0eeeb', color: '#6b7280', fontSize: 13, cursor: 'pointer' }}>
              Avbryt
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%', padding: '12px', borderRadius: 12, border: '0.5px dashed rgba(0,0,0,0.12)', background: 'transparent', color: '#374151', fontSize: 13, cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Skapa tagg
        </button>
      )}
    </div>
  )
}
