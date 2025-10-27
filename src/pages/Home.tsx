import { useEffect, useState } from 'react'
import { getEntries } from '../db'
import type { Entry } from '../types'
import { Link } from 'react-router-dom'

export default function Home() {
  const [recent, setRecent] = useState<Entry[]>([])
  useEffect(() => {
    getEntries().then(list => {
      const sorted = [...list].sort((a,b) => b.updatedAt - a.updatedAt).slice(0,6)
      setRecent(sorted)
    })
  }, [])
  return (
    <div className="p-4 space-y-4">
      <h1>Boundless Grimoire</h1>
      <p className="text-neutral-300">Ditt modulära, offline-först uppslagsverk i grimoire-stil.</p>
      <section className="grid grid-cols-1 gap-3">
        {recent.map(e => (
          <Link key={e.id} to={`/entry/${e.id}`} className="card p-4">
            <h2 className="mb-1">{e.title}</h2>
            <p className="text-sm text-neutral-300 line-clamp-2">{e.contentMD?.slice(0,180)}</p>
          </Link>
        ))}
        {recent.length === 0 && <div className="text-neutral-400">Inga poster ännu. Skapa din första via <b>Skapa</b>.</div>}
      </section>
    </div>
  )
}