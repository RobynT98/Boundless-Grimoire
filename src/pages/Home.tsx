import { useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link } from 'react-router-dom'

// Plocka fram “viktigaste” fältet per samling för att visa som undertext
function entrySubtitle(e: Entry): string {
  const c = e.collectionId
  const v = e.custom || {}
  switch (c) {
    case 'demons':    return [v.rank, v.aspect].filter(Boolean).join(' • ')
    case 'gods':      return [v.pantheon, v.domains].filter(Boolean).join(' • ')
    case 'angels':    return [v.choir, v.office].filter(Boolean).join(' • ')
    case 'spirits':   return [v.region, v.type].filter(Boolean).join(' • ')
    case 'creatures': return [v.habitat, v.taxonomy].filter(Boolean).join(' • ')
    case 'crystals':  return [v.color, v.chakra].filter(Boolean).join(' • ')
    case 'herbs':     return [v.latin, v.planet].filter(Boolean).join(' • ')
    case 'aura':      return [v.color, v.state].filter(Boolean).join(' • ')
    case 'runes':     return [v.glyph, v.phoneme].filter(Boolean).join(' • ')
    case 'healing':   return [v.method, v.intent].filter(Boolean).join(' • ')
    case 'curses':    return [v.target].filter(Boolean).join(' • ')
    case 'spells':    return [v.intent, v.timing].filter(Boolean).join(' • ')
    case 'rituals':   return [v.purpose].filter(Boolean).join(' • ')
    default:          return ''
  }
}

export default function Home() {
  const [recent, setRecent] = useState<Entry[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  useEffect(() => {
    ;(async () => {
      setCollections(await getCollections())
      const list = await getEntries()
      const sorted = list.sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 8)
      setRecent(sorted)
    })()
  }, [])

  const colMap = useMemo(() => {
    const map = new Map<string, Collection>()
    for (const c of collections) map.set(c.id, c)
    return map
  }, [collections])

  return (
    <div className="p-4 space-y-5">
      <header>
        <h1>Boundless Grimoire</h1>
        <p className="text-neutral-300">
          Ditt modulära, offline-först uppslagsverk i grimoire-stil.
        </p>
      </header>

      {/* Snabbgenvägar */}
      <nav className="flex gap-2">
        <Link to="/create" className="px-3 py-2 rounded bg-amber-600 hover:bg-amber-700">+ Ny post</Link>
        <Link to="/library" className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700">Bibliotek</Link>
        <Link to="/search" className="px-3 py-2 rounded bg-neutral-800 hover:bg-neutral-700">Sök</Link>
      </nav>

      {/* Senast uppdaterade */}
      <section className="space-y-2">
        <h2>Senast uppdaterade</h2>
        {recent.length === 0 && (
          <div className="text-neutral-400">
            Inga poster ännu. Skapa din första via <b>Skapa</b>.
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
          {recent.map(e => {
            const col = colMap.get(e.collectionId)
            const subtitle = entrySubtitle(e)
            const snippet = (e.contentMD || '').slice(0, 160)
            return (
              <Link key={e.id} to={`/entry/${e.id}`} className="card p-4 hover:brightness-110 transition">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{col?.icon || '📄'}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">{e.title}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                        {col?.name || 'Okänd'}
                      </span>
                    </div>
                    {subtitle && (
                      <div className="text-xs text-neutral-400 mt-0.5 truncate">{subtitle}</div>
                    )}
                    <p className="text-sm text-neutral-300 mt-1 line-clamp-2">{snippet}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}