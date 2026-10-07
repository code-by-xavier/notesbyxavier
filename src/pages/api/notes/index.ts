// File: src/pages/api/notes/index.ts
// ============================================================
// Notesby — Notes Collection API Route
// GET: List user notes | POST: Create a new blank or titled draft
// ============================================================

import type { APIRoute } from 'astro';
import { listNotesByAuthor, createNoteDraft } from '@/lib/notes';
import { json, handleError, unauthorized, readOptionalJson } from '@/lib/http';
import { optString } from '@/lib/validation';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  try {
    return json({ success: true, notes: await listNotesByAuthor(user.id) });
  } catch (err: unknown) {
    return handleError('notes:list', err, 'Failed to list notes');
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();

  try {
    // Empty body is acceptable for creating a blank draft
    const body = await readOptionalJson(request, 10_000);
    const note = await createNoteDraft(user.id, optString(body, 'title', 255));
    return json({ success: true, note }, 201);
  } catch (err: unknown) {
    return handleError('notes:create', err, 'Failed to create note draft');
  }
};
