// src/lib/md.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

/**
 * Renderar Markdown till HTML och sanerar det.
 * - Behåller <span style="..."> för färg/typsnitt.
 * - Tillåter länkar och bilder.
 * - Fungerar även utan DOM (t.ex. i CI/SSR), då utan sanitering.
 */
export function mdToHtml(mdOrHtml: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)

  // marked v12: `headerIds` är borttagen, så vi skickar bara minimala options
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

  // Om vi inte kör i browser (t.ex. CI) → hoppa över DOMPurify
  if (typeof window === 'undefined') {
    return html
  }

  // Sanera HTML men tillåt <span style="..."> för färg/typsnitt
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ['style'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  } as DOMPurify.Config)

  return clean
}

/**
 * Markdown/HTML → ren text (för snippets, listor osv).
 * Tar bort första H1/H2 och komprimerar whitespace.
 */
export function mdToPlain(mdOrHtml: string, title?: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

  // SSR/CI-fall: förenklad strip utan DOM
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

  let text = div.textContent || div.innerText || ''
  text = text.replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
  if (title) text = stripLeadingTitle(text, title)
  return text
}

/**
 * Tar bort inledande titel (om den matchar rubriken i anteckningen).
 * Exempel: "Ingefära – egenskaper..." → "egenskaper..."
 */
function stripLeadingTitle(text: string, title: string): string {
  const t = title.trim()
  if (!t) return text
  const rx = new RegExp(
    '^' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[–—:\\-]\\s*',
    'i'
  )
  return text.replace(rx, '').trim()
}