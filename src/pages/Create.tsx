import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Collection, Entry, CollectionField } from '../types'
import { uid } from '../utils'
import { marked } from 'marked'
import RichEditor from '../components/RichEditor'

type TemplateKey =
  | 'auto' | 'none'
  | 'demon' | 'god' | 'angel'
  | 'natureSpirit' | 'spirit'
  | 'crystal' | 'herb' | 'aura'
  | 'rune' | 'healing' | 'curse' | 'spell' | 'ritual'
  | 'note'

const TEMPLATES: Record<TemplateKey, string> = {
  auto: '',
  none: '',
  demon: `# Namn

**Rang:** 

**Aspekt/område:** 

## Sigill

![Sigill]()

## Offer/korrespondenser
- 

## Tecken på närvaro
- 

## Varningar
- 

## Beskrivning

`,
  god: `# Namn

**Pantheon:** 

**Domäner:** 

## Etymologi

## Myt/ursprung

## Ärade dagar/platser
- 

## Korrespondenser
- Färg: 
- Växt: 
- Mineral: 

## Riter/erbjudanden
- 
`,
  angel: `# Namn

**Kör/Hierarki:** 

**Titel/uppgift:** 

## Sigill/tecken

## Dygder och hjälp
- 

## Åkallan

> 

## Observationer

`,
  natureSpirit: `# Namn

**Region/Habitat:** 

**Typ:** 

## Drag
- 

## Gåvor/etikett
- 

## Risker
- 

## Mötets anteckningar

`,
  spirit: `# Namn

**Typ:** 

**Attribut:** 

## Tecken/omständigheter
- 

## Interaktioner

## Varningar
- 
`,
  crystal: `# Namn

**Hårdhet (Mohs):** 

**Färg:** 

**Korrespondenser:** 
- Element: 
- Chakra: 
- Syfte: 

## Användning
- Bärande: 
- Grid: 
- Elixir (säkerhet): 

## Rengöring/laddning
- 
`,
  herb: `# Namn

**Latinskt namn:** 

**Delar som används:** 

**Korrespondenser:** 
- Element: 
- Planet: 
- Syfte: 

## Beredning
- Te: 
- Tinktur: 
- Rökelse: 

## Säkerhet
- 
`,
  aura: `# Namn

**Färg/nyans:** 

**Tolkning:** 

## Tillstånd
- Stabilitet: 
- Rörelsemönster: 

## Rekommenderad balans
- 
`,
  rune: `# Runa

**Grafem:** ᚠ

**Ljudvärde:** 

**Betydelser:**
- 

**Omvänd:**
- 

**Bindrunor/galdrar:**
- 
`,
  healing: `# Metod/verktyg

**Syfte:** 

## Material
- 

## Steg
1. 
2. 
3. 

## Eftervård
- 

## Kontraindikationer
- 
`,
  curse: `# Förbannelse

**Mål/avsikt:** 

## Material
- 

## Konstruktion
1. 
2. 
3. 

## Säkerhet/avslut
- 

> **Etik:** dokumentera motiv och konsekvenser.`,
  spell: `# Trollformel

**Avsikt:** 

## Fönster (tid/astro)
- 

## Material
- 

## Utförande
1. 
2. 
3. 

## Tecken på effekt
- 
`,
  ritual: `# Ritual

**Syfte:** 

## Verktyg & korrespondenser
- 

## Steg
1. 
2. 
3. 

## Risker/brytning
- 
`,
  note: `# Anteckning

`
}

