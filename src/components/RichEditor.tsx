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
  const initialHTML = useMemo(() => marked.parse(value || '', { async: false }) as string, [value])

  const [mode, setMode] = useState<'md' | 'visual'>('md')
  const [htmlShadow, setHtmlShadow] = useState<string>(initialHTML)

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
      const html = editor.getHTML()
      setHtmlShadow(html)
      const md = td.turndown(html)
      onChange(md)
    },
  })

  // textarea-ref för MD-läget (för att kunna infoga länk vid markören)
  const mdRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const nextHTML = marked.parse(value || '', { async: false }) as string
    setHtmlShadow(nextHTML)
    if (editor && mode === 'visual' && editor.getHTML() !== nextHTML) {
      editor.commands.setContent(nextHTML, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function switchMode(next: 'md' | 'visual') {
    setMode(next)
    if (next === 'visual' && editor) {
      editor.commands.setContent(marked.parse(value || '', { async: false }) as string, false)
    }
  }

  // ------- LÄNK (fungerar i båda lägen) -------
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

  function insertAtCursor(el: HTMLTextAreaElement, snippet: string) {
    const start = el.selectionStart ?? el.value.length
    const end = el.selectionEnd ?? el.value.length
    const before = el.value.slice(0, start)
    const after = el.value.slice(end)
    const next = before + snippet + after
    onChange(next)
    requestAnimationFrame(() => {
      el.focus()
      const pos = start + snippet.length
      el.selectionStart = el.selectionEnd = pos
    })
  }

  function promptLinkMarkdown() {
    const el = mdRef.current
    if (!el) return
    const text = window.prompt('Text att visa:', '')
    if (text === null) return
    const url = window.prompt('Länkadress (https://…):', 'https://')
    if (url === null || url.trim() === '') return
    const snippet = `[${text || 'länk'}](${url.trim()})`
    insertAtCursor(el, snippet)
  }

  function handleLinkClick() {
    if (mode === 'visual') promptLinkVisual()
    else promptLinkMarkdown()
  }
  // -------------------------------------------

  // Övrig toolbar (visual)
  const fileInputRef = useRef<HTMLInputElement>(null)
  async function pickImage(e?: React.ChangeEvent<HTMLInputElement>) {
    if (!editor) return
    const files = e?.target?.files
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
    editor.chain().focus()
    arr.forEach(src => editor.chain().setImage({ src }).run())
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function setColor(ev: React.ChangeEvent<HTMLInputElement>) {
    if (!editor) return
    editor.chain().focus().setColor(ev.target.value).run()
  }
  function setFont(family: string) {
    if (!editor) return
    if (family === 'system') editor.chain().focus().unsetFontFamily().run()
    else editor.chain().focus().setFontFamily(resolveFontFamily(family)).run()
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

  // Hjälp-popup (diskret)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="space-y-2">
      {/* Topbar – alltid synlig */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="inline-flex gap-2">
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
          >
            Visuell
          </button>
        </div>

        {/* Alltid: Länk + Hjälp (diskret) */}
        <button type="button" className="btn" onClick={handleLinkClick} title="Infoga länk">
          🔗 Länk
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

      {/* Liten hjälp-panel, bara i MD-läget och när togglad */}
      {mode === 'md' && showHelp && (
        <div className="text-xs text-muted border border-app rounded p-2 bg-panel">
          <div className="mb-1 font-semibold">Markdown-kortkommandon</div>
          <ul className="space-y-0.5">
            <li><code>#</code> Rubrik 1, <code>##</code> Rubrik 2</li>
            <li><code>**bold**</code>, <code>*italic*</code>, <code>__underline__</code></li>
            <li><code>-</code> punktlista, <code>1.</code> numrerad</li>
            <li><code>&gt; citat</code>, <code>```</code> kodblock</li>
            <li><code>[text](https://…)</code> länk – eller klicka 🔗 ovan</li>
            <li><code>![alt](bild.png)</code> bild</li>
          </ul>
        </div>
      )}

      {/* Toolbar för VISUELLT läge */}
      {mode === 'visual' && (
        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleBold().run()}><b>B</b></button>
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleItalic().run()}><i>I</i></button>
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleUnderline().run()}><u>U</u></button>

          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleBulletList().run()}>• Lista</button>
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleOrderedList().run()}>1. Lista</button>

          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}>H3</button>
          <button type="button" className="btn" onClick={() => editor?.chain().focus().toggleBlockquote().run()}>❝</button>

          {/* Länk hanteras via handleLinkClick så samma knapp funkar i båda lägen */}
          {/* Bild */}
          <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={pickImage}/>
          <button type="button" className="btn" onClick={() => fileInputRef.current?.click()}>Bild</button>

          <label className="btn">
            Färg
            <input type="color" onChange={setColor} className="ml-2 h-5 w-8 p-0 border border-app rounded bg-transparent" />
          </label>

          <select
            className="input !p-1 !h-9 !w-auto"
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