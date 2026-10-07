// File: src/pages/api/notes/[id]/publish.ts
// ============================================================
// Notesby — Note Publication Toggle API Route
// POST: Toggles note state between 'published' and 'draft'
// ============================================================

import type { APIRoute } from 'astro';
import { togglePublishNote } from '@/lib/notes';
import { json, handleError, unauthorized, readOptionalJson, isUuid } from '@/lib/http';

export const prerender = false;

export const POST: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!isUuid(params.id)) return json({ error: 'Note not found or unauthorized' }, 404);

  try {
    // Body is optional
    const body = await readOptionalJson(request, 1_000);
    const action =
      body.action === 'publish' || body.action === 'unpublish' ? body.action : undefined;

    const note = await togglePublishNote(params.id, user.id, action);
    if (!note) return json({ error: 'Note not found or unauthorized' }, 404);

    return json({
      success: true,
      status: note.status,
      hasUnpublishedChanges: note.hasUnpublishedChanges,
      publishedAt: note.publishedAt,
      note,
    });
  } catch (err: unknown) {
    return handleError('notes:publish', err, 'Failed to toggle publish status');
  }
};
