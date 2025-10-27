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
    getCollections().then(setCollections)
    getEntries().then(setEntries)
  }, [])
  useEffect(() => { if (preselect) setCollectionId(preselect) }, [preselect])

  const results = useMemo(() => {
    const text = q.toLowerCase()
    return entries.filter(e => {
      if (collectionId && e.collectionId !== collectionId) return false
      if (!text) return true
      return (e.title.toLowerCase().includes(text) ||
        e.contentMD.toLowerCase().includes(text) ||
        e.tags.join(' ').toLowerCase().includes(text))
    }).sort((a,b) => b.updatedAt - a.updatedAt)
  }, [q, entries, collectionId])

  return (
    <div className="p-4 space-y-3">
      <h1>Sök</h1>
      <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Sök titel, text, taggar..." className="w-full bg-neutral-900 p-2 rounded" />
      <select value={collectionId} onChange={e=>setCollectionId(e.target.value)} className="w-full bg-neutral-900 p-2 rounded">
        <option value="">Alla samlingar</option>
        {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>

      <div className="grid grid-cols-1 gap-3">
        {results.map(e => (
          <Link to={`/entry/${e.id}`} key={e.id} className="card p-4">
            <div className="text-sm text-neutral-400">{collections.find(c=>c.id===e.collectionId)?.name}</div>
            <h2>{e.title}</h2>
            <div className="text-xs text-neutral-400">{e.tags.join(', ')}</div>
          </Link>
        ))}
        {results.length===0 && <div className="text-neutral-400">Inga träffar.</div>}
      </div>
    </div>
  )
}