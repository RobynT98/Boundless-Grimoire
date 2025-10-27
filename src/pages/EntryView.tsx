import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Entry, Collection } from '../types'
import { marked } from 'marked'

export default function EntryView() {
  const { id } = useParams()
  const [entry, setEntry] = useState<Entry | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [all, setAll] = useState<Entry[]>([])
  const [isEdit, setIsEdit] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    async function load() {
      const list = await getEntries()
      const e = list.find(x => x.id === id) || null
      setEntry(e)
      setAll(list)
      setTitle(e?.title || '')
      setContent(e?.contentMD || '')
      setTags(e?.tags.join(', ') || '')
      setImages(e?.images ?? [])
      setCollections(await getCollections())
    }
    load()
  }, [id])

  async function save() {
    if (!entry) return
    const list = await getEntries()
    const idx = list.findIndex(x => x.id === entry.id)
    if (idx >= 0) {
      list[idx] = { ...entry, title, contentMD: content, tags: tags.split(',').map(t=>t.trim()).filter(Boolean), images, updatedAt: Date.now() }
      await saveEntries(list)
      setEntry(list[idx]); setIsEdit(false)
      alert('Uppdaterat.')
    }
  }

  const html = useMemo(
    () => marked.parse(entry?.contentMD || '', { async: false }) as string,
    [entry]
  )

  if (!entry) return <div className="p-4">Hittar inte posten.</div>

  const related = (entry.relatedIds || []).map(rid => all.find(e => e.id === rid)).filter(Boolean) as Entry[]

  return (
    <div className="p-4 space-y-4">
      {!isEdit ? (
        <>
          <div className="text-sm text-neutral-400">{collections.find(c=>c.id===entry.collectionId)?.name}</div>
          <h1>{entry.title}</h1>
          <div className="text-xs text-neutral-400">{entry.tags.join(', ')}</div>

          {entry.images?.length>0 && (
            <div className="grid grid-cols-3 gap-2">
              {entry.images.map((src,i)=>(<img key={i} src={src} alt="" className="rounded" />))}
            </div>
          )}

          <div className="card p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: html}}></div>

          {related.length>0 && (
            <section>
              <h2 className="mt-2 mb-1">Relaterat</h2>
              <div className="grid grid-cols-1 gap-2">
                {related.map(r => (
                  <Link key={r.id} to={`/entry/${r.id}`} className="block bg-neutral-900 rounded p-2 hover:bg-neutral-800">
                    <div className="text-sm text-neutral-400">{collections.find(c=>c.id===r.collectionId)?.name}</div>
                    <div className="font-semibold">{r.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="flex gap-2">
            <button className="bg-neutral-800 px-3 py-2 rounded" onClick={()=>setIsEdit(true)}>Redigera</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-neutral-900 p-2 rounded"/>
          <textarea value={content} onChange={e=>setContent(e.target.value)} rows={10} className="w-full bg-neutral-900 p-2 rounded"></textarea>
          <input value={tags} onChange={e=>setTags(e.target.value)} className="w-full bg-neutral-900 p-2 rounded"/>

          {images.length>0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((src,i)=>(<img key={i} src={src} alt="" className="rounded" />))}
            </div>
          )}

          <div className="flex gap-2">
            <button className="bg-amber-600 px-3 py-2 rounded" onClick={save}>Spara</button>
            <button className="bg-neutral-800 px-3 py-2 rounded" onClick={()=>setIsEdit(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}