import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Collection, Entry } from '../types'
import { uid } from '../utils'
import { marked } from 'marked'

type TemplateKey = 'demon' | 'rune' | 'ritual' | 'none'

const TEMPLATES: Record<TemplateKey,string> = {
  demon: `# Namn\n\n**Rang:** \n\n**Aspekt:** \n\n## Varningar\n- \n\n## Beskrivning\n\n`,
  rune: `# Rune\n\n**Ljudvärde:** \n\n## Betydelse\n- \n\n## Användning\n- \n`,
  ritual: `# Ritual\n\n**Syfte:** \n\n## Material\n- \n\n## Steg\n1. \n2. \n3. \n\n## Risker\n- \n`,
  none: ''
}

export default function Create() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [collectionId, setCollectionId] = useState('notes')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string>('')
  const [images, setImages] = useState<string[]>([])
  const [related, setRelated] = useState<string[]>([])
  const [tpl, setTpl] = useState<TemplateKey>('none')

  useEffect(() => {
    getCollections().then(setCollections)
    getEntries().then(setEntries)
  }, [])

  function applyTemplate(k: TemplateKey) {
    setTpl(k)
    if (content.trim()) return
    setContent(TEMPLATES[k])
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const all = await getEntries()
    const now = Date.now()
    const entry: Entry = {
      id: uid(), collectionId, title: title || '(utan titel)',
      contentMD: content, tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      images, relatedIds: related, custom: {}, createdAt: now, updatedAt: now
    }
    all.push(entry)
    await saveEntries(all)
    setTitle(''); setContent(''); setTags(''); setImages([]); setRelated([])
    alert('Sparat!')
  }

  const previewHTML = useMemo(
    () => marked.parse(content || '', { async: false }) as string,
    [content]
  )

  async function onPickImages(files: FileList | null) {
    if (!files) return
    const promises = Array.from(files).map(
      f => new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(f)
      })
    )
    const dataUrls = await Promise.all(promises)
    setImages(prev => [...prev, ...dataUrls])
  }

  const candidates = entries.filter(e => e.collectionId === collectionId || collectionId === '')

  return (
    <div className="p-4 space-y-4">
      <h1>Ny post</h1>

      <div className="flex gap-2 text-sm">
        <button className={"px-3 py-1 rounded "+(tpl==='demon'?'bg-amber-600':'bg-neutral-800')} onClick={()=>applyTemplate('demon')}>Demon-mall</button>
        <button className={"px-3 py-1 rounded "+(tpl==='rune'?'bg-amber-600':'bg-neutral-800')} onClick={()=>applyTemplate('rune')}>Run-mall</button>
        <button className={"px-3 py-1 rounded "+(tpl==='ritual'?'bg-amber-600':'bg-neutral-800')} onClick={()=>applyTemplate('ritual')}>Ritual-mall</button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        <label className="block text-sm">Samling</label>
        <select value={collectionId} onChange={e=>setCollectionId(e.target.value)} className="w-full bg-neutral-900 p-2 rounded">
          {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel" className="w-full bg-neutral-900 p-2 rounded" />

        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Markdown-innehåll (långa anteckningar välkomna)" rows={10} className="w-full bg-neutral-900 p-2 rounded"></textarea>

        <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Taggar, separera med komma" className="w-full bg-neutral-900 p-2 rounded" />

        <div>
          <label className="block text-sm mb-1">Bilder (sigill, runor, m.m.)</label>
          <input type="file" accept="image/*" multiple onChange={e=>onPickImages(e.target.files)} />
          {images.length>0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {images.map((src,i)=>(<img key={i} src={src} alt="" className="rounded" />))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1">Relaterade poster</label>
          <div className="max-h-40 overflow-auto border border-neutral-800 rounded p-2 space-y-1">
            {candidates.map(e => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={related.includes(e.id)} onChange={()=>{
                  setRelated(r => r.includes(e.id) ? r.filter(x=>x!==e.id) : [...r, e.id])
                }} />
                <span>{e.title}</span>
              </label>
            ))}
            {candidates.length===0 && <div className="text-neutral-500 text-sm">Inga kandidater ännu.</div>}
          </div>
        </div>

        <button className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">Spara</button>
      </form>

      <div className="mt-6">
        <h2>Förhandsvisning</h2>
        <div className="card p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: previewHTML}}></div>
      </div>
    </div>
  )
}