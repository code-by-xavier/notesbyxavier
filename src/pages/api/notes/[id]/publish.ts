// File: src/pages/api/notes/[id]/publish.ts
// ============================================================
// Notesby — Note Publication Toggle API Route
// POST: Toggles note state between 'published' and 'draft'
// ============================================================

import type { APIRoute } from 'astro';
import { togglePublishNote } from '@/lib/notes';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { id } = params;
  if (!id) {
    return new Response(JSON.stringify({ error: 'Note ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let action: 'publish' | 'unpublish' | undefined;
    try {
      const body = await request.json();
      if (body && (body.action === 'publish' || body.action === 'unpublish')) {
        action = body.action;
      }
    } catch {
      // Body is optional
    }

    const note = await togglePublishNote(id, user.id, action);
    if (!note) {
      return new Response(JSON.stringify({ error: 'Note not found or unauthorized' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: note.status,
        hasUnpublishedChanges: note.hasUnpublishedChanges,
        publishedAt: note.publishedAt,
        note,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to toggle publish status';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
