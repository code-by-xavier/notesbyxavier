// File: src/pages/api/subscribers/index.ts
// ============================================================
// Notesby — Subscribers List Endpoint (Authenticated)
// GET: Returns paginated subscriber list for the admin portal.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ locals, cookies }) => {
  let user = locals.user;
  if (!user) {
    const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
    if (sessionToken) {
      const sessionData = await validateSession(sessionToken);
      if (sessionData) {
        user = sessionData.user;
      }
    }
  }

  if (!user) {
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
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch subscribers';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
