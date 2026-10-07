// File: src/lib/http.ts
// ============================================================
// Notesby — HTTP helpers for API routes
// JSON responses, bounded body parsing, and safe error handling.
// ============================================================

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

export const DEFAULT_JSON_LIMIT_BYTES = 1_000_000; // 1 MB

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers },
  });
}

export const unauthorized = () => json({ error: 'Unauthorized' }, 401);

/**
 * Convert any thrown value into a response. Known HttpErrors keep their message;
 * everything else is logged server-side and replaced with a generic message so
 * database/driver internals never reach the client.
 */
export function handleError(scope: string, err: unknown, fallback = 'Something went wrong.') {
  if (err instanceof HttpError) {
    return json({ error: err.message }, err.status);
  }
  console.error(`[${scope}]`, err);
  return json({ error: fallback }, 500);
}

/**
 * Read and parse a JSON object body with a hard byte limit (enforced while streaming,
 * so a missing or lying Content-Length cannot bypass it).
 */
export async function readJson(
  request: Request,
  maxBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<Record<string, unknown>> {
  const declared = Number(request.headers.get('content-length'));
  if (Number.isFinite(declared) && declared > maxBytes) {
    throw new HttpError(413, 'Request body is too large.');
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, 'Request body is required.');

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new HttpError(413, 'Request body is too large.');
    }
    chunks.push(value);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON.');
  }

  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new HttpError(400, 'Request body must be a JSON object.');
  }
  return parsed as Record<string, unknown>;
}

/** Like readJson but treats a missing/invalid body as an empty object. */
export async function readOptionalJson(
  request: Request,
  maxBytes = DEFAULT_JSON_LIMIT_BYTES
): Promise<Record<string, unknown>> {
  try {
    return await readJson(request, maxBytes);
  } catch (err) {
    if (err instanceof HttpError && err.status === 413) throw err;
    return {};
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' && UUID_RE.test(value);

/** Postgres unique-violation detection (drizzle wraps driver errors in `cause`). */
export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } } | null;
  return e?.code === '23505' || e?.cause?.code === '23505';
}
