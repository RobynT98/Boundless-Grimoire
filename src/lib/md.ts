// src/lib/md.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/** Markdown eller HTML → sanerad HTML. */
export function mdToHtml(mdOrHtml: string): string {
  const raw = mdOrHtml || ''
  // ALLTID parsa med marked, även om råsträngen innehåller HTML
  const html = marked.parse(raw, { async: false }) as string

  // I SSR/CI: ingen DOM -> hoppa sanering (vi visar inte output där)
  if (typeof window === 'undefined') return html

  // Sanera men behåll <span style="..."> (färg/typsnitt)
  const clean = (DOMPurify as any).sanitize(html, {
    ADD_ATTR: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  })
  return clean
}

/** Markdown/HTML → ren text (för snippets). */
export function mdToPlain(mdOrHtml: string, title?: string): string {
  const raw = mdOrHtml || ''
  const html = marked.parse(raw, { async: false }) as string

  if (typeof window === 'undefined') {
    let txt = html.replace(/<[^>]+>/g, ' ')
    txt = txt.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
    if (title) txt = stripLeadingTitle(txt, title)
    return txt
  }

  const div = document.createElement('div')
  div.innerHTML = html
  const firstHeading = div.querySelector('h1, h2')
  if (firstHeading) firstHeading.remove()

  let text = (div.textContent || div.innerText || '')
  text = text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
  if (title) text = stripLeadingTitle(text, title)
  return text
}

function stripLeadingTitle(text: string, title: string): string {
  const t = title.trim()
  if (!t) return text
  const rx = new RegExp('^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[–—:\\-]\\s*', 'i')
  return text.replace(rx, '').trim()
}