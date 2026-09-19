// File: src/pages/api/auth/logout.ts
// ============================================================
// Notesby — Authentication Logout API Endpoint
// Invalidates active session and removes session cookie.
// ============================================================

import type { APIRoute } from 'astro';
import { invalidateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { ROUTES } from '@/links';

export const prerender = false;

export const ALL: APIRoute = async ({ cookies, redirect }) => {
  const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;

  if (sessionToken) {
    await invalidateSession(sessionToken);
  }

  cookies.delete(SESSION_COOKIE_NAME, {
    path: '/',
  });

  return redirect(ROUTES.ADMIN.LOGIN);
};
