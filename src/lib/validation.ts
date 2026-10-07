// File: src/lib/validation.ts
// ============================================================
// Notesby — Input validation primitives
// Strict, allow-list based validators shared by API routes.
// ============================================================

import { HttpError } from '@/lib/http';
import { notesConfig } from '@config';

// Deliberately conservative: no quotes, angle brackets, commas, or whitespace.
const EMAIL_RE =
  /^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function isValidEmail(value: string): boolean {
  return value.length <= 254 && EMAIL_RE.test(value);
}

/** Absolute http(s) URL → normalized string, otherwise null. */
export function normalizeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

/** http(s) URL or same-site absolute path (not protocol-relative). */
export function isSafeMediaRef(value: string): boolean {
  if (value.startsWith('/')) return !value.startsWith('//') && !value.includes('\\');
  return normalizeHttpUrl(value) !== null;
}

/** Schemes safe to emit in rendered Markdown links. */
export function isSafeLinkHref(href: string): boolean {
  // Browsers ignore control characters/whitespace inside the scheme.
  // eslint-disable-next-line no-control-regex
  const compact = href.replace(/[\u0000- ]/g, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact)) return /^(https?|mailto|tel):/i.test(compact);
  return !compact.startsWith('//') || /^\/\/[^/]/.test(compact);
}

export function isSafeImageSrc(src: string): boolean {
  // eslint-disable-next-line no-control-regex
  const compact = src.replace(/[\u0000- ]/g, '');
  if (/^[a-z][a-z0-9+.-]*:/i.test(compact)) return /^https?:/i.test(compact);
  return true;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Optional string field: undefined if absent, throws HttpError on wrong type/length. */
export function optString(
  body: Record<string, unknown>,
  key: string,
  maxLength: number
): string | undefined {
  const value = body[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') throw new HttpError(400, `"${key}" must be a string.`);
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new HttpError(400, `"${key}" must be at most ${maxLength} characters.`);
  }
  return trimmed;
}

export interface NoteUpdateInput {
  title?: string;
  subtitle?: string;
  category?: string;
  content?: string;
  excerpt?: string;
  tags?: string[];
  coverImage?: string;
}

export const MAX_NOTE_CONTENT_CHARS = 500_000;

export function allowedCategories(): string[] {
  const configured = notesConfig.categories?.map((c) => c.name) ?? [];
  return configured.length > 0 ? configured : ['Essays', 'Op-Eds', 'Field Notes'];
}

/** Validate an untrusted note-update payload into a typed, bounded object. */
export function parseNoteUpdate(body: Record<string, unknown>): NoteUpdateInput {
  const out: NoteUpdateInput = {};

  const title = optString(body, 'title', 255);
  if (title !== undefined) out.title = title;

  const subtitle = optString(body, 'subtitle', 1000);
  if (subtitle !== undefined) out.subtitle = subtitle;

  const excerpt = optString(body, 'excerpt', 2000);
  if (excerpt !== undefined) out.excerpt = excerpt;

  if (body.category !== undefined) {
    if (typeof body.category !== 'string' || !allowedCategories().includes(body.category)) {
      throw new HttpError(400, 'Unknown category.');
    }
    out.category = body.category;
  }

  if (body.content !== undefined) {
    if (typeof body.content !== 'string') throw new HttpError(400, '"content" must be a string.');
    if (body.content.length > MAX_NOTE_CONTENT_CHARS) {
      throw new HttpError(413, 'Note content is too large.');
    }
    out.content = body.content;
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.length > 30) {
      throw new HttpError(400, '"tags" must be an array of at most 30 strings.');
    }
    const tags = body.tags.map((t) => {
      if (typeof t !== 'string' || t.trim().length === 0 || t.trim().length > 50) {
        throw new HttpError(400, 'Each tag must be a non-empty string of at most 50 characters.');
      }
      return t.trim();
    });
    out.tags = Array.from(new Set(tags));
  }

  if (body.coverImage !== undefined && body.coverImage !== null) {
    if (typeof body.coverImage !== 'string') {
      throw new HttpError(400, '"coverImage" must be a string.');
    }
    const cover = body.coverImage.trim();
    if (cover.length > 2048 || (cover !== '' && !isSafeMediaRef(cover))) {
      throw new HttpError(400, '"coverImage" must be an http(s) URL or a site-relative path.');
    }
    out.coverImage = cover;
  }

  return out;
}
