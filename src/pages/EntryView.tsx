import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Entry, Collection } from '../types'
import { marked } from 'marked'

export default function EntryView() {
  const { id } = useParams()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [isEdit, setIsEdit] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')

  useEffect(() => {
    async function load() {
      const list = await getEntries()
      const e = list.find(x => x.id === id) || null
      setEntry(e)
      setTitle(e?.title || '')
      setContent(e?.contentMD || '')
      setTags(e?.tags.join(', ') || '')
      setCollections(await getCollections())
    }
    load()
  }, [id])

  async function save() {
    if (!entry) return
    const list = await getEntries()
    const idx = list.findIndex(x => x.id === entry.id)
    if (idx >= 0) {
      list[idx] = { ...entry, title, contentMD: content, tags: tags.split(',').map(t=>t.trim()).filter(Boolean), updatedAt: Date.now() }
      await saveEntries(list)
      setEntry(list[idx]); setIsEdit(false)
      alert('Uppdaterat.')
    }
  }

  const html = useMemo(() => marked.parse(entry?.contentMD || ''), [entry])

  if (!entry) return <div className="p-4">Hittar inte posten.</div>

  return (
    <div className="p-4 space-y-4">
      {!isEdit ? (
        <>
          <div className="text-sm text-neutral-400">{collections.find(c=>c.id===entry.collectionId)?.name}</div>
          <h1>{entry.title}</h1>
          <div className="text-xs text-neutral-400">{entry.tags.join(', ')}</div>
          <div className="card p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: html}}></div>
          <div className="flex gap-2">
            <button className="bg-neutral-800 px-3 py-2 rounded" onClick={()=>setIsEdit(true)}>Redigera</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-neutral-900 p-2 rounded"/>
          <textarea value={content} onChange={e=>setContent(e.target.value)} rows={10} className="w-full bg-neutral-900 p-2 rounded"></textarea>
          <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full bg-neutral-900 p-2 rounded"/>
          <div className="flex gap-2">
            <button className="bg-amber-600 px-3 py-2 rounded" onClick={save}>Spara</button>
            <button className="bg-neutral-800 px-3 py-2 rounded" onClick={()=>setIsEdit(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}