// File: src/pages/api/notes/index.ts
// ============================================================
// Notesby — Notes Collection API Route
// GET: List user notes | POST: Create a new blank or titled draft
// ============================================================

import type { APIRoute } from 'astro';
import { listNotesByAuthor, createNoteDraft } from '@/lib/notes';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userNotes = await listNotesByAuthor(user.id);
    return new Response(JSON.stringify({ success: true, notes: userNotes }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to list notes';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let title: string | undefined;
    try {
      const body = await request.json();
      title = body.title;
    } catch {
      // Empty body is acceptable for creating a blank draft
    }

    const note = await createNoteDraft(user.id, title);
    return new Response(JSON.stringify({ success: true, note }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create note draft';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
