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

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

export default function RichEditor({ value, onChange, placeholder }: Props) {
  // Initial MD → HTML (vi fyller ändå på vid mode-byte)
  const initialHTML = useMemo(
    () => marked.parse(value || '', { async: false }) as string,
    []
  )

  const [mode, setMode] = useState<'md' | 'visual'>('md')
  const modeRef = useRef<'md' | 'visual'>(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  // MD-textarea (för infoga vid markör)
  const mdRef = useRef<HTMLTextAreaElement>(null)

  // TipTap
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
          'min-h-[180px] p-3 rounded border border-app outline-none bg-panel prose max-w-none',
      },
    },
    onUpdate({ editor }) {
      // Turndown endast när vi är i visuellt läge
      if (modeRef.current !== 'visual') return
      const html = editor.getHTML()
      const md = td.turndown(html)
      if (md !== value) onChange(md)
    },
  })

  // --- Stored marks helpers (hindrar IME från att nolla stil) ---
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

  // Håll visual i synk om MD ändras externt
  useEffect(() => {
    if (!editor || mode !== 'visual') return
    const html = marked.parse(value || '', { async: false }) as string
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, false)
    }
  }, [value, mode, editor])

  function switchMode(next: 'md' | 'visual') {
    setMode(next)
    if (next === 'visual' && editor) {
      const html = marked.parse(value || '', { async: false }) as string
      editor.commands.setContent(html, false)
    }
  }

  // ---------- Gemensamma/MD/Visuell-verktyg ----------
  function insertAtCursor(
    el: HTMLTextAreaElement,
    snippet: string,
    selectStartOffset = 0,
    selectEndOffset = 0
  ) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    const next = before + snippet + after
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start + selectStartOffset
      el.selectionEnd = start + selectEndOffset
    })
  }

  // Länk (visuell)
  function promptLinkVisual() {
    if (!editor) return
    const existing = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Länkadress (https://…):', existing || '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  // Länk (MD)
  function promptLinkMarkdown() {
    const el = mdRef.current
    if (!el) return
    const hasSel = (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)
    const selected = hasSel ? el.value.slice(el.selectionStart!, el.selectionEnd!) : ''
    const text = hasSel ? selected : (window.prompt('Text att visa:', '') ?? '')
    if (text === null) return
    const url = window.prompt('Länkadress (https://…):', 'https://')
    if (url === null || url.trim() === '') return
    const snippet = `[${text || 'länk'}](${url.trim()})`
    if (hasSel) {
      const start = el.selectionStart!
      const end = el.selectionEnd!
      const next = el.value.slice(0, start) + snippet + el.value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + snippet.length
        el.selectionStart = el.selectionEnd = pos
      })
    } else {
      insertAtCursor(el, snippet)
    }
  }

  function handleLinkClick() {
    if (mode === 'visual') promptLinkVisual()
    else promptLinkMarkdown()
  }

  // Bild (visuell/md)
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

  // Färg & Typsnitt – lägg även som stored mark (så stilen “hänger kvar”)
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

  // Hjälp-popup
  const [showHelp, setShowHelp] = useState(false)
  const editorReady = !!editor

  return (
    <div className="space-y-2">
      {/* Topbar (sticky) */}
      <div className="editor-toolbar sticky editor-avoid-overlap">
        <div className="inline-flex gap-2 mr-2">
          <button
            type="button"
            className={`btn ${mode === 'md' ? 'btn-active' : ''}`}
            onClick={() => switchMode('md')}
            aria-pressed={mode === 'md'}
          >
            Markdown
          </button>
          <button
            type="button"
            className={`btn ${mode === 'visual' ? 'btn-active' : ''}`}
            onClick={() => switchMode('visual')}
            aria-pressed={mode === 'visual'}
            disabled={!editorReady}
            title={editorReady ? '' : 'Initierar editor…'}
          >
            Visuell
          </button>
        </div>

        {/* Länk / Bild / Hjälp */}
        <button type="button" className="btn mr-1" onClick={handleLinkClick} title="Infoga länk">
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
          className="btn mr-1"
          onClick={() => fileInputRef.current?.click()}
          title="Infoga bild"
        >
          🖼️ Bild
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => setShowHelp(s => !s)}
          aria-expanded={showHelp}
          title="Markdown-hjälp"
        >
          ?
        </button>
      </div>

      {/* Diskret MD-hjälp */}
      {mode === 'md' && showHelp && (
        <div className="text-xs text-muted border border-app rounded p-2 bg-panel">
          <div className="mb-1 font-semibold">Markdown-kortkommandon</div>
          <ul className="space-y-0.5">
            <li><code>#</code> rubrik 1, <code>##</code> rubrik 2</li>
            <li><code>**bold**</code>, <code>*italic*</code>, <code>__underline__</code></li>
            <li><code>-</code> punktlista, <code>1.</code> numrerad</li>
            <li><code>&gt; citat</code>, <code>```</code> kodblock</li>
            <li><code>[text](https://…)</code> länk – eller 🔗 ovan</li>
            <li><code>![alt](bild.png)</code> bild</li>
          </ul>
        </div>
      )}

      {/* Visuell toolbar (under sticky-raden) */}
      {mode === 'visual' && (
        <div className="editor-toolbar">
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>

          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Lista</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Lista</button>

          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>

          <label className="btn">
            Färg
            <input
              type="color"
              onChange={setColor}
              className="ml-2 h-5 w-8 p-0 border border-app rounded bg-transparent"
            />
          </label>

          <select
            className="input !p-1 !h-9 !w-auto"
            onChange={(e) => setFont(e.target.value)}
            defaultValue="system"
            title="Typsnitt"
            disabled={!editorReady}
          >
            <option value="system">System</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
            <option value="callig">Calligraphic</option>
          </select>
        </div>
      )}

      {/* Editor / Textarea */}
      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          ref={mdRef}
          className="input min-h-[220px]"
          placeholder={placeholder || 'Markdown eller visuellt – välj vad som känns bäst.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}import React, { useEffect, useMemo, useRef, useState } from 'react'
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

const td = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })

export default function RichEditor({ value, onChange, placeholder }: Props) {
  // Initial MD → HTML (vi fyller ändå på vid mode-byte)
  const initialHTML = useMemo(
    () => marked.parse(value || '', { async: false }) as string,
    []
  )

  const [mode, setMode] = useState<'md' | 'visual'>('md')
  const modeRef = useRef<'md' | 'visual'>(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  // MD-textarea (för infoga vid markör)
  const mdRef = useRef<HTMLTextAreaElement>(null)

  // TipTap
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
          'min-h-[180px] p-3 rounded border border-app outline-none bg-panel prose max-w-none',
      },
    },
    onUpdate({ editor }) {
      // Turndown endast när vi är i visuellt läge
      if (modeRef.current !== 'visual') return
      const html = editor.getHTML()
      const md = td.turndown(html)
      if (md !== value) onChange(md)
    },
  })

  // --- Stored marks helpers (hindrar IME från att nolla stil) ---
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

  // Håll visual i synk om MD ändras externt
  useEffect(() => {
    if (!editor || mode !== 'visual') return
    const html = marked.parse(value || '', { async: false }) as string
    if (editor.getHTML() !== html) {
      editor.commands.setContent(html, false)
    }
  }, [value, mode, editor])

  function switchMode(next: 'md' | 'visual') {
    setMode(next)
    if (next === 'visual' && editor) {
      const html = marked.parse(value || '', { async: false }) as string
      editor.commands.setContent(html, false)
    }
  }

  // ---------- Gemensamma/MD/Visuell-verktyg ----------
  function insertAtCursor(
    el: HTMLTextAreaElement,
    snippet: string,
    selectStartOffset = 0,
    selectEndOffset = 0
  ) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    const next = before + snippet + after
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = start + selectStartOffset
      el.selectionEnd = start + selectEndOffset
    })
  }

  // Länk (visuell)
  function promptLinkVisual() {
    if (!editor) return
    const existing = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Länkadress (https://…):', existing || '')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
  }

  // Länk (MD)
  function promptLinkMarkdown() {
    const el = mdRef.current
    if (!el) return
    const hasSel = (el.selectionStart ?? 0) !== (el.selectionEnd ?? 0)
    const selected = hasSel ? el.value.slice(el.selectionStart!, el.selectionEnd!) : ''
    const text = hasSel ? selected : (window.prompt('Text att visa:', '') ?? '')
    if (text === null) return
    const url = window.prompt('Länkadress (https://…):', 'https://')
    if (url === null || url.trim() === '') return
    const snippet = `[${text || 'länk'}](${url.trim()})`
    if (hasSel) {
      const start = el.selectionStart!
      const end = el.selectionEnd!
      const next = el.value.slice(0, start) + snippet + el.value.slice(end)
      onChange(next)
      requestAnimationFrame(() => {
        el.focus()
        const pos = start + snippet.length
        el.selectionStart = el.selectionEnd = pos
      })
    } else {
      insertAtCursor(el, snippet)
    }
  }

  function handleLinkClick() {
    if (mode === 'visual') promptLinkVisual()
    else promptLinkMarkdown()
  }

  // Bild (visuell/md)
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

  // Färg & Typsnitt – lägg även som stored mark (så stilen “hänger kvar”)
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

  // Hjälp-popup
  const [showHelp, setShowHelp] = useState(false)
  const editorReady = !!editor

  return (
    <div className="space-y-2">
      {/* Topbar (sticky) */}
      <div className="editor-toolbar sticky editor-avoid-overlap">
        <div className="inline-flex gap-2 mr-2">
          <button
            type="button"
            className={`btn ${mode === 'md' ? 'btn-active' : ''}`}
            onClick={() => switchMode('md')}
            aria-pressed={mode === 'md'}
          >
            Markdown
          </button>
          <button
            type="button"
            className={`btn ${mode === 'visual' ? 'btn-active' : ''}`}
            onClick={() => switchMode('visual')}
            aria-pressed={mode === 'visual'}
            disabled={!editorReady}
            title={editorReady ? '' : 'Initierar editor…'}
          >
            Visuell
          </button>
        </div>

        {/* Länk / Bild / Hjälp */}
        <button type="button" className="btn mr-1" onClick={handleLinkClick} title="Infoga länk">
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
          className="btn mr-1"
          onClick={() => fileInputRef.current?.click()}
          title="Infoga bild"
        >
          🖼️ Bild
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => setShowHelp(s => !s)}
          aria-expanded={showHelp}
          title="Markdown-hjälp"
        >
          ?
        </button>
      </div>

      {/* Diskret MD-hjälp */}
      {mode === 'md' && showHelp && (
        <div className="text-xs text-muted border border-app rounded p-2 bg-panel">
          <div className="mb-1 font-semibold">Markdown-kortkommandon</div>
          <ul className="space-y-0.5">
            <li><code>#</code> rubrik 1, <code>##</code> rubrik 2</li>
            <li><code>**bold**</code>, <code>*italic*</code>, <code>__underline__</code></li>
            <li><code>-</code> punktlista, <code>1.</code> numrerad</li>
            <li><code>&gt; citat</code>, <code>```</code> kodblock</li>
            <li><code>[text](https://…)</code> länk – eller 🔗 ovan</li>
            <li><code>![alt](bild.png)</code> bild</li>
          </ul>
        </div>
      )}

      {/* Visuell toolbar (under sticky-raden) */}
      {mode === 'visual' && (
        <div className="editor-toolbar">
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>

          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Lista</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Lista</button>

          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" className="btn" disabled={!editorReady} onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>

          <label className="btn">
            Färg
            <input
              type="color"
              onChange={setColor}
              className="ml-2 h-5 w-8 p-0 border border-app rounded bg-transparent"
            />
          </label>

          <select
            className="input !p-1 !h-9 !w-auto"
            onChange={(e) => setFont(e.target.value)}
            defaultValue="system"
            title="Typsnitt"
            disabled={!editorReady}
          >
            <option value="system">System</option>
            <option value="serif">Serif</option>
            <option value="mono">Mono</option>
            <option value="callig">Calligraphic</option>
          </select>
        </div>
      )}

      {/* Editor / Textarea */}
      {mode === 'visual' ? (
        <EditorContent editor={editor} />
      ) : (
        <textarea
          ref={mdRef}
          className="input min-h-[220px]"
          placeholder={placeholder || 'Markdown eller visuellt – välj vad som känns bäst.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}