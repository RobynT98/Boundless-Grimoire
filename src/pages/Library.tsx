import { useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link } from 'react-router-dom'

export default function Library() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    ;(async () => {
      setCollections(await getCollections())
      setEntries(await getEntries())
    })()
  }, [])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const e of entries) {
      map.set(e.collectionId, (map.get(e.collectionId) || 0) + 1)
    }
    return map
  }, [entries])

  const recentByCollection = useMemo(() => {
    const grouped: Record<string, Entry[]> = {}
    for (const e of entries) {
      (grouped[e.collectionId] ||= []).push(e)
    }
    for (const k of Object.keys(grouped)) {
      grouped[k] = grouped[k].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 2)
    }
    return grouped
  }, [entries])

  if (collections.length === 0) {
    return (
      <div className="p-4 space-y-3 text-[16px]">
        <h1>Bibliotek</h1>
        <p className="text-muted">Laddar…</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 text-[16px]">
      <h1>Bibliotek</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {collections.map(c => {
          const count = counts.get(c.id) || 0
          const recent = recentByCollection[c.id] || []
          const label = count === 1 ? 'post' : 'poster'

          return (
            <Link
              to={`/search?collection=${c.id}`}
              key={c.id}
              className="card p-4 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-offset-0"
              aria-label={`${c.name}, ${count} ${label}. Öppna`}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl leading-none select-none">{c.icon || '📚'}</div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted">{count} {label}</div>
                </div>
              </div>

              {recent.length > 0 && (
                <div className="mt-3 space-y-1">
                  {recent.map(e => (
                    <div key={e.id} className="text-sm text-main truncate">• {e.title}</div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-[12px]" style={{ color: 'var(--accent)' }}>
                Öppna →
              </div>
            </Link>
          )
        })}
      </div>

      {entries.length === 0 && (
        <p className="text-muted">
          Inga poster ännu. Skapa din första via <b>Skapa</b>.
        </p>
      )}
    </div>
  )
}