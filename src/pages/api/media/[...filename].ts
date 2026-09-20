// File: src/pages/api/media/[...filename].ts
// ============================================================
// Notesby — Sovereign Media Asset Proxy & CDN Endpoint
// Streams media assets from Google Cloud Storage (or local fallback)
// directly through the application port, bypassing cross-origin,
// private bucket 403s, and container port isolation.
// ============================================================

import type { APIRoute } from 'astro';
import fs from 'node:fs';
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

export const GET: APIRoute = async ({ params }) => {
  const rawFilename = params.filename;

  if (!rawFilename) {
    return new Response('Not Found', { status: 404 });
  }

  // Security: Prevent directory traversal
  const filename = path.basename(rawFilename);
  if (filename !== rawFilename || filename.includes('..')) {
    return new Response('Invalid media filename', { status: 400 });
  }

  const ext = path.extname(filename).toLowerCase();
  const defaultMime = MIME_MAP[ext] || 'application/octet-stream';

  // 1. Attempt to stream from Google Cloud Storage
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);
    const [exists] = await file.exists();

    if (exists) {
      const [metadata] = await file.getMetadata();
      const [buffer] = await file.download();

      const contentType = metadata.contentType || defaultMime;

      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (err: any) {
    console.warn(`[Media Proxy] GCS read attempt for "${filename}" failed: ${err.message}`);
  }

  // 2. Fallback to local filesystem (public/uploads/)
  const localFilePath = path.join(process.cwd(), 'public', 'uploads', filename);
  if (fs.existsSync(localFilePath)) {
    try {
      const buffer = fs.readFileSync(localFilePath);
      return new Response(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': defaultMime,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch {
      return new Response('Failed to read local media file', { status: 500 });
    }
  }

  return new Response('Asset Not Found', { status: 404 });
};
