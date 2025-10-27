import { useEffect, useMemo, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getCollections, getEntries, saveEntries } from '../db'
import type { Entry, Collection } from '../types'
import { marked } from 'marked'

export default function EntryView() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [entry, setEntry] = useState<Entry | null>(null)
  const [collections, setCollections] = useState<Collection[]>([])
  const [all, setAll] = useState<Entry[]>([])
  const [isEdit, setIsEdit] = useState(false)

  // lokala editfält
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [custom, setCustom] = useState<Record<string, any>>({})

  useEffect(() => {
    ;(async () => {
      const list = await getEntries()
      const e = list.find(x => x.id === id) || null
      setEntry(e)
      setAll(list)
      setCollections(await getCollections())

      // init editfält
      setTitle(e?.title || '')
      setContent(e?.contentMD || '')
      setTags(e?.tags.join(', ') || '')
      setImages(e?.images ?? [])
      setCustom(e?.custom ?? {})
    })()
  }, [id])

  async function save() {
    if (!entry) return
    const list = await getEntries()
    const idx = list.findIndex(x => x.id === entry.id)
    if (idx < 0) return

    const updated: Entry = {
      ...entry,
      title,
      contentMD: content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      images,
      custom,
      updatedAt: Date.now()
    }
    list[idx] = updated
    await saveEntries(list)
    setEntry(updated)
    setIsEdit(false)
    alert('Uppdaterat.')
  }

  async function remove() {
    if (!entry) return
    if (!confirm('Ta bort posten? Detta går inte att ångra.')) return
    const list = (await getEntries()).filter(e => e.id !== entry.id)
    await saveEntries(list)
    navigate('/search')
  }

  // Markdown → HTML (visa entry-läge; i edit visar vi fälten istället)
  const html = useMemo(
    () => marked.parse(entry?.contentMD || '', { async: false }) as string,
    [entry]
  )

  if (!entry) {
    return (
      <div className="p-4 space-y-2">
        <p>Hittar inte posten.</p>
        <Link to="/search" className="btn btn-secondary">← Tillbaka</Link>
      </div>
    )
  }

  const activeCollection = collections.find(c => c.id === entry.collectionId)
  const related = (entry.relatedIds || [])
    .map(rid => all.find(e => e.id === rid))
    .filter(Boolean) as Entry[]

  return (
    <div className="p-4 space-y-4">
      {!isEdit ? (
        <>
          <div className="text-sm text-muted flex items-center gap-2">
            <span>{activeCollection?.name}</span>
            <span>•</span>
            <Link to="/search" className="underline">Visa fler</Link>
          </div>

          <h1>{entry.title}</h1>
          {entry.tags.length > 0 && (
            <div className="text-xs text-muted">{entry.tags.join(', ')}</div>
          )}

          {/* Egendefinierade fält */}
          {activeCollection && activeCollection.fields.length > 0 && (
            <section className="section">
              <h2 className="mb-2">Fält</h2>
              <dl className="grid grid-cols-1 gap-2">
                {activeCollection.fields.map(f => (
                  <div key={f.key} className="grid grid-cols-3 gap-2">
                    <dt className="text-muted col-span-1">{f.label}</dt>
                    <dd className="col-span-2">{String(entry.custom?.[f.key] ?? '')}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {/* Bilder */}
          {entry.images?.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {entry.images.map((src, i) => (
                <img key={i} src={src} alt="" className="rounded" />
              ))}
            </div>
          )}

          {/* Innehåll */}
          <section className="section prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />

          {/* Relaterat */}
          {related.length > 0 && (
            <section className="space-y-2">
              <h2>Relaterat</h2>
              <div className="grid grid-cols-1 gap-2">
                {related.map(r => (
                  <Link
                    key={r.id}
                    to={`/entry/${r.id}`}
                    className="card p-2 hover:brightness-110 transition"
                  >
                    <div className="text-xs text-muted">
                      {collections.find(c => c.id === r.collectionId)?.name}
                    </div>
                    <div className="font-semibold">{r.title}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={() => setIsEdit(true)}>Redigera</button>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>Tillbaka</button>
            <button className="btn" onClick={remove}>Ta bort</button>
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="input"
            placeholder="Titel"
          />
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={10}
            className="input"
            placeholder="Markdown-innehåll…"
          />
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            className="input"
            placeholder="tagg1, tagg2, …"
          />

          {/* Edit av custom-fält */}
          {activeCollection && activeCollection.fields.length > 0 && (
            <div className="section">
              <h2 className="mb-2">Fält</h2>
              <div className="grid grid-cols-1 gap-3">
                {activeCollection.fields.map(f => (
                  <div key={f.key}>
                    <label className="block text-sm text-muted mb-1">{f.label}</label>
                    {f.type === 'longtext' ? (
                      <textarea
                        rows={4}
                        className="input"
                        value={custom[f.key] ?? ''}
                        onChange={e => setCustom(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    ) : f.type === 'number' ? (
                      <input
                        type="number"
                        className="input"
                        value={custom[f.key] ?? ''}
                        onChange={e => setCustom(prev => ({ ...prev, [f.key]: Number(e.target.value) }))}
                      />
                    ) : f.type === 'date' ? (
                      <input
                        type="date"
                        className="input"
                        value={custom[f.key] ?? ''}
                        onChange={e => setCustom(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    ) : f.type === 'select' ? (
                      <select
                        className="input"
                        value={custom[f.key] ?? ''}
                        onChange={e => setCustom(prev => ({ ...prev, [f.key]: e.target.value }))}
                      >
                        <option value="">—</option>
                        {(f.options || []).map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        className="input"
                        value={custom[f.key] ?? ''}
                        onChange={e => setCustom(prev => ({ ...prev, [f.key]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bilder (visning – redigering av bilder kan vi lägga till sen) */}
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((src, i) => (
                <img key={i} src={src} alt="" className="rounded" />
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={save}>Spara</button>
            <button className="btn" onClick={() => setIsEdit(false)}>Avbryt</button>
          </div>
        </div>
      )}
    </div>
  )
}