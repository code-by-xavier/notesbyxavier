// File: src/pages/api/notes/[id].ts
// ============================================================
// Notesby — Individual Note Operations API Route
// GET: Fetch note | PUT: Auto-save / Update note | DELETE: Remove note
// ============================================================

import type { APIRoute } from 'astro';
import { getNoteById, updateNote, deleteNote } from '@/lib/notes';
import { json, handleError, unauthorized, readJson, isUuid } from '@/lib/http';
import { parseNoteUpdate } from '@/lib/validation';

export const prerender = false;

// Auto-save sends full note bodies; allow room above the global default.
const MAX_NOTE_BODY_BYTES = 2_000_000;

export const GET: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!isUuid(params.id)) return json({ error: 'Note not found' }, 404);

  try {
    const note = await getNoteById(params.id, user.id);
    if (!note) return json({ error: 'Note not found' }, 404);
    return json({ success: true, note });
  } catch (err: unknown) {
    return handleError('notes:get', err, 'Failed to fetch note');
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!isUuid(params.id)) return json({ error: 'Note not found' }, 404);

  try {
    const input = parseNoteUpdate(await readJson(request, MAX_NOTE_BODY_BYTES));
    const updated = await updateNote(params.id, user.id, input);
    if (!updated) return json({ error: 'Note not found or unauthorized' }, 404);
    return json({ success: true, note: updated });
  } catch (err: unknown) {
    return handleError('notes:update', err, 'Failed to update note');
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  const user = locals.user;
  if (!user) return unauthorized();
  if (!isUuid(params.id)) return json({ error: 'Note not found' }, 404);

  try {
    const deleted = await deleteNote(params.id, user.id);
    if (!deleted) return json({ error: 'Note not found or unauthorized' }, 404);
    return json({ success: true, message: 'Note deleted' });
  } catch (err: unknown) {
    return handleError('notes:delete', err, 'Failed to delete note');
  }
};
