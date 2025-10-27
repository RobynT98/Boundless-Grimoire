import { useEffect, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import TextStyle from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'

type Mode = 'md' | 'visual'

export default function RichEditor({
  value,
  onChange,
  placeholder = 'Skriv här…'
}: {
  value: string
  onChange: (md: string) => void
  placeholder?: string
}) {
  const [mode, setMode] = useState<Mode>('md')
  const [md, setMd] = useState(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({ openOnClick: false }),
      Image,
      Placeholder.configure({ placeholder }),
      Markdown.configure({ html: false })
    ],
    editorProps: {
      attributes: {
        class:
          'prose prose-invert max-w-none min-h-[220px] p-3 rounded bg-neutral-900'
      }
    },
    content: '',
    autofocus: false,
    onUpdate({ editor }) {
      if (mode === 'visual') {
        const nextMd = (editor.storage as any).markdown.getMarkdown()
        onChange(nextMd)
      }
    }
  })

  // sync in (om parent uppdaterar value)
  useEffect(() => {
    setMd(value)
    if (mode === 'visual' && editor) {
      const parse = (editor.storage as any).markdown?.setMarkdown
      parse?.(value)
    }
  }, [value]) // eslint-disable-line

  function switchMode(next: Mode) {
    if (next === mode) return
    if (next === 'visual' && editor) {
      // MD -> TipTap
      const parse = (editor.storage as any).markdown?.setMarkdown
      parse?.(md)
    } else if (next === 'md' && editor) {
      // TipTap -> MD
      const getMd = (editor.storage as any).markdown?.getMarkdown
      const out = getMd?.() ?? md
      setMd(out)
      onChange(out)
    }
    setMode(next)
  }

  return (
    <div className="space-y-2">
      {/* Växla läge */}
      <div className="inline-flex rounded overflow-hidden border border-app">
        <button
          type="button"
          className={'px-3 py-1 ' + (mode === 'md' ? 'btn-active' : 'btn')}
          onClick={() => switchMode('md')}
        >
          Markdown
        </button>
        <button
          type="button"
          className={'px-3 py-1 ' + (mode === 'visual' ? 'btn-active' : 'btn')}
          onClick={() => switchMode('visual')}
        >
          Visuell
        </button>
      </div>

      {/* Toolbar (visuell) */}
      {mode === 'visual' && editor && (
        <div className="flex flex-wrap gap-1">
          <TBtn on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')}>B</TBtn>
          <TBtn on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')}><i>I</i></TBtn>
          <TBtn on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')}><u>U</u></TBtn>
          <TBtn on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')}>• Lista</TBtn>
          <TBtn on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')}>1. Lista</TBtn>
          <TBtn on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })}>H2</TBtn>

          <input
            type="color"
            className="w-8 h-8 rounded border border-app"
            aria-label="Textfärg"
            onChange={e => editor.chain().focus().setColor(e.target.value).run()}
          />

          <TBtn on={() => {
            const url = prompt('Länkadress (https://)…')
            if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
          }}>Länk</TBtn>

          <TBtn on={() => {
            const url = prompt('Bildadress eller data-URL:')
            if (url) editor.chain().focus().setImage({ src: url }).run()
          }}>Bild</TBtn>
        </div>
      )}

      {/* Editor */}
      {mode === 'md' ? (
        <textarea
          value={md}
          onChange={e => { setMd(e.target.value); onChange(e.target.value) }}
          rows={12}
          className="w-full bg-neutral-900 p-3 rounded"
          placeholder={placeholder}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}

function TBtn({ on, children, active }: { on: () => void; children: any; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={on}
      className={'px-2 py-1 rounded text-sm ' + (active ? 'btn-active' : 'btn')}
    >
      {children}
    </button>
  )
}