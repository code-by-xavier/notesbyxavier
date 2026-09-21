// File: src/pages/uploads/[...filename].ts
// ============================================================
// Notesby — Sovereign Media Fallback Route
// Resolves legacy or local /uploads/... asset requests by streaming
// directly from GCS or local disk with proper content headers.
// ============================================================

import type { APIRoute } from 'astro';
import { GET as mediaHandler } from '@/pages/api/media/[...filename]';

export const prerender = false;

export const GET: APIRoute = async (context) => {
  return mediaHandler(context);
};
