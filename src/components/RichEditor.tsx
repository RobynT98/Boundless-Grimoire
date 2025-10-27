import React, { useEffect, useMemo, useRef, useState } from 'react'
import { marked } from 'marked'
import TurndownService from 'turndown'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import FontFamily from '@tiptap/extension-font-family'

type Props = {
  value: string
  onChange: (markdown: string) => void
  placeholder?: string
}

/** Turndown – behåll stilad text som rå HTML inuti MD */
const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
td.keep(['u', 'mark'])

/** Behåll <span style="color:...; font-family:...">...</span> när vi turndown:ar */
td.addRule('preserveStyledSpan', {
  filter(node: Node): boolean {
    const el = node as HTMLElement
    if (!(el instanceof HTMLElement)) return false
    if (el.tagName !== 'SPAN') return false
    const style = el.getAttribute('style') ?? ''
    return /(?:^|;)\s*(color|font-family)\s*:/.test(style)
  },
  replacement(content: string, node: Node): string {
    const el = node as HTMLElement
    const style = el.getAttribute('style') ?? ''
    return `<span style="${style}">${content}</span>`
  },
})

/** Hjälp – känns igen HTML så vi inte försöker parsa den igen */
const looksLikeHTML = (s: string) => /<\s*[a-z][\s\S]*>/i.test(s)

