// src/turndown.d.ts
declare module 'turndown' {
  export interface TurndownOptions {
    headingStyle?: string;
    codeBlockStyle?: string;
    [key: string]: any;
  }
  class TurndownService {
    constructor(options?: TurndownOptions);
    turndown(input: string): string;
    addRule(name: string, rule: any): this;
    keep(filter: any): this;
    remove(filter: any): this;
    use(plugin: any): this;
  }
  export default TurndownService;
}