// File: src/pages/api/subscribers/index.ts
// ============================================================
// Notesby — Subscribers List Endpoint (Authenticated)
// GET: Returns paginated subscriber list for the admin portal.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const list = await db
      .select({
        id: subscribers.id,
        email: subscribers.email,
        source: subscribers.source,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));

    return new Response(JSON.stringify({ success: true, subscribers: list, total: list.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Failed to fetch subscribers' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
