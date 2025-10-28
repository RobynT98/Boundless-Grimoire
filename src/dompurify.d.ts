// src/types/dompurify.d.ts

declare module 'dompurify' {
  // Konfig-typ – håll den lös så vi inte låser dig.
  export type HookEvent =
    | 'uponSanitizeElement'
    | 'uponSanitizeAttribute'
    | 'afterSanitizeAttributes'
    | 'beforeSanitizeElements'
    | 'afterSanitizeElements'
    | 'beforeSanitizeAttributes'
    | 'afterSanitizeAttributes'
    | 'beforeSanitizeShadowDOM'
    | 'uponSanitizeShadowNode';

  export interface Config {
    ALLOWED_TAGS?: string[] | boolean;
    ALLOWED_ATTR?: string[] | boolean;
    FORBID_TAGS?: string[];
    FORBID_ATTR?: string[];
    ALLOW_DATA_ATTR?: boolean;
    ALLOW_UNKNOWN_PROTOCOLS?: boolean;
    USE_PROFILES?: false | { html?: boolean; svg?: boolean; svgFilters?: boolean; mathMl?: boolean };
    [key: string]: unknown; // öppet slut
  }

  export interface DOMPurifyI {
    sanitize(dirty: string | Node, config?: Config): string;
    isSupported: boolean;
    setConfig(config: Config): void;
    addHook(hook: HookEvent | string, hookFn: (...args: any[]) => any): void;
    removeHook?(hook: HookEvent | string): void;
    removeHooks?(hook?: HookEvent | string): void;
  }

  // Vanliga bundlers ger ett singleton-objekt med sanitize:
  const DOMPurify: DOMPurifyI;
  export default DOMPurify;

  // Vissa använder named export sanitize:
  export const sanitize: DOMPurifyI['sanitize'];

  // Stöd för referenser som DOMPurify.Config i typer:
  export namespace DOMPurify {
    // Gör namespace-typen kompatibel med DOMPurify.Config
    // (TS letar efter detta när man skriver DOMPurify.Config)
    export type Config = import('dompurify').Config;
  }
}