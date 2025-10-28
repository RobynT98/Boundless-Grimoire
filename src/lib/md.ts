// src/lib/md.d.ts

/**
 * Typdeklarationer för Markdown-hantering i Boundless Grimoire.
 * Ger intellisense för mdToHtml och mdToPlain.
 */

declare module './md' {
  /**
   * Konverterar Markdown eller HTML till sanerad HTML.
   * - Tillåter <span style="..."> (för färg/typsnitt)
   * - Filtrerar bort farliga taggar (script, iframe, etc)
   * - Hoppar över sanering i SSR/CI-miljöer
   */
  export function mdToHtml(mdOrHtml: string): string

  /**
   * Extraherar ren text från Markdown eller HTML.
   * - Tar bort första H1/H2
   * - Komprimerar whitespace
   * - Tar bort ledande titel om den matchar
   */
  export function mdToPlain(mdOrHtml: string, title?: string): string
}