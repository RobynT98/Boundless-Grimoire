import { FormEvent, useEffect, useMemo, useState } from 'react'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Collection, Entry, CollectionField } from '../types'
import { uid } from '../utils'
import { marked } from 'marked'

// ---- Mall-nycklar (en per kategori + auto/none)
type TemplateKey =
  | 'auto' | 'none'
  | 'demon' | 'god' | 'angel'
  | 'natureSpirit' | 'spirit'
  | 'crystal' | 'herb' | 'aura'
  | 'rune' | 'healing' | 'curse' | 'spell' | 'ritual'
  | 'note'

// ---- Malltext per nyckel (Markdown)
const TEMPLATES: Record<TemplateKey, string> = {
  auto: '',
  none: '',
  demon: `# Namn\n\n**Rang:** \n\n**Aspekt/område:** \n\n## Sigill\n\n![Sigill]()\n\n## Offer/korrespondenser\n- \n\n## Tecken på närvaro\n- \n\n## Varningar\n- \n\n## Beskrivning\n\n`,
  god: `# Namn\n\n**Pantheon:** \n\n**Domäner:** \n\n## Etymologi\n\n## Myt/ursprung\n\n## Ärade dagar/platser\n- \n\n## Korrespondenser\n- Färg: \n- Växt: \n- Mineral: \n\n## Riter/erbjudanden\n- \n`,
  angel: `# Namn\n\n**Kör/Hierarki:** \n\n**Titel/uppgift:** \n\n## Sigill/tecken\n\n## Dygder och hjälp\n- \n\n## Åkallan\n\n> \n\n## Observationer\n\n`,
  natureSpirit: `# Namn\n\n**Region/Habitat:** \n\n**Typ:** \n\n## Drag\n- \n\n## Gåvor/etikett\n- \n\n## Risker\n- \n\n## Mötets anteckningar\n\n`,
  spirit: `# Namn\n\n**Typ:** \n\n**Attribut:** \n\n## Tecken/omständigheter\n- \n\n## Interaktioner\n\n## Varningar\n- \n`,
  crystal: `# Namn\n\n**Hårdhet (Mohs):** \n\n**Färg:** \n\n**Korrespondenser:** \n- Element: \n- Chakra: \n- Syfte: \n\n## Användning\n- Bärande: \n- Grid: \n- Elixir (säkerhet): \n\n## Rengöring/laddning\n- \n`,
  herb: `# Namn\n\n**Latinskt namn:** \n\n**Delar som används:** \n\n**Korrespondenser:** \n- Element: \n- Planet: \n- Syfte: \n\n## Beredning\n- Te: \n- Tinktur: \n- Rökelse: \n\n## Säkerhet\n- \n`,
  aura: `# Namn\n\n**Färg/nyans:** \n\n**Tolkning:** \n\n## Tillstånd\n- Stabilitet: \n- Rörelsemönster: \n\n## Rekommenderad balans\n- \n`,
  rune: `# Runa\n\n**Grafem:** ᚠ\n\n**Ljudvärde:** \n\n**Betydelser:**\n- \n\n**Omvänd:**\n- \n\n**Bindrunor/galdrar:**\n- \n`,
  healing: `# Metod/verktyg\n\n**Syfte:** \n\n## Material\n- \n\n## Steg\n1. \n2. \n3. \n\n## Eftervård\n- \n\n## Kontraindikationer\n- \n`,
  curse: `# Förbannelse\n\n**Mål/avsikt:** \n\n## Material\n- \n\n## Konstruktion\n1. \n2. \n3. \n\n## Säkerhet/avslut\n- \n\n> **Etik:** dokumentera motiv och konsekvenser.`,
  spell: `# Trollformel\n\n**Avsikt:** \n\n## Fönster (tid/astro)\n- \n\n## Material\n- \n\n## Utförande\n1. \n2. \n3. \n\n## Tecken på effekt\n- \n`,
  ritual: `# Ritual\n\n**Syfte:** \n\n## Verktyg & korrespondenser\n- \n\n## Steg\n1. \n2. \n3. \n\n## Risker/brytning\n- \n`,
  note: `# Anteckning\n\n`
}

// Chip-metadata för UI
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

