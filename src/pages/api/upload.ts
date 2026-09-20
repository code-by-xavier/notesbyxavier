// File: src/pages/api/upload.ts
// ============================================================
// Notesby — Sovereign Image & Asset Upload API Endpoint
// Handles authenticated multipart/form-data uploads with deep MIME
// validation, magic-byte inspection, size limits, collision-free naming,
// and sovereign storage across local, emulator, and Google Cloud Storage.
// ============================================================

import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { uploadMedia } from '@/lib/storage';

export const prerender = false;

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

interface DetectedFormat {
  mimeType: string;
  ext: string;
}

/**
 * Inspects buffer magic bytes, filename extension, and reported MIME type
 * to reliably detect and normalize any image format (PNG, JPEG, WebP, AVIF, GIF, SVG, ICO).
 */
function detectImageFormat(
  buffer: Buffer,
  filename: string,
  reportedMime?: string
): DetectedFormat | null {
  const nameLower = filename.toLowerCase();

  // 1. Check Magic Bytes (deep binary inspection)
  if (buffer.length >= 8) {
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    ) {
      return { mimeType: 'image/png', ext: 'png' };
    }

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return { mimeType: 'image/jpeg', ext: 'jpg' };
    }

    // GIF: GIF87a or GIF89a
    if (buffer.subarray(0, 3).toString('ascii') === 'GIF') {
      return { mimeType: 'image/gif', ext: 'gif' };
    }

    // WebP: RIFF ... WEBP
    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.length >= 12 &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return { mimeType: 'image/webp', ext: 'webp' };
    }

    // AVIF: ....ftypavif or ....ftypavis
    if (
      buffer.subarray(4, 8).toString('ascii') === 'ftyp' &&
      buffer.length >= 12 &&
      (buffer.subarray(8, 12).toString('ascii') === 'avif' ||
        buffer.subarray(8, 12).toString('ascii') === 'avis')
    ) {
      return { mimeType: 'image/avif', ext: 'avif' };
    }

    // ICO: 00 00 01 00
    if (buffer[0] === 0x00 && buffer[1] === 0x00 && buffer[2] === 0x01 && buffer[3] === 0x00) {
      return { mimeType: 'image/x-icon', ext: 'ico' };
    }
  }

  // 2. SVG (text/xml inspection)
  // Check the initial 2048 bytes for SVG tags
  const headerSlice = buffer.subarray(0, Math.min(buffer.length, 2048)).toString('utf8');
  if (
    headerSlice.includes('<svg') ||
    (headerSlice.includes('<?xml') && headerSlice.includes('<svg')) ||
    nameLower.endsWith('.svg')
  ) {
    return { mimeType: 'image/svg+xml', ext: 'svg' };
  }

  // 3. Filename Extension Fallbacks
  if (nameLower.endsWith('.png')) return { mimeType: 'image/png', ext: 'png' };
  if (nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg'))
    return { mimeType: 'image/jpeg', ext: 'jpg' };
  if (nameLower.endsWith('.webp')) return { mimeType: 'image/webp', ext: 'webp' };
  if (nameLower.endsWith('.avif')) return { mimeType: 'image/avif', ext: 'avif' };
  if (nameLower.endsWith('.gif')) return { mimeType: 'image/gif', ext: 'gif' };
  if (nameLower.endsWith('.ico')) return { mimeType: 'image/x-icon', ext: 'ico' };

  // 4. Reported MIME Type Fallbacks
  if (reportedMime) {
    const cleanMime = reportedMime.toLowerCase().trim();
    if (cleanMime === 'image/png') return { mimeType: 'image/png', ext: 'png' };
    if (cleanMime === 'image/jpeg' || cleanMime === 'image/jpg')
      return { mimeType: 'image/jpeg', ext: 'jpg' };
    if (cleanMime === 'image/webp') return { mimeType: 'image/webp', ext: 'webp' };
    if (cleanMime === 'image/avif') return { mimeType: 'image/avif', ext: 'avif' };
    if (cleanMime === 'image/gif') return { mimeType: 'image/gif', ext: 'gif' };
    if (cleanMime === 'image/svg+xml' || cleanMime === 'image/svg')
      return { mimeType: 'image/svg+xml', ext: 'svg' };
    if (
      cleanMime === 'image/x-icon' ||
      cleanMime === 'image/vnd.microsoft.icon' ||
      cleanMime === 'image/ico'
    )
      return { mimeType: 'image/x-icon', ext: 'ico' };
  }

  return null;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file || !(file instanceof File) || file.size === 0) {
      return new Response(JSON.stringify({ error: 'No image file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 1. Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return new Response(
        JSON.stringify({
          error: 'Image exceeds the maximum allowed file size of 5MB.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Read array buffer & deeply inspect format
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const detected = detectImageFormat(buffer, file.name, file.type);
    if (!detected) {
      return new Response(
        JSON.stringify({
          error:
            'Unsupported file format. Please upload a valid PNG, JPEG, WebP, AVIF, GIF, SVG, or ICO image.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Generate clean, collision-free filename
    const timestamp = Date.now();
    const hash = crypto.randomBytes(6).toString('hex');
    const filename = `media-${timestamp}-${hash}.${detected.ext}`;

    // 4. Upload to sovereign storage
    const publicUrl = await uploadMedia(buffer, filename, detected.mimeType);

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        filename,
        mimeType: detected.mimeType,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: err.message || 'Failed to process image upload',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
