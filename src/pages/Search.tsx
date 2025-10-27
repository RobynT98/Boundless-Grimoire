import { useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link, useSearchParams } from 'react-router-dom'

export default function Search() {
  const [q, setQ] = useState('')
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [params] = useSearchParams()
  const preselect = params.get('collection') || ''
  const [collectionId, setCollectionId] = useState(preselect)

  useEffect(() => {
    ;(async () => {
      setCollections(await getCollections())
      setEntries(await getEntries())
    })()
  }, [])

  useEffect(() => {
    if (preselect) setCollectionId(preselect)
  }, [preselect])

  const results = useMemo(() => {
    const text = q.trim().toLowerCase()
    const list = entries.filter(e => {
      if (collectionId && e.collectionId !== collectionId) return false
      if (!text) return true
      const hay = `${e.title}\n${e.contentMD}\n${(e.tags || []).join(' ')}`.toLowerCase()
      return hay.includes(text)
    })
    return list.sort((a, b) => b.updatedAt - a.updatedAt)
  }, [q, entries, collectionId])

  const colName = (id: string) => collections.find(c => c.id === id)?.name || 'Okänd'

  return (
    <div className="p-4 space-y-3 text-[16px]">
      <h1>Sök</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Sök titel, text, taggar..."
          className="input text-[16px]"
          aria-label="Sökfält"
        />

        <select
          value={collectionId}
          onChange={e => setCollectionId(e.target.value)}
          className="input text-[16px]"
          aria-label="Filtrera efter samling"
        >
          <option value="">Alla samlingar</option>
          {collections.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="text-muted text-sm">
        {results.length} {results.length === 1 ? 'träff' : 'träffar'}
        {collectionId ? ` i ${colName(collectionId)}` : ''}
        {q ? ` för “${q}”` : ''}
      </div>

      <div className="grid grid-cols-1 gap-3">
        {results.map(e => {
          const snippet = (e.contentMD || '').replace(/\s+/g, ' ').slice(0, 140)
          return (
            <Link
              to={`/entry/${e.id}`}
              key={e.id}
              className="card p-4 hover:brightness-110 transition focus:outline-none focus:ring-2 focus:ring-offset-0"
              aria-label={`${e.title} – öppna posten`}
            >
              <div className="text-xs text-muted">{colName(e.collectionId)}</div>
              <h2 className="font-semibold">{e.title}</h2>

              {e.tags?.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {e.tags.slice(0, 5).map(t => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded text-[12px] border-app border text-main"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {snippet && (
                <p className="mt-2 text-sm text-muted">
                  {snippet}{e.contentMD.length > 140 ? '…' : ''}
                </p>
              )}
            </Link>
          )
        })}

        {results.length === 0 && (
          <div className="text-muted">Inga träffar.</div>
        )}
      </div>
    </div>
  )
}