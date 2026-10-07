// File: src/pages/api/subscribers/export.ts
// ============================================================
// Notesby — Subscribers CSV Export Endpoint (Authenticated)
// GET: Returns a CSV download of the email subscriber list.
// Cells are quoted and neutralized against spreadsheet formula injection.
// ============================================================

import type { APIRoute } from 'astro';
import { db } from '@/db';
import { subscribers } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { handleError, unauthorized } from '@/lib/http';

export const prerender = false;

function csvCell(value: string): string {
  // Cells starting with these characters are interpreted as formulas by spreadsheet apps.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) return unauthorized();

  try {
    const list = await db
      .select({
        email: subscribers.email,
        source: subscribers.source,
        createdAt: subscribers.createdAt,
      })
      .from(subscribers)
      .orderBy(desc(subscribers.createdAt));

    const rows = list.map((s) =>
      [csvCell(s.email), csvCell(s.source), csvCell(new Date(s.createdAt).toISOString())].join(',')
    );
    const csv = ['Email,Source,Subscribed At', ...rows].join('\r\n') + '\r\n';
    const filename = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    return handleError('subscribers:export', err, 'Export failed');
  }
};
