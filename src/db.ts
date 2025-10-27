import { createStore, get, set } from 'idb-keyval'
import type { Collection, Entry, Settings } from './types'

const store = createStore('grimoire-db', 'kv')

const DEFAULT_COLLECTIONS: Collection[] = [
  {
    id: 'demons', name: 'Demoner', icon: '👹',
    fields: [
      { key:'rank',        label:'Rang',               type:'select', options:['Kung','Prins','Hertig','Markis','Greve','President','Furste','Soldat','Okänd'] },
      { key:'aspect',      label:'Aspekt/område',      type:'text' },
      { key:'planet',      label:'Planet',             type:'select', options:['Sol','Måne','Mars','Merkurius','Jupiter','Venus','Saturnus','—'] },
      { key:'element',     label:'Element',            type:'select', options:['Eld','Vatten','Luft','Jord','Ande','—'] },
      { key:'incense',     label:'Rökelse/ört',        type:'text' },
      { key:'offering',    label:'Erbjudanden',        type:'text' },
      { key:'day',         label:'Dag/tid',            type:'text' },
      { key:'sigil',       label:'Sigill (beskrivning)', type:'longtext' },
      { key:'warnings',    label:'Varningar',          type:'longtext' }
    ]
  },
  {
    id: 'gods', name: 'Gudar', icon: '⚡',
    fields: [
      { key:'pantheon',    label:'Pantheon',           type:'text' },
      { key:'domains',     label:'Domäner',            type:'text' },
      { key:'epithets',    label:'Epitet/titlar',      type:'text' },
      { key:'festival',    label:'Högtider/dagar',     type:'text' },
      { key:'sacred',      label:'Heliga djur/platser',type:'text' },
      { key:'correspond',  label:'Korrespondenser',    type:'longtext' }
    ]
  },
  {
    id: 'angels', name: 'Änglar', icon: '🪽',
    fields: [
      { key:'choir',       label:'Kör/hierarki',       type:'select', options:['Ärkeängel','Knekt','Körer','Troner','Krafterna','Furstar','Herravälden','Keruber','Serafer','Okänd'] },
      { key:'office',      label:'Uppdrag/titel',      type:'text' },
      { key:'sigil',       label:'Sigill/tecken',      type:'longtext' },
      { key:'virtues',     label:'Dygder/hjälp',       type:'longtext' },
      { key:'psalm',       label:'Psalm/vers',         type:'text' }
    ]
  },
  {
    id: 'spirits', name: 'Naturväsen', icon: '🌲',
    fields: [
      { key:'region',      label:'Region/habitat',     type:'text' },
      { key:'type',        label:'Typ',                type:'select', options:['Skog','Vatten','Berg','Fält','Hushåll','Gränsplatser','Öken','Okänd'] },
      { key:'traits',      label:'Drag',               type:'longtext' },
      { key:'gifts',       label:'Gåvor/etikett',      type:'longtext' },
      { key:'risks',       label:'Risker',             type:'longtext' }
    ]
  },
  {
    id: 'creatures', name: 'Väsen', icon: '🐾',
    fields: [
      { key:'habitat',     label:'Habitat',            type:'text' },
      { key:'taxonomy',    label:'Typ',                type:'text' },
      { key:'behavior',    label:'Beteende',           type:'longtext' },
      { key:'signs',       label:'Tecken/omständigheter', type:'longtext' }
    ]
  },
  {
    id: 'crystals', name: 'Kristaller & mineraler', icon: '💎',
    fields: [
      { key:'hardness',    label:'Hårdhet (Mohs)',     type:'number' },
      { key:'color',       label:'Färg',               type:'text' },
      { key:'system',      label:'Kristallsystem',     type:'text' },
      { key:'chakra',      label:'Chakra',             type:'select', options:['Rot','Sakral','Solar plexus','Hjärta','Hals','Tredje ögat','Krona','Alla'] },
      { key:'element',     label:'Element',            type:'select', options:['Eld','Vatten','Luft','Jord','Ande','—'] },
      { key:'uses',        label:'Användning',         type:'longtext' },
      { key:'cleansing',   label:'Rengöring/laddning', type:'longtext' }
    ]
  },
  {
    id: 'herbs', name: 'Örter & växter', icon: '🌿',
    fields: [
      { key:'latin',       label:'Latinskt namn',      type:'text' },
      { key:'parts',       label:'Delar som används',  type:'text' },
      { key:'planet',      label:'Planet',             type:'select', options:['Sol','Måne','Mars','Merkurius','Jupiter','Venus','Saturnus','—'] },
      { key:'element',     label:'Element',            type:'select', options:['Eld','Vatten','Luft','Jord','Ande','—'] },
      { key:'uses',        label:'Användning',         type:'longtext' },
      { key:'correspondences', label:'Korrespondenser', type:'longtext' },
      { key:'safety',      label:'Säkerhet',           type:'longtext' }
    ]
  },
  {
    id: 'aura', name: 'Aura', icon: '✨',
    fields: [
      { key:'color',       label:'Färg/nyans',         type:'text' },
      { key:'state',       label:'Tillstånd/rörelse',  type:'text' },
      { key:'reading',     label:'Tolkning',           type:'longtext' },
      { key:'balance',     label:'Rekommenderad balans', type:'longtext' }
    ]
  },
  {
    id: 'runes', name: 'Runor', icon: 'ᚠ',
    fields: [
      { key:'glyph',       label:'Grafem',             type:'text' },
      { key:'phoneme',     label:'Ljudvärde',          type:'text' },
      { key:'meaning',     label:'Betydelser',         type:'longtext' },
      { key:'reversed',    label:'Omvänd betydelse',   type:'longtext' },
      { key:'galdr',       label:'Bindrunor/galdrar',  type:'longtext' }
    ]
  },
  {
    id: 'healing', name: 'Healing', icon: '🜁',
    fields: [
      { key:'method',      label:'Metod/verktyg',      type:'text' },
      { key:'intent',      label:'Syfte',              type:'text' },
      { key:'materials',   label:'Material',           type:'longtext' },
      { key:'steps',       label:'Steg',               type:'longtext' },
      { key:'aftercare',   label:'Eftervård',          type:'longtext' },
      { key:'contra',      label:'Kontraindikationer', type:'longtext' }
    ]
  },
  {
    id: 'curses', name: 'Förbannelser', icon: '☠️',
    fields: [
      { key:'target',      label:'Mål/avsikt',         type:'text' },
      { key:'materials',   label:'Material',           type:'longtext' },
      { key:'construction',label:'Konstruktion',       type:'longtext' },
      { key:'safety',      label:'Säkerhet/avslut',    type:'longtext' },
      { key:'ethics',      label:'Etik/överväganden',  type:'longtext' }
    ]
  },
  {
    id: 'spells', name: 'Trollformler', icon: '🪄',
    fields: [
      { key:'intent',      label:'Avsikt',             type:'text' },
      { key:'timing',      label:'Fönster (tid/astro)',type:'text' },
      { key:'ingredients', label:'Ingredienser',       type:'longtext' },
      { key:'execution',   label:'Utförande',          type:'longtext' },
      { key:'omens',       label:'Tecken på effekt',   type:'longtext' }
    ]
  },
  {
    id: 'rituals', name: 'Ritualer', icon: '🕯️',
    fields: [
      { key:'purpose',     label:'Syfte',              type:'text' },
      { key:'tools',       label:'Verktyg/korrespondenser', type:'longtext' },
      { key:'steps',       label:'Steg',               type:'longtext' },
      { key:'closing',     label:'Risker/brytning',    type:'longtext' }
    ]
  },
  { id: 'notes', name: 'Anteckningar', icon: '📝', fields: [] }
]

export async function getCollections(): Promise<Collection[]> {
  const col = await get<Collection[]>('collections', store)
  if (!col) {
    await set('collections', DEFAULT_COLLECTIONS, store)
    return DEFAULT_COLLECTIONS
  }
  return col
}

export async function saveCollections(cols: Collection[]) { await set('collections', cols, store) }
export async function getEntries(): Promise<Entry[]> { return (await get<Entry[]>('entries', store)) ?? [] }
export async function saveEntries(entries: Entry[]) { await set('entries', entries, store) }
export async function getSettings(): Promise<Settings> { return (await get<Settings>('settings', store)) ?? { theme: 'dark', language: 'sv' } }
export async function saveSettings(s: Settings) { await set('settings', s, store) }

export async function exportAll() {
  const [collections, entries, settings] = await Promise.all([getCollections(), getEntries(), getSettings()])
  return { collections, entries, settings, version: 2 }
}
export async function importAll(payload: any) {
  if (!payload) return
  if (payload.collections) await saveCollections(payload.collections)
  if (payload.entries) await saveEntries(payload.entries)
  if (payload.settings) await saveSettings(payload.settings)
}