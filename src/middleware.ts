// File: src/middleware.ts
// ============================================================
// Notesby — Authentication & Route Guard Middleware
// Enforces setup state, validates sessions, protects admin routes and
// APIs (default-deny), blocks cross-site writes, and sets security headers.
// ============================================================

import { defineMiddleware } from 'astro:middleware';
import type { APIContext, MiddlewareNext } from 'astro';
import { isSetupCompleted, validateSession, SESSION_COOKIE_NAME } from '@/lib/auth';
import { ROUTES } from '@/links';
import { ensureSchema } from '@/db';
import { json } from '@/lib/http';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const MAX_BODY_BYTES = 1_000_000;
const MAX_UPLOAD_BODY_BYTES = 6 * 1024 * 1024;

// API routes reachable without a session. Everything else under /api requires one.
const PUBLIC_API = [
  /^\/api\/auth\/(login|logout|setup)$/,
  /^\/api\/subscribe$/,
  /^\/api\/setup\/health$/,
  /^\/api\/media\/.+/,
];

// Routes that authenticate themselves (upload is open only until first-run setup completes).
const SELF_AUTHENTICATED_API = /^\/api\/upload$/;

/** Lower-cased, percent-decoded, slash-collapsed path used ONLY for guard decisions. */
function normalizePath(pathname: string): string | null {
  try {
    const decoded = decodeURIComponent(pathname)
      .toLowerCase()
      .replace(/\/{2,}/g, '/');
    return decoded.length > 1 ? decoded.replace(/\/+$/, '') : decoded;
  } catch {
    return null;
  }
}

function isCrossSiteWrite(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (origin) {
    let originHost: string;
    try {
      originHost = new URL(origin).host;
    } catch {
      return true;
    }
    const hosts = [request.headers.get('host'), request.headers.get('x-forwarded-host')]
      .filter((h): h is string => !!h)
      .map((h) => h.split(',')[0].trim().toLowerCase());
    return !hosts.includes(originHost.toLowerCase());
  }
  return request.headers.get('sec-fetch-site') === 'cross-site';
}

async function sessionFrom(context: APIContext) {
  const token = context.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const data = await validateSession(token);
  if (!data) context.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
  return data;
}

async function guard(context: APIContext, next: MiddlewareNext, path: string): Promise<Response> {
  const { request, redirect, locals } = context;

  if (path === '/setup') return redirect(ROUTES.ADMIN.SETUP);
  if (path === '/login') return redirect(ROUTES.ADMIN.LOGIN);

  const isApi = path === '/api' || path.startsWith('/api/');
  const isAdmin = path.startsWith('/admin');

  if (isApi && !SAFE_METHODS.has(request.method) && isCrossSiteWrite(request)) {
    return json({ error: 'Cross-site request blocked.' }, 403);
  }

  if (!SAFE_METHODS.has(request.method)) {
    const limit = SELF_AUTHENTICATED_API.test(path) ? MAX_UPLOAD_BODY_BYTES : MAX_BODY_BYTES;
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > limit) {
      return json({ error: 'Request body is too large.' }, 413);
    }
  }

  // ── Admin pages ───────────────────────────────────────────
  if (isAdmin) {
    const setupDone = await isSetupCompleted();

    if (path === ROUTES.ADMIN.SETUP) {
      return setupDone ? redirect(ROUTES.ADMIN.LOGIN) : next();
    }
    if (!setupDone) return redirect(ROUTES.ADMIN.SETUP);

    if (path === ROUTES.ADMIN.LOGIN) {
      return (await sessionFrom(context)) ? redirect(ROUTES.ADMIN.ROOT) : next();
    }
    if (path === ROUTES.ADMIN.RESET_PASSWORD) return next();

    const data = await sessionFrom(context);
    if (!data) return redirect(ROUTES.ADMIN.LOGIN);
    locals.user = data.user;
    locals.session = data.session;
    return next();
  }

  // ── API routes (default-deny) ─────────────────────────────
  if (isApi) {
    if (PUBLIC_API.some((re) => re.test(path))) return next();

    const data = await sessionFrom(context);
    if (data) {
      locals.user = data.user;
      locals.session = data.session;
    } else if (!SELF_AUTHENTICATED_API.test(path)) {
      return json({ error: 'Unauthorized' }, 401);
    }
  }

  return next();
}

function applyHeaders(response: Response, path: string, method: string): Response {
  const isPrivate = path.startsWith('/admin') || path.startsWith('/api/');
  const isMedia = path.startsWith('/api/media/') || path.startsWith('/uploads/');

  try {
    const h = response.headers;
    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'DENY');
    h.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    h.set('Cross-Origin-Opener-Policy', 'same-origin');
    if (!h.has('Content-Security-Policy')) {
      h.set(
        'Content-Security-Policy',
        "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"
      );
    }
    if (import.meta.env.PROD) {
      h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (isPrivate && !isMedia && !h.has('Cache-Control')) {
      h.set('Cache-Control', 'no-store');
    } else if (
      !isPrivate &&
      method === 'GET' &&
      response.status === 200 &&
      !h.has('Cache-Control') &&
      !h.has('Set-Cookie') &&
      (h.get('Content-Type') || '').startsWith('text/html')
    ) {
      // Public reader pages are identical for every visitor; let shared caches absorb bursts.
      h.set('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    }
  } catch {
    // Immutable headers (e.g. a passthrough fetch Response) — skip rather than fail the request.
  }
  return response;
}

export const onRequest = defineMiddleware(async (context, next) => {
  const path = normalizePath(context.url.pathname);
  if (path === null) return new Response('Bad Request', { status: 400 });

  let downstream = false;
  const trackedNext: MiddlewareNext = (...args) => {
    downstream = true;
    return next(...args);
  };

  try {
    await ensureSchema();
    const response = await guard(context, trackedNext, path);
    return applyHeaders(response, path, context.request.method);
  } catch (err) {
    // Errors raised while rendering the page/endpoint belong to Astro's own error handling.
    if (downstream) throw err;
    console.error('[middleware] Guard check failed:', err);
    const isApi = path.startsWith('/api/');
    return applyHeaders(
      isApi
        ? json({ error: 'Service temporarily unavailable.' }, 503, { 'Retry-After': '5' })
        : new Response('Service temporarily unavailable.', {
            status: 503,
            headers: { 'Retry-After': '5', 'Content-Type': 'text/plain; charset=utf-8' },
          }),
      path,
      context.request.method
    );
  }
});
