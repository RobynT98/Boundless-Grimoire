// src/lib/md.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Konverterar Markdown/HTML till HTML.
 * - Tillåter <span style="..."> (färg/typsnitt)
 * - Filtrerar farliga taggar.
 * - Hoppar över sanering i SSR/CI (ingen DOM där ändå).
 */
export function mdToHtml(mdOrHtml: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

  if (typeof window === 'undefined') {
    return html
  }

  // DomPurify-sanering (behåll style på span)
  const clean = (DOMPurify as any).sanitize(html, {
    ADD_ATTR: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  })
  return clean
}

/**
 * Markdown/HTML → ren text (snippets).
 * - Plockar bort första H1/H2
 * - Komprimerar whitespace
 * - Valfritt: strippar ledande titelprefix
 */
export function mdToPlain(mdOrHtml: string, title?: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

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