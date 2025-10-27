import { useEffect, useState } from 'react'
import { getCollections, getEntries } from '../db'
import type { Collection, Entry } from '../types'
import { Link } from 'react-router-dom'

export default function Library() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<Entry[]>([])

  useEffect(() => {
    getCollections().then(setCollections)
    getEntries().then(setEntries)
  }, [])

  return (
    <div className="p-4 space-y-4">
      <h1>Bibliotek</h1>
      <div className="grid grid-cols-2 gap-3">
        {collections.map(c => (
          <Link to={`/search?collection=${c.id}`} key={c.id} className="card p-4">
            <div className="text-2xl">{c.icon}</div>
            <div className="font-semibold mt-1">{c.name}</div>
            <div className="text-xs text-neutral-400">{entries.filter(e => e.collectionId===c.id).length} poster</div>
          </Link>
        ))}
      </div>
    </div>
  )
}