// File: src/lib/storage.ts
// ============================================================
// Notesby — Sovereign Google Cloud Storage (GCS) Client
// Turnkey asset storage supporting both local GCS emulation (fake-gcs-server)
// and production Google Cloud Storage (GCS + Cloud Run ADC) with
// graceful local filesystem fallback and sovereign media proxy.
// ============================================================

import 'dotenv/config';
import { Storage } from '@google-cloud/storage';
import fs from 'node:fs';
import path from 'node:path';

// Storage Configuration
const emulatorHost = process.env.STORAGE_EMULATOR_HOST;
const bucketName = process.env.GCS_BUCKET_NAME || 'notesby-media';
const projectId = process.env.GCP_PROJECT_ID || (emulatorHost ? 'notesby-local' : undefined);

// Note: When process.env.STORAGE_EMULATOR_HOST is present, @google-cloud/storage's
// internal constructor overrides baseUrl without the '/storage/v1' path, causing
// fake-gcs-server REST requests to hit /b instead of /storage/v1/b (returning 404).
// Clearing the env var and supplying apiEndpoint explicitly ensures the client correctly
// resolves the standard /storage/v1 endpoint.
if (process.env.STORAGE_EMULATOR_HOST) {
  delete process.env.STORAGE_EMULATOR_HOST;
}

// Initialize Google Cloud Storage SDK
export const storage = new Storage({
  ...(emulatorHost ? { apiEndpoint: emulatorHost } : {}),
  ...(projectId ? { projectId } : {}),
});

let isBucketVerified = false;

/**
 * Ensures the target GCS bucket exists and is configured for public read access.
 */
export async function ensureBucket(): Promise<boolean> {
  if (isBucketVerified) return true;

  try {
    const bucket = storage.bucket(bucketName);
    const [exists] = await bucket.exists();
    if (!exists) {
      await bucket.create({
        location: process.env.GCS_LOCATION || 'US-CENTRAL1',
      });
      console.log(`📦 [GCS Storage] Created bucket: "${bucketName}"`);
    }

    isBucketVerified = true;
    return true;
  } catch (err: any) {
    console.warn(`⚠️  [GCS Storage] Bucket check failed (${err.message}).`);
    return false;
  }
}

/**
 * Compute the public URL for an asset stored in GCS or local storage.
 */
export function getPublicUrl(filename: string): string {
  // 1. If explicit public prefix is set (e.g. CDN or reverse proxy)
  if (process.env.GCS_PUBLIC_URL) {
    const base = process.env.GCS_PUBLIC_URL.replace(/\/$/, '');
    return `${base}/${bucketName}/${filename}`;
  }

  // 2. In production Cloud Run without custom CDN, use standard GCS public URL
  if (!emulatorHost && process.env.K_SERVICE) {
    return `https://storage.googleapis.com/${bucketName}/${filename}`;
  }

  // 3. In local development or unified sovereign media proxy mode:
  // Route through the application's own port to eliminate CORS and port-forwarding issues
  return `/api/media/${filename}`;
}

/**
 * Upload a media file buffer to Google Cloud Storage (or local emulator).
 * Falls back to local media endpoint if GCS is unavailable.
 */
export async function uploadMedia(
  data: Buffer | ArrayBuffer,
  filename: string,
  mimeType: string
): Promise<string> {
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);

  try {
    // Attempt GCS upload (emulator or production)
    await ensureBucket();
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: mimeType,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });

    const publicUrl = getPublicUrl(filename);
    console.log(`✅ [GCS Storage] Uploaded "${filename}" (${buffer.length} bytes) -> ${publicUrl}`);
    return publicUrl;
  } catch (err: any) {
    console.warn(
      `⚠️  [GCS Storage] Upload failed (${err.message}). Falling back to local media endpoint (/api/media)...`
    );

    // Fallback: Save to local public/uploads directory
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    return `/api/media/${filename}`;
  }
}
