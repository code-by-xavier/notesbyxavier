// File: src/pages/api/media/[...filename].ts
// ============================================================
// Notesby — Sovereign Media Asset Proxy & CDN Endpoint
// Streams media assets from Google Cloud Storage (or local fallback)
// directly through the application port, bypassing cross-origin,
// private bucket 403s, and container port isolation.
// ============================================================

import type { APIRoute } from 'astro';
import fs from 'node:fs/promises';
import path from 'node:path';
import { storage } from '@/lib/storage';

export const prerender = false;

const bucketName = process.env.GCS_BUCKET_NAME || 'notesby-media';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// Letters, digits, dot, dash, underscore only; must start alphanumeric. No separators or traversal.
const SAFE_FILENAME = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;

// Uploaded names are content-addressed and unique, so responses are immutable.
// `sandbox` + `default-src 'none'` stop any script inside an SVG from running if opened directly.
const MEDIA_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'X-Content-Type-Options': 'nosniff',
  'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  'Cross-Origin-Resource-Policy': 'cross-origin',
} as const;

function mediaResponse(data: Buffer, contentType: string): Response {
  return new Response(new Uint8Array(data), {
    status: 200,
    headers: {
      ...MEDIA_HEADERS,
      'Content-Type': contentType,
      'Content-Length': String(data.length),
    },
  });
}

export const GET: APIRoute = async ({ params }) => {
  const filename = params.filename;

  if (!filename || !SAFE_FILENAME.test(filename)) {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  const contentType = MIME_MAP[path.extname(filename).toLowerCase()];
  if (!contentType) {
    return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }

  // 1. Google Cloud Storage (single round trip; a missing object simply throws)
  try {
    const [buffer] = await storage.bucket(bucketName).file(filename).download();
    return mediaResponse(buffer, contentType);
  } catch (err: unknown) {
    const code = (err as { code?: number })?.code;
    if (code !== 404) {
      const message = err instanceof Error ? err.message : String(err);
      console.warn(`[Media Proxy] GCS read for "${filename}" failed: ${message}`);
    }
  }

  // 2. Local filesystem fallback (public/uploads/)
  try {
    const buffer = await fs.readFile(path.join(process.cwd(), 'public', 'uploads', filename));
    return mediaResponse(buffer, contentType);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException)?.code !== 'ENOENT') {
      console.error(`[Media Proxy] Local read for "${filename}" failed:`, err);
      return new Response('Failed to read media file', { status: 500 });
    }
  }

  // 3. Graceful fallback for missing or stale media (e.g. from container restarts):
  // redirect to a default asset instead of breaking <img> tags with a 404.
  const fallbackAsset = filename.toLowerCase().includes('avatar')
    ? '/images/avatar-placeholder.svg'
    : '/images/notesby-logo-black.svg';

  return new Response(null, {
    status: 307,
    headers: { Location: fallbackAsset, 'Cache-Control': 'no-cache' },
  });
};
