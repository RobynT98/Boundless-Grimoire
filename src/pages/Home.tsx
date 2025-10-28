import { useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link } from 'react-router-dom'
import { mdToPlain } from '../lib/md'

export default function Home() {
  const [recent, setRecent] = useState<Entry[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    ;(async () => {
      setCollections(await getCollections())
      const list = await getEntries()
      const sorted = [...list].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 8)
      setRecent(sorted)
    })()
  }, [])

  const colMap = useMemo(() => {
    const map = new Map<string, Collection>()
    for (const c of collections) map.set(c.id, c)
    return map
  }, [collections])

  return (
    <div className="p-4 space-y-5 text-[16px]">
      <header className="space-y-1">
        <h1>Boundless Grimoire</h1>
        <p className="text-muted">Ditt modulära, offline-först uppslagsverk i grimoire-stil.</p>
      </header>

      <nav className="flex flex-wrap gap-2">
        <Link to="/create" className="btn btn-primary min-h-[44px]">+ Ny post</Link>
        <Link to="/library" className="btn btn-secondary min-h-[44px]">Bibliotek</Link>
        <Link to="/search" className="btn btn-secondary min-h-[44px]">Sök</Link>
      </nav>

      <section className="section space-y-3">
        <h2>Senast uppdaterade</h2>

        {recent.length === 0 ? (
          <div className="text-muted">
            Inga poster ännu. Skapa din första via <b>Skapa</b>.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recent.map(e => {
              const col = colMap.get(e.collectionId)
              const snippet = mdToPlain(e.contentMD || '').slice(0, 160)

              return (
                <Link
                  key={e.id}
                  to={`/entry/${e.id}`}
                  className="card p-4 hover:brightness-110 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0 select-none">{col?.icon || '📄'}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{e.title}</h3>
                        <span
                          className="text-[11px] px-2 py-0.5 rounded border-app"
                          style={{
                            background: 'var(--panel)',
                            borderWidth: 1,
                            color: 'var(--text)'
                          }}
                        >
                          {col?.name || 'Okänd'}
                        </span>
                      </div>
                      {snippet && (
                        <p className="text-sm text-main mt-1 line-clamp-2">{snippet}</p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}