// src/types/dompurify.d.ts
declare module 'dompurify' {
  export interface DOMPurifyI {
    sanitize(dirty: string, config?: Record<string, unknown>): string;
  }
  export default function createDOMPurify(win?: Window): DOMPurifyI;
}