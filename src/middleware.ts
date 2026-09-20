// File: src/middleware.ts
// ============================================================
// Notesby — Authentication & Route Guard Middleware
// Enforces setup state, validates sessions, and protects admin routes.
// ============================================================

import { defineMiddleware } from 'astro:middleware';
import { isSetupCompleted, validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { ROUTES } from '@/links';

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  // Root route aliases for quick accessibility
  if (pathname === '/setup') {
    return redirect(ROUTES.ADMIN.SETUP);
  }
  if (pathname === '/login') {
    return redirect(ROUTES.ADMIN.LOGIN);
  }

  // Guard admin routes and onboarding flow
  if (pathname.startsWith('/admin')) {
    const setupDone = await isSetupCompleted();

    // 1. Setup page logic: if already setup, redirect to login
    if (pathname === ROUTES.ADMIN.SETUP) {
      if (setupDone) {
        return redirect(ROUTES.ADMIN.LOGIN);
      }
      return next();
    }

    // If setup is not completed yet, any admin access must route to setup
    if (!setupDone) {
      return redirect(ROUTES.ADMIN.SETUP);
    }

    // 2. Login page logic: if already logged in with valid session, redirect to admin
    if (pathname === ROUTES.ADMIN.LOGIN) {
      const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
      if (sessionToken) {
        const sessionData = await validateSession(sessionToken);
        if (sessionData) {
          return redirect(ROUTES.ADMIN.ROOT);
        }
      }
      return next();
    }

    // 3. Reset password page
    if (pathname === ROUTES.ADMIN.RESET_PASSWORD) {
      return next();
    }

    // 4. Protected admin pages (e.g. /admin, /admin/editor)
    const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return redirect(ROUTES.ADMIN.LOGIN);
    }

    const sessionData = await validateSession(sessionToken);
    if (!sessionData) {
      cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      return redirect(ROUTES.ADMIN.LOGIN);
    }

    locals.user = sessionData.user;
    locals.session = sessionData.session;
  }

  // Guard protected API routes (e.g. /api/notes, /api/upload, /api/settings)
  if (
    pathname.startsWith('/api/notes') ||
    pathname.startsWith('/api/upload') ||
    pathname.startsWith('/api/settings')
  ) {
    const sessionToken = cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!sessionToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const sessionData = await validateSession(sessionToken);
    if (!sessionData) {
      cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    locals.user = sessionData.user;
    locals.session = sessionData.session;
  }

  return next();
});
