// File: src/pages/api/setup/health.ts
// ============================================================
// Notesby — Setup Health Check API Endpoint
// Real-time DB and GCS connectivity probe used by the setup
// wizard Step 1 "Cloud Connection" panel. Returns JSON status
// so the wizard can lock/unlock progression gated on live checks.
// ============================================================

import type { APIRoute } from 'astro';
import { db, ensureSchema } from '@/db';
import { siteSettings } from '@/db/schema';
import { isSetupCompleted } from '@/lib/auth';
import { storage } from '@/lib/storage';

export const prerender = false;

export const GET: APIRoute = async () => {
  let dbOk = false;
  let storageOk = false;
  let alreadySetup = false;
  let dbError: string | null = null;
  let storageError: string | null = null;

  // --- Database Connectivity Check ---
  try {
    await ensureSchema();
    await db.select({ id: siteSettings.id }).from(siteSettings).limit(1);
    dbOk = true;
    alreadySetup = await isSetupCompleted();
  } catch (err: unknown) {
    dbError = err instanceof Error ? err.message : 'Unknown database error';
    console.warn('[Setup Health] DB check failed:', dbError);
  }

  // --- Google Cloud Storage Connectivity Check ---
  try {
    const bucketName = process.env.GCS_BUCKET_NAME || 'notesby-media';
    const bucket = storage.bucket(bucketName);
    await bucket.exists();
    storageOk = true;
  } catch (err: unknown) {
    storageError = err instanceof Error ? err.message : 'Unknown storage error';
    console.warn('[Setup Health] GCS check failed:', storageError);
  }

  const status = dbOk && storageOk ? 200 : 503;

  return new Response(
    JSON.stringify({
      db: dbOk,
      storage: storageOk,
      alreadySetup,
      errors: {
        ...(dbError ? { db: dbError } : {}),
        ...(storageError ? { storage: storageError } : {}),
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
};
