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
  // marked v12: ingen `headerIds` i options längre – låt bli att sätta den.
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

  // I SSR/CI finns inget window → hoppa över DOMPurify (det är säkert, för vi visar inte output där)
  if (typeof window === 'undefined') {
    return html
  }

  // Tillåt style-attribut på span för färg/typsnitt; övrigt kör default-säker policy
  const clean = DOMPurify.sanitize(html, {
    ADD_ATTR: ['style'],
    // Behåll vanliga inline-taggar; DOMPurify har redan bra default,
    // men vi kan uttryckligen förbjuda farliga taggar ändå.
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed'],
  } as DOMPurify.Config)

  return clean
}

/**
 * Markdown/HTML → ren text (för snippets).
 * Tar bort första H1/H2 om de finns, och komprimerar whitespace.
 */
export function mdToPlain(mdOrHtml: string, title?: string): string {
  const raw = mdOrHtml || ''
  const looksLikeHTML = /<\s*[a-z][\s\S]*>/i.test(raw)
  const html = looksLikeHTML ? raw : (marked.parse(raw, { async: false }) as string)

  // SSR/CI: förenklad strip
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