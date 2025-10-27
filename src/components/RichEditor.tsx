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
  const [showHelp, setShowHelp] = useState(false)

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
    if (next === 'md') setShowHelp(false)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  function promptLink() {
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

  async function pickImage(e?: React.ChangeEvent<HTMLInputElement>) {
    if (!editor) return
    const files = e?.target?.files
    if (!files || files.length === 0) return
    const arr = await Promise.all(
      Array.from(files).map(
        f =>
          new Promise<string>((res) => {
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
      case 'serif': return 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif'
      case 'mono': return 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
      case 'callig': return '"Segoe Script","Bradley Hand","Comic Sans MS","Apple Chancery",cursive'
      default: return 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, "Noto Sans", "Helvetica Neue", sans-serif'
    }
  }

  return (
    <div className="space-y-2">
      {/* Läge + diskret hjälpknapp för MD */}
      <div className="inline-flex gap-2 items-center">
        <button
          type="button"
          className={`btn ${mode==='md' ? 'btn-active' : ''}`}
          onClick={() => switchMode('md')}
          aria-controls="md-help"
          aria-expanded={mode === 'md' && showHelp ? true : false}
        >
          Markdown
        </button>
        <button
          type="button"
          className={`btn ${mode==='visual' ? 'btn-active' : ''}`}
          onClick={() => switchMode('visual')}
        >
          Visuell
        </button>

        {mode === 'md' && (
          <button
            type="button"
            className="btn text-sm"
            onClick={() => setShowHelp(v => !v)}
            aria-controls="md-help"
            aria-expanded={showHelp}
            title="Snabbguide för Markdown"
          >
            Hjälp
          </button>
        )}
      </div>

      {/* Utfällbar MD-hjälp (diskret) */}
      {mode === 'md' && (
        <div
          id="md-help"
          className={`overflow-hidden transition-[max-height,opacity] duration-200 ${
            showHelp ? 'opacity-100 max-h-[520px]' : 'opacity-0 max-h-0'
          }`}
        >
          <div className="mt-1 rounded border border-app bg-panel p-3 text-sm leading-6 space-y-2">
            <div className="font-semibold">🧭 Snabbguide</div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-muted">Rubriker</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`# H1
## H2
### H3`}
                </pre>
              </div>
              <div>
                <div className="text-muted">Stil</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`**fet**   *kursiv*   ~~genomstruken~~`}
                </pre>
              </div>

              <div>
                <div className="text-muted">Listor</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`- punkt
- en till

1. första
2. andra`}
                </pre>
              </div>
              <div>
                <div className="text-muted">Länk & Bild</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`[text](https://adress)
![alt](https://bild)`}
                </pre>
              </div>

              <div>
                <div className="text-muted">Citat</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`> Ett citat
> över flera rader`}
                </pre>
              </div>
              <div>
                <div className="text-muted">Kod</div>
                <pre className="whitespace-pre-wrap bg-black/20 rounded p-2 text-xs">
{`\`inline\`

\`\`\`
fleradig kod
\`\`\``}
                </pre>
              </div>
            </div>

            <div className="text-xs text-muted">
              Tips: tom rad mellan stycken. Tre streck för avdelare: <code>---</code>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar (endast i visuellt läge) */}
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

          <button type="button" className="btn" onClick={promptLink}>Länk</button>

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
          className="input min-h-[220px]"
          placeholder={placeholder || 'Markdown eller visuellt – välj vad som känns bäst.'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  )
}