export default function RichEditor({ value, onChange, placeholder }: Props) {
  // Initial MD → HTML
  const initialHTML = useMemo(() => {
    const v = value || ''
    return looksLikeHTML(v) ? v : (marked.parse(v, { async: false }) as string)
  }, [])

  const [mode, setMode] = useState<'md' | 'visual'>('md')
  const modeRef = useRef<'md' | 'visual'>(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  // Textarea-referens
  const mdRef = useRef<HTMLTextAreaElement>(null)

  // TipTap-editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      Color.configure({ types: ['textStyle'] }),
      Highlight,
      Link.configure({
        openOnClick: true,
        autolink: true,
        defaultProtocol: 'https',
      }),
      Image.configure({ allowBase64: true }),
    ],
    content: initialHTML || `<p class="text-muted">${placeholder || ''}</p>`,
    editorProps: {
      attributes: {
        class:
          'min-h-[180px] p-4 rounded border border-app outline-none bg-panel prose max-w-none text-[16px] leading-relaxed',
      },
    },
    onUpdate({ editor }) {
      if (modeRef.current !== 'visual') return
      const html = editor.getHTML()
      const md = td.turndown(html)
      if (md !== value) onChange(md)
    },
  })

  // --- Stored marks helpers
  function addStoredTextStyle(attrs: { color?: string; fontFamily?: string | null }) {
    if (!editor) return
    const { state, view } = editor
    const markType = state.schema.marks.textStyle
    const tr = state.tr.addStoredMark(
      attrs.fontFamily === null ? markType.create() : markType.create(attrs)
    )
    view.dispatch(tr)
  }
  function clearStoredMarks() {
    if (!editor) return
    const { state, view } = editor
    view.dispatch(state.tr.setStoredMarks([]))
  }

  // Håll visual i synk om MD ändras utifrån
  useEffect(() => {
    if (!editor || mode !== 'visual') return
    const v = value || ''
    const html = looksLikeHTML(v) ? v : (marked.parse(v, { async: false }) as string)
    if (editor.getHTML() !== html) editor.commands.setContent(html, false)
  }, [value, mode, editor])

  function switchMode(next: 'md' | 'visual') {
    setMode(next)
    if (next === 'visual' && editor) {
      const v = value || ''
      const html = looksLikeHTML(v) ? v : (marked.parse(v, { async: false }) as string)
      editor.commands.setContent(html, false)
    }
  }

  // --- Insättningshjälp för textarea
  function insertAtCursor(el: HTMLTextAreaElement, snippet: string) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    const next = before + snippet + after
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = start + snippet.length
    })
  }

  // --- Länkar
  function promptLinkVisual() {
    if (!editor) return
    const existing = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Länkadress (https://…):', existing || '')
    if (url === null) return
    if (url === '') editor.chain().focus().unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }
  function promptLinkMarkdown() {
    const el = mdRef.current
    if (!el) return
    const hasSel = (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)
    const selected = hasSel ? el.value.slice(el.selectionStart!, el.selectionEnd!) : ''
    const text = hasSel ? selected : (window.prompt('Text att visa:', '') ?? '')
    if (text === null) return
    const url = window.prompt('Länkadress (https://…):', 'https://')
    if (!url || !url.trim()) return
    const snippet = `[${text || 'länk'}](${url.trim()})`
    hasSel
      ? (() => {
          const start = el.selectionStart!
          const end = el.selectionEnd!
          const next = el.value.slice(0, start) + snippet + el.value.slice(end)
          onChange(next)
          requestAnimationFrame(() => {
            el.focus()
            const pos = start + snippet.length
            el.selectionStart = el.selectionEnd = pos
          })
        })()
      : insertAtCursor(el, snippet)
  }
  function handleLinkClick() {
    if (mode === 'visual') promptLinkVisual()
    else promptLinkMarkdown()
  }

  // --- Bilder
  const fileInputRef = useRef<HTMLInputElement>(null)
  async function onPickImages(files: FileList | null) {
    if (!files || files.length === 0) return
    const arr = await Promise.all(
      Array.from(files).map(
        f =>
          new Promise<string>(res => {
            const r = new FileReader()
            r.onload = () => res(r.result as string)
            r.readAsDataURL(f)
          })
      )
    )
    if (mode === 'visual' && editor) {
      editor.chain().focus()
      arr.forEach(src => editor.chain().setImage({ src }).run())
    } else if (mode === 'md' && mdRef.current) {
      for (const src of arr) insertAtCursor(mdRef.current, `![bild](${src})`)
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // --- Färg & typsnitt
  function setColor(ev: React.ChangeEvent<HTMLInputElement>) {
    if (!editor) return
    const v = ev.target.value
    editor.chain().focus().setColor(v).run()
    addStoredTextStyle({ color: v })
    setTimeout(() => addStoredTextStyle({ color: v }), 0)
  }

  function setFont(family: string) {
    if (!editor) return
    if (family === 'system') {
      editor.chain().focus().unsetFontFamily().run()
      clearStoredMarks()
      setTimeout(() => clearStoredMarks(), 0)
    } else {
      const resolved = resolveFontFamily(family)
      editor.chain().focus().setFontFamily(resolved).run()
      addStoredTextStyle({ fontFamily: resolved })
      setTimeout(() => addStoredTextStyle({ fontFamily: resolved }), 0)
    }
  }

  function resolveFontFamily(key: string) {
    switch (key) {
      case 'serif':
        return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
      case 'mono':
        return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      case 'callig':
        return '"Segoe Script","Bradley Hand","Comic Sans MS","Apple Chancery",cursive'
      default:
        return 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif'
    }
  }

  const [showHelp, setShowHelp] = useState(false)
  const editorReady = !!editor

  return (
    <div className="space-y-2 editor-root">
      {/* Topbar */}
      <div className="editor-toolbar sticky editor-avoid-overlap">
        <div className="inline-flex gap-2 mr-2">
          <button
            type="button"
            className={`btn min-h-[44px] ${mode === 'md' ? 'btn-active' : ''}`}
            onClick={() => switchMode('md')}
          >
            Markdown
          </button>
          <button
            type="button"
            className={`btn min-h-[44px] ${mode === 'visual' ? 'btn-active' : ''}`}
            onClick={() => switchMode('visual')}
            disabled={!editorReady}
            title={editorReady ? '' : 'Initierar editor…'}
          >
            Visuell
          </button>
        </div>

        <button type="button" className="btn mr-1 min-h-[44px]" onClick={handleLinkClick}>
          🔗 Länk
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={e => onPickImages(e.target.files)}
        />
        <button
          type="button"
          className="btn mr-1 min-h-[44px]"
          onClick={() => fileInputRef.current?.click()}
        >
          🖼️ Bild
        </button>

        <button
          type="button"
          className="btn min-h-[44px]"
          onClick={() => setShowHelp(s => !s)}
        >
          ?
        </button>
      </div>

      {mode === 'md' && showHelp && (
        <div className="text-xs text-muted border border-app rounded p-2 bg-panel leading-snug">
          <div className="mb-1 font-semibold">Markdown-kortkommandon</div>
          <ul className="space-y-0.5">
            <li><code>#</code> rubrik 1, <code>##</code> rubrik 2</li>
            <li><code>**bold**</code>, <code>*italic*</code>, <code>__underline__</code></li>
            <li><code>-</code> punktlista, <code>1.</code> numrerad</li>
            <li><code>&gt;</code> citat, <code>```</code> kodblock</li>
            <li><code>[text](https://…)</code> länk – eller 🔗 ovan</li>
            <li><code>![alt](bild.png)</code> bild</li>
          </ul>
        </div>
      )}

      {mode === 'visual' && (
        <div className="editor-toolbar flex-wrap">
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>

          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Lista</button>
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Lista</button>

          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" className="btn min-h-[44px]" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>

          <label className="btn min-h-[44px]">
            Färg
            <input
              type="color"
              onChange={setColor}
              className="ml-2 h-[28px] w-[40px] p-0 border border-app rounded bg-transparent"
            />
          </label>

          <select
            className="input !p-1 !h-[44px] !w-auto"
            onChange={(e) => setFont(e.target.value)}
            defaultValue="system"
            title="Typsnitt"
          >
            <option value="system">System</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
            <option value="callig">Calligraphic</option>
          </select>
        </div>
      )}

      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          ref={mdRef}
          className="input min-h-[220px] text-[16px] leading-relaxed"
          placeholder={placeholder || 'Markdown eller visuellt – välj vad som känns bäst.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}