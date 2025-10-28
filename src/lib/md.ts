// src/lib/md.ts
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Grundinställningar för all markdown
marked.setOptions({
  gfm: true,
  breaks: false,
  headerIds: false,
  mangle: false
})

export const looksLikeHTML = (s: string): boolean =>
  /<\s*[a-z][\s\S]*>/i.test(s)

export function mdToHtml(s: string): string {
  if (!s) return ''
  const html = looksLikeHTML(s) ? s : (marked.parse(s, { async: false }) as string)
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'strong', 'em', 'u', 'span', 'img', 'br', 'hr'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style']
  })
  return clean
}

export function htmlToPlain(html: string): string {
  if (!html) return ''
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  const div = document.createElement('div')
  div.innerHTML = html
  const h = div.querySelector('h1, h2')
  if (h) h.remove()
  return (div.textContent || div.innerText || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function mdToPlain(s: string, title?: string): string {
  const html = mdToHtml(s)
  let text = htmlToPlain(html)
  if (title) {
    const rx = new RegExp(
      '^' + title.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*[–—:\\-]\\s*',
      'i'
    )
    text = text.replace(rx, '').trim()
  }
  return text
}