// Mappa samlings-id → lämplig mallnyckel (auto-läge)
function autoTemplateFor(collectionId: string): TemplateKey {
  switch (collectionId) {
    case 'demons': return 'demon'
    case 'gods': return 'god'
    case 'angels': return 'angel'
    case 'nature': return 'natureSpirit'
    case 'beings': return 'spirit'
    case 'crystals': return 'crystal'
    case 'herbs': return 'herb'
    case 'aura': return 'aura'
    case 'runes': return 'rune'
    case 'healing': return 'healing'
    case 'curses': return 'curse'
    case 'spells': return 'spell'
    case 'rituals': return 'ritual'
    case 'notes': return 'note'
    default: return 'none'
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

  // Initiera fält + automatisk mall vid byte av samling
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
  }, [collectionId, collections]) // eslint-disable-line

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
    // nollställ
    setTitle(''); setContent(''); setTags(''); setImages([]); setRelated([]); setTpl('auto')
    const c = collections.find(c => c.id === collectionId)
    const base: Record<string, any> = {}
    c?.fields.forEach(f => { base[f.key] = '' })
    setCustom(base)
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
  const activeCollection = collections.find(c => c.id === collectionId)

  return (
    <div className="p-4 space-y-4">
      <h1>Ny post</h1>

      {/* Snygg chip-rad för mallval */}
      <div className="sticky -top-1 z-10">
        <div className="scroll-px-4 -mx-4 overflow-x-auto pb-1 no-scrollbar">
          <div className="inline-flex gap-2 px-4">
            {TEMPLATE_META.map(t => {
              const active = tpl === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => applyTemplate(t.key)}
                  className={[
                    "whitespace-nowrap px-3 py-1.5 rounded-full text-sm transition",
                    active
                      ? "bg-amber-600/90 text-black shadow ring-1 ring-amber-400"
                      : "bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
                  ].join(' ')}
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
          <select value={collectionId} onChange={e=>setCollectionId(e.target.value)} className="w-full bg-neutral-900 p-2 rounded">
            {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {/* Dynamiska fält */}
        {activeCollection && activeCollection.fields.length > 0 && (
          <section className="card p-3">
            <h2 className="mb-2">Fält</h2>
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
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Titel" className="w-full bg-neutral-900 p-2 rounded" />
        <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="Markdown-innehåll (långa anteckningar välkomna)" rows={10} className="w-full bg-neutral-900 p-2 rounded"></textarea>
        <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Taggar, separera med komma" className="w-full bg-neutral-900 p-2 rounded" />

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
          <div className="max-h-40 overflow-auto border border-neutral-800 rounded p-2 space-y-1">
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
            {candidates.length===0 && <div className="text-neutral-500 text-sm">Inga kandidater ännu.</div>}
          </div>
        </div>

        <button className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded">Spara</button>
      </form>

      {/* Förhandsvisning */}
      <div className="mt-6 space-y-3">
        <h2>Förhandsvisning</h2>

        {/* Visa sammanfattning av custom-fält */}
        {activeCollection && activeCollection.fields.length>0 && (
          <div className="card p-4">
            <h3 className="mb-2">Fält</h3>
            <dl className="grid grid-cols-1 gap-2">
              {activeCollection.fields.map(f => (
                <div key={f.key} className="grid grid-cols-3 gap-2">
                  <dt className="text-neutral-400 col-span-1">{f.label}</dt>
                  <dd className="col-span-2">{String(custom[f.key] ?? '')}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        <div className="card p-4 prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: previewHTML}}></div>
      </div>
    </div>
  )
}

function FieldInput({ field, value, onChange }: { field: CollectionField, value: any, onChange: (v:any)=>void }) {
  const common = 'w-full bg-neutral-900 p-2 rounded'
  if (field.type === 'longtext') return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <textarea rows={4} className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
    </div>
  )
  if (field.type === 'select') return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <select className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)}>
        <option value="">—</option>
        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  )
  if (field.type === 'number') return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <input type="number" className={common} value={value ?? ''} onChange={e=>onChange(Number(e.target.value))} />
    </div>
  )
  if (field.type === 'date') return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <input type="date" className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
    </div>
  )
  // default text
  return (
    <div>
      <label className="block text-sm mb-1">{field.label}</label>
      <input className={common} value={value ?? ''} onChange={e=>onChange(e.target.value)} />
    </div>
  )
}