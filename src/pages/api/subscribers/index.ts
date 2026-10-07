// File: src/pages/api/subscribers/index.ts
// ============================================================
// Notesby — Subscribers List Endpoint (Authenticated)
// GET: Returns the subscriber list for the admin portal.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { json, handleError, unauthorized } from '@/lib/http';

export const prerender = false;

const MAX_LISTED = 10_000;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return unauthorized();

  try {
    const list = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        source: subscribers.source,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt))
      .limit(MAX_LISTED);

    return json({ success: true, subscribers: list, total: list.length });
  } catch (err: unknown) {
    return handleError('subscribers:list', err, 'Failed to fetch subscribers');
  }
};