const TEMPLATE_META: { key: TemplateKey; label: string; icon: string }[] = [
  { key: 'auto', label: 'Auto', icon: '✨' },
  { key: 'demon', label: 'Demon', icon: '👹' },
  { key: 'god', label: 'Gud', icon: '⚡' },
  { key: 'angel', label: 'Ängel', icon: '🪽' },
  { key: 'natureSpirit', label: 'Natur', icon: '🌲' },
  { key: 'spirit', label: 'Väsen', icon: '👁️' },
  { key: 'crystal', label: 'Kristall', icon: '💎' },
  { key: 'herb', label: 'Ört', icon: '🌿' },
  { key: 'aura', label: 'Aura', icon: '🌈' },
  { key: 'rune', label: 'Runa', icon: 'ᚠ' },
  { key: 'healing', label: 'Healing', icon: '✨' },
  { key: 'curse', label: 'Förbannelse', icon: '☠️' },
  { key: 'spell', label: 'Trollformel', icon: '🪄' },
  { key: 'ritual', label: 'Ritual', icon: '🕯️' },
  { key: 'note', label: 'Anteckning', icon: '📝' },
  { key: 'none', label: 'Ingen', icon: '∅' }
]

function autoTemplateFor(collectionId: string): TemplateKey {
  switch (collectionId) {
    case 'demons':    return 'demon'
    case 'gods':      return 'god'
    case 'angels':    return 'angel'
    case 'spirits':   return 'natureSpirit'
    case 'creatures': return 'spirit'
    case 'crystals':  return 'crystal'
    case 'herbs':     return 'herb'
    case 'aura':      return 'aura'
    case 'runes':     return 'rune'
    case 'healing':   return 'healing'
    case 'curses':    return 'curse'
    case 'spells':    return 'spell'
    case 'rituals':   return 'ritual'
    case 'notes':     return 'note'
    default:          return 'none'
  }
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
  const [custom, setCustom] = useState<Record<string, any>>({})
  const [tpl, setTpl] = useState<TemplateKey>('auto')

  useEffect(() => {
    ;(async () => {
      setCollections(await getCollections())
      setEntries(await getEntries())
    })()
  }, [])

  useEffect(() => {
    const c = collections.find(c => c.id === collectionId)
    if (!c) return
    const next: Record<string, any> = {}
    c.fields.forEach(f => { next[f.key] = '' })
    setCustom(next)

    if (tpl === 'auto') {
      const key = autoTemplateFor(collectionId)
      setContent(TEMPLATES[key] || '')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionId, collections])

  function applyTemplate(k: TemplateKey) {
    setTpl(k)
    setContent(TEMPLATES[k] || '')
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const all = await getEntries()
    const now = Date.now()
    const entry: Entry = {
      id: uid(),
      collectionId,
      title: title || '(utan titel)',
      contentMD: content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      images,
      relatedIds: related,
      custom,
      createdAt: now,
      updatedAt: now
    }
    all.push(entry)
    await saveEntries(all)
    setTitle('')
    setContent('')
    setTags('')
    setImages([])
    setRelated([])
    setTpl('auto')
    const c = collections.find(c => c.id === collectionId)
    const base: Record<string, any> = {}
    c?.fields.forEach(f => { base[f.key] = '' })
    setCustom(base)
    alert('Sparat!')
  }

  // Alltid kör Markdown → HTML (marked släpper igenom rå HTML)
  const previewHTML = useMemo(() => {
    const v = content || ''
    return marked.parse(v, { async: false }) as string
  }, [content])

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
  const activeCollection = collections.find(c => c.id === collectionId)

  return (
    <div className="p-4 space-y-4 text-[16px]">
      <h1>Ny post</h1>

      {/* mallar: chip-rad */}
      <div className="sticky -top-1 z-10">
        <div className="scroll-px-4 -mx-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="inline-flex gap-2 px-4">
            {TEMPLATE_META.map(t => {
              const active = tpl === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => applyTemplate(t.key)}
                  className={`btn rounded-full min-h-[44px] ${active ? 'btn-active' : ''}`}
                  aria-pressed={active}
                  title={t.label + '-mall'}
                >
                  <span className="mr-1">{t.icon}</span>{t.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        {/* Samling */}
        <div>
          <label className="block text-sm mb-1">Samling</label>
          <select
            value={collectionId}
            onChange={e=>setCollectionId(e.target.value)}
            className="input text-[16px] min-h-[44px]"
          >
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Dynamiska fält */}
        {activeCollection && activeCollection.fields.length > 0 && (
          <section className="card p-3">
            <h2 className="mb-2">Fält – {activeCollection.name}</h2>
            <div className="grid grid-cols-1 gap-3">
              {activeCollection.fields.map(f => (
                <FieldInput
                  key={f.key}
                  field={f}
                  value={custom[f.key] ?? ''}
                  onChange={(v)=>setCustom(prev=>({...prev, [f.key]: v}))}
                />
              ))}
            </div>
          </section>
        )}

        {/* Grundmetadata */}
        <input
          value={title}
          onChange={e=>setTitle(e.target.value)}
          placeholder="Titel"
          className="input text-[16px] min-h-[44px]"
        />

        {/* RichEditor (MD ↔ visual) */}
        <RichEditor
          value={content}
          onChange={setContent}
          placeholder="Markdown eller visuellt – välj vad som känns bäst."
        />

        <input
          value={tags}
          onChange={e=>setTags(e.target.value)}
          placeholder="Taggar, separera med komma"
          className="input text-[16px] min-h-[44px]"
        />

        {/* Bilder */}
        <div>
          <label className="block text-sm mb-1">Bilder (sigill, runor, m.m.)</label>
          <input type="file" accept="image/*" multiple onChange={e=>onPickImages(e.target.files)} />
          {images.length>0 && (
            <div className="grid grid-cols-4 gap-2 mt-2">
              {images.map((src,i)=>(<img key={i} src={src} alt="" className="rounded" />))}
            </div>
          )}
        </div>

        {/* Relationer */}
        <div>
          <label className="block text-sm mb-1">Relaterade poster</label>
          <div className="max-h-40 overflow-auto border border-app rounded p-2 space-y-1">
            {candidates.map(e => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={related.includes(e.id)}
                  onChange={()=>{
                    setRelated(r => r.includes(e.id) ? r.filter(x=>x!==e.id) : [...r, e.id])
                  }}
                />
                <span>{e.title}</span>
              </label>
            ))}
            {candidates.length===0 && <div className="text-muted text-sm">Inga kandidater ännu.</div>}
          </div>
        </div>

        <button className="btn btn-primary min-h-[44px]">Spara</button>
      </form>

      {/* Förhandsvisning */}
      <div className="mt-6 space-y-3">
        <h2>Förhandsvisning</h2>

        {activeCollection && activeCollection.fields.length>0 && (
          <div className="card p-4">
            <h3 className="mb-2">Fält</h3>
            <dl className="grid grid-cols-1 gap-2">
              {activeCollection.fields.map(f => (
                <div key={f.key} className="grid grid-cols-3 gap-2">
                  <dt className="text-muted col-span-1">{f.label}</dt>
                  <dd className="col-span-2">{String(custom[f.key] ?? '')}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div
          className="card p-4 prose max-w-none"
          dangerouslySetInnerHTML={{__html: previewHTML}}
        />
      </div>
    </div>
  )
}

function FieldInput({
  field, value, onChange
}: { field: CollectionField, value: any, onChange: (v:any)=>void }) {
  const common = 'input text-[16px] min-h-[44px]'
  if (field.type === 'longtext') {
    return (
      <div>
        <label className="block text-sm mb-1">{field.label}</label>
        <textarea rows={4} className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
      </div>
    )
  }
  if (field.type === 'select') {
    return (
      <div>
        <label className="block text-sm mb-1">{field.label}</label>
        <select className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)}>
          <option value="">—</option>
          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    )
  }
  if (field.type === 'number') {
    return (
      <div>
        <label className="block text-sm mb-1">{field.label}</label>
        <input type="number" className={common} value={value ?? ''} onChange={e=>onChange(Number(e.target.value))} />
      </div>
    )
  }
  if (field.type === 'date') {
    return (
      <div>
        <label className="block text-sm mb-1">{field.label}</label>
        <input type="date" className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
      </div>
    )
  }
  return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <input className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}