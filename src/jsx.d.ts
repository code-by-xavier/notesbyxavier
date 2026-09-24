// File: src/jsx.d.ts
// Ambient JSX definitions for editor TypeScript language servers.
// Zero runtime overhead, 100% type-safe, no 'any'.

declare namespace JSX {
  interface Element {
    [key: string]: unknown;
  }
  interface ElementClass {
    [key: string]: unknown;
  }
  interface IntrinsicElements {
    [elem: string]: Record<string, unknown>;
  }
}
