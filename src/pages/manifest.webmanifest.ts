// File: src/pages/manifest.webmanifest.ts
// ============================================================
// Notesby — Dynamic Web App Manifest (PWA)
// Dynamically generated manifest based on active sovereign site settings.
// ============================================================

import type { APIRoute } from 'astro';
import { getSiteSettings } from '@/lib/settings';

export const prerender = false;

export const GET: APIRoute = async () => {
  const settings = await getSiteSettings();

  const manifest = {
    name: settings.siteTitle,
    short_name: settings.siteTitle,
    description: settings.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#fbfbfa',
    theme_color: '#075aaa',
    icons: [
      {
        src: settings.favicon,
        sizes: 'any',
        type: settings.favicon.endsWith('.svg')
          ? 'image/svg+xml'
          : settings.favicon.endsWith('.png')
            ? 'image/png'
            : 'image/webp',
      },
      {
        src: settings.appleTouchIcon,
        sizes: '192x192',
        type: settings.appleTouchIcon.endsWith('.png') ? 'image/png' : 'image/webp',
      },
      {
        src: settings.appleTouchIcon,
        sizes: '512x512',
        type: settings.appleTouchIcon.endsWith('.png') ? 'image/png' : 'image/webp',
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
