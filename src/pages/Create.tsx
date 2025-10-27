import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Collection, Entry } from '../types'
import { uid } from '../utils'
import { marked } from 'marked'

export default function Create() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [collectionId, setCollectionId] = useState('notes')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string>('')

  useEffect(() => { getCollections().then(setCollections)}, [])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const all = await getEntries()
    const now = Date.now()
    const entry: Entry = {
      id: uid(), collectionId, title: title || '(utan titel)',
      contentMD: content, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      images: [], custom: {}, createdAt: now, updatedAt: now
    }
    all.push(entry)
    await saveEntries(all)
    setTitle(''); setContent(''); setTags('')
    alert('Sparat!')
  }

  // Marked v12 kan vara async. Vi tvingar synkront läge och kastar till string.
  const previewHTML = useMemo(
    () => marked.parse(content || '', { async: false }) as string,
    [content]
  )

  return (
    <div className="p-4 space-y-4">
      <h1>Ny post</h1>
      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">Samling</label>
        <select value={collectionId} onChange={e=>setCollectionId(e.target.value)} className="w-full bg-neutral-900 p-2 rounded">
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel" className="w-full bg-neutral-900 p-2 rounded" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Markdown-innehåll (långa anteckningar välkomna)" rows={10} className="w-full bg-neutral-900 p-2 rounded"></textarea>
        <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Taggar, separera med komma" className="w-full bg-neutral-900 p-2 rounded" />
        <button className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">Spara</button>
      </form>
      <div className="mt-6">
        <h2>Förhandsvisning</h2>
        <div className="card p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: previewHTML}}></div>
      </div>
    </div>
  )
}