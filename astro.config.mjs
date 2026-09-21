// File: astro.config.mjs
// ============================================================
// Notesby — Astro Configuration
// Centralized SCSS abstracts injection and path aliases.
// ============================================================

import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));
const configPath = fileURLToPath(new URL('./notes.config.ts', import.meta.url));

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://notesbyxavier.com',
  output: 'static',
  security: {
    checkOrigin: false,
  },
  adapter: node({
    mode: 'standalone',
  }),
  integrations: [mdx(), sitemap()],
  markdown: {
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
  vite: {
    resolve: {
      alias: {
        '@': srcDir,
        '@config': configPath,
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: (content, id) => {
            const normalizedId = id.replace(/\\/g, '/');
            // We do not inject into abstract files themselves or node_modules
            if (
              normalizedId.includes('styles/abstracts') ||
              normalizedId.includes('node_modules')
            ) {
              return content;
            }
            if (/@use\s+['"].*(?:abstracts)/.test(content)) {
              return content;
            }
            return `@use "@/styles/abstracts" as ui;\n${content}`;
          },
        },
      },
    },
  },
});
