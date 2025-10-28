// src/lib/md.ts
import { marked } from 'marked'
// @ts-ignore – installera gärna: npm i dompurify
import DOMPurify from 'dompurify'

// Märk upp EN gång – samma options överallt
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false, // vi genererar inte id:n i listkort
  mangle: false
})

export const looksLikeHTML = (s: string) => /<\s*[a-z][\s\S]*>/i.test(s)

export function mdToHtml(s: string): string {
  const html = looksLikeHTML(s) ? s : (marked.parse(s, { async: false }) as string)
  // Sanera – skydda mot XSS, men tillåt span style
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_ATTR: ['href','src','alt','title','style'],
    ALLOWED_TAGS: ['a','p','h1','h2','h3','h4','h5','h6','ul','ol','li','blockquote','pre','code','strong','em','u','span','img','br','hr']
  })
  return clean
}

export function htmlToPlain(html: string): string {
  // Fallback utan DOM
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = html
  // Ta bort första rubriken för snygg snippet
  const h = div.querySelector('h1, h2')
  if (h) h.remove()
  return (div.textContent || div.innerText || '').replace(/\u00A0/g, ' ').replace(/\s+/g, ' ').trim()
}

export function mdToPlain(mdorhtml: string, title?: string): string {
  const html = mdToHtml(mdorhtml)
  let text = htmlToPlain(html)
  if (title) {
    const rx = new RegExp('^' + title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[–—:\\-]\\s*', 'i')
    text = text.replace(rx, '').trim()
  }
  return text
}