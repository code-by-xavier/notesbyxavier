// File: src/pages/api/upload.ts
// ============================================================
// Notesby — Sovereign Image & Asset Upload API Endpoint
// Handles multipart/form-data uploads with magic-byte format detection
// (client-reported names and MIME types are never trusted), SVG active-content
// rejection, size limits, collision-free naming, and sovereign storage.
// Open only until first-run setup completes; afterwards requires a session.
// ============================================================

import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { uploadMedia } from '@/lib/storage';
import { isSetupCompleted } from '@/lib/auth';
import { json, handleError, unauthorized, HttpError } from '@/lib/http';
import { rateLimit, tooManyRequests, clientKey } from '@/lib/rate-limit';

export const prerender = false;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface DetectedFormat {
  mimeType: string;
  ext: string;
}

const ascii = (buf: Buffer, start: number, end: number) =>
  buf.subarray(start, end).toString('latin1');

// Anything that can execute script or pull in external resources when an SVG is opened directly.
const UNSAFE_SVG =
  /<\s*(script|foreignObject|iframe|object|embed|animate|set|use|image)\b|\son[a-z]+\s*=|javascript:|data:text\/html|<!ENTITY|<!DOCTYPE[^>]*\[/i;

function detectSvg(buffer: Buffer): DetectedFormat | null {
  // Only inspect text-sized input, strip BOM, and require an <svg> root near the start.
  if (buffer.length > 1024 * 1024) return null;
  const text = buffer.toString('utf8').replace(/^﻿/, '');
  const head = text.slice(0, 2048);
  if (
    !/^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE\s+svg[^>]*>\s*)?<svg[\s>]/i.test(head)
  ) {
    return null;
  }
  if (UNSAFE_SVG.test(text)) return null;
  return { mimeType: 'image/svg+xml', ext: 'svg' };
}

/**
 * Detects the real image format from file content. Extension and reported
 * MIME type are intentionally ignored.
 */
function detectImageFormat(buffer: Buffer): DetectedFormat | null {
  if (buffer.length >= 12) {
    if (
      buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    ) {
      return { mimeType: 'image/png', ext: 'png' };
    }
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', ext: 'jpg' };
    }
    const gifSig = ascii(buffer, 0, 6);
    if (gifSig === 'GIF87a' || gifSig === 'GIF89a') return { mimeType: 'image/gif', ext: 'gif' };
    if (ascii(buffer, 0, 4) === 'RIFF' && ascii(buffer, 8, 12) === 'WEBP') {
      return { mimeType: 'image/webp', ext: 'webp' };
    }
    if (ascii(buffer, 4, 8) === 'ftyp' && ['avif', 'avis'].includes(ascii(buffer, 8, 12))) {
      return { mimeType: 'image/avif', ext: 'avif' };
    }
    if (buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0) {
      return { mimeType: 'image/x-icon', ext: 'ico' };
    }
  }
  return detectSvg(buffer);
}

export const POST: APIRoute = async ({ request, locals, clientAddress }) => {
  try {
    const user = locals.user;
    const setupDone = await isSetupCompleted();

    // Once setup is completed, uploads strictly require an authenticated admin session
    if (setupDone && !user) return unauthorized();

    const limit = rateLimit(
      `upload:${user?.id ?? clientKey(() => clientAddress)}`,
      user ? 60 : 10,
      60 * 1000
    );
    if (!limit.ok) return tooManyRequests(limit.retryAfterSeconds);

    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_FILE_SIZE_BYTES + 512 * 1024) {
      throw new HttpError(413, 'Image exceeds the maximum allowed file size of 5MB.');
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new HttpError(400, 'Request must be multipart/form-data.');
    }

    const file = formData.get('image') || formData.get('file');
    if (!(file instanceof File) || file.size === 0) {
      throw new HttpError(400, 'No image file uploaded');
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new HttpError(413, 'Image exceeds the maximum allowed file size of 5MB.');
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = detectImageFormat(buffer);
    if (!detected) {
      throw new HttpError(
        400,
        'Unsupported or unsafe file. Please upload a valid PNG, JPEG, WebP, AVIF, GIF, ICO, or script-free SVG image.'
      );
    }

    const filename = `media-${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${detected.ext}`;
    const publicUrl = await uploadMedia(buffer, filename, detected.mimeType);

    return json({ success: true, url: publicUrl, filename, mimeType: detected.mimeType }, 201);
  } catch (err: unknown) {
    return handleError('upload', err, 'Failed to process image upload');
  }
};
