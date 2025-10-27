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
    for (const e of entries) map.set(e.collectionId, (map.get(e.collectionId) || 0) + 1)
    return map
  }, [entries])

  const recentByCollection = useMemo(() => {
    const grouped: Record<string, Entry[]> = {}
    for (const e of entries) {
      if (!grouped[e.collectionId]) grouped[e.collectionId] = []
      grouped[e.collectionId].push(e)
    }
    for (const k of Object.keys(grouped)) {
      grouped[k].sort((a,b)=>b.updatedAt - a.updatedAt)
      grouped[k] = grouped[k].slice(0, 2) // visa max 2 titlar per samling
    }
    return grouped
  }, [entries])

  return (
    <div className="p-4 space-y-4">
      <h1>Bibliotek</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {collections.map(c => {
          const count = counts.get(c.id) || 0
          const recent = recentByCollection[c.id] || []
          return (
            <Link to={`/search?collection=${c.id}`} key={c.id} className="card p-4 hover:brightness-110 transition">
              <div className="flex items-start gap-3">
                <div className="text-3xl leading-none">{c.icon || '📚'}</div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-neutral-400">{count} {count === 1 ? 'post' : 'poster'}</div>
                </div>
              </div>

              {recent.length > 0 && (
                <div className="mt-3 space-y-1">
                  {recent.map(e => (
                    <div key={e.id} className="text-xs text-neutral-300 truncate">• {e.title}</div>
                  ))}
                </div>
              )}

              <div className="mt-3 text-[11px] text-amber-400">Öppna →</div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}