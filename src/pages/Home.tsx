// src/pages/Home.tsx
import { useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link } from 'react-router-dom'
import { marked } from 'marked'

// Hjälp: säkert MD/HTML → plain text (för snippets)
function mdToPlain(mdOrHtml: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)
  if (typeof window === 'undefined') {
    // fallback utan DOM
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = html
  return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim()
}

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
      const sorted = [...list].sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 8)
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

      {/* Snabbgenvägar */}
      <nav className="flex flex-wrap gap-2">
        <Link to="/create" className="btn btn-primary min-h-[44px]">+ Ny post</Link>
        <Link to="/library" className="btn btn-secondary min-h-[44px]">Bibliotek</Link>
        <Link to="/search" className="btn btn-secondary min-h-[44px]">Sök</Link>
      </nav>

      {/* Senast uppdaterade */}
      <section className="section space-y-3">
        <h2>Senast uppdaterade</h2>

        {recent.length === 0 ? (
          <div className="text-muted">Inga poster ännu. Skapa din första via <b>Skapa</b>.</div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {recent.map(e => {
              const col = colMap.get(e.collectionId)
              const subtitle = entrySubtitle(e)
              const snippet = mdToPlain(e.contentMD).slice(0, 160)

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
                          style={{ background: 'var(--panel)', borderWidth: 1, color: 'var(--text)' }}
                        >
                          {col?.name || 'Okänd'}
                        </span>
                      </div>
                      {subtitle && (
                        <div className="text-xs text-muted mt-0.5 truncate">{subtitle}</div>
                      )}
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