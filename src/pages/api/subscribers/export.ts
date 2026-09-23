// File: src/pages/api/subscribers/export.ts
// ============================================================
// Notesby — Subscribers CSV Export Endpoint (Authenticated)
// GET: Streams a full CSV download of the email subscriber list.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const list = await db
      .select({
        email: subscribers.email,
        source: subscribers.source,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));

    // Build CSV
    const header = 'Email,Source,Subscribed At\n';
    const rows = list
      .map((s) => {
        const date = new Date(s.createdAt).toISOString();
        return `${s.email},${s.source},${date}`;
      })
      .join('\n');

    const csv = header + rows;
    const filename = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    return new Response(`Export failed: ${err.message}`, { status: 500 });
  }
};
