// File: src/lib/notes.ts
// ============================================================
// Notesby — Note Repository & Publishing Utilities
// Type-safe queries, slug generation, reading time calculation,
// and publishing helpers for Notesby Studio.
// ============================================================

import { eq, desc, and } from 'drizzle-orm';
import readingTime from 'reading-time';
import { marked } from 'marked';
import { getCollection } from 'astro:content';
import { db } from '@/db';
import { notes, type Note, type NewNote } from '@/db/schema';

export interface NoteCardItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description: string;
  pubDate: Date | string;
  category: string;
  tags?: string[];
  readingTime: string;
  coverImage?: string | null;
}

export interface NoteHeading {
  depth: number;
  slug: string;
  text: string;
}

/**
 * Generate a clean, URL-safe slug from a title string
 */
export function generateSlug(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return base || `note-${Date.now().toString(36)}`;
}

/**
 * Calculate estimated reading time string from Markdown/prose content
 */
export function estimateReadingTime(content: string): string {
  if (!content || !content.trim()) return '1 min read';
  const stats = readingTime(content);
  return stats.text || '1 min read';
}

/**
 * Strips Markdown syntax to return clean, human-readable plain text for excerpts/cards.
 * Properly converts Markdown links [label](url) to just label, removes images, code fences,
 * HTML tags, and styling markers so URLs never leak into plain text teasers.
 */
export function stripMarkdownToPlainText(text: string): string {
  if (!text) return '';
  return (
    text
      // Remove fenced code blocks
      .replace(/```[\s\S]*?```/g, '')
      // Inline code: `code` -> code
      .replace(/`([^`]+)`/g, '$1')
      // Remove image embeds: ![alt](url) -> ''
      .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
      // Markdown links: [label](url) -> label
      .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      // Remove HTML tags: <tag> -> ''
      .replace(/<[^>]*>/g, '')
      // Remove markdown headers, blockquotes, list markers at start of lines
      .replace(/^([#>\s*-]|\d+\.)+\s+/gm, '')
      // Remove bold, italic, strikethrough delimiters
      .replace(/[*_~]/g, '')
      // Collapse multiple whitespace/newlines into a single space
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Parse Markdown string into safe HTML with automatic slugged headings for TOC
 */
export function parseMarkdown(content: string): { html: string; headings: NoteHeading[] } {
  const headings: NoteHeading[] = [];
  const renderer = new marked.Renderer();

  renderer.heading = function ({ text, depth }: { text: string; depth: number }) {
    const rawText = text.replace(/<[^>]*>/g, '').trim();
    const slug = generateSlug(rawText);
    headings.push({ depth, slug, text: rawText });
    return `<h${depth} id="${slug}">${text}</h${depth}>`;
  };

  let html = (marked.parse(content || '', { renderer, async: false }) as string) || '';

  // Ensure any existing HTML headings without IDs receive slugs and are tracked for TOC
  const headingRegex = /<h([1-6])([^>]*)>(.*?)<\/h\1>/gi;
  html = html.replace(headingRegex, (match, depthStr, attrs, text) => {
    const depth = parseInt(depthStr, 10);
    const rawText = text.replace(/<[^>]*>/g, '').trim();
    if (!rawText) return match;

    const idMatch = attrs.match(/id="([^"]+)"/);
    const slug = idMatch ? idMatch[1] : generateSlug(rawText);

    if (!headings.some((h) => h.slug === slug)) {
      headings.push({ depth, slug, text: rawText });
    }

    if (!attrs.includes('id=')) {
      return `<h${depth} id="${slug}"${attrs}>${text}</h${depth}>`;
    }
    return match;
  });

  return { html, headings };
}

/**
 * List all notes authored by a given user
 */
export async function listNotesByAuthor(authorId: string): Promise<Note[]> {
  return db.select().from(notes).where(eq(notes.authorId, authorId)).orderBy(desc(notes.updatedAt));
}

/**
 * List all published notes for public readership
 */
export async function listPublishedNotes(): Promise<Note[]> {
  try {
    return await db
      .select()
      .from(notes)
      .where(eq(notes.status, 'published'))
      .orderBy(desc(notes.publishedAt), desc(notes.createdAt));
  } catch (err) {
    console.warn('[Notesby] Could not query published notes from database:', err);
    return [];
  }
}

/**
 * Retrieve unified feed notes combining PostgreSQL published writings & sample content
 */
export async function getAllFeedNotes(): Promise<NoteCardItem[]> {
  const dbNotes = await listPublishedNotes();
  const dbFeedNotes: NoteCardItem[] = dbNotes.map((n) => {
    // Read from published snapshot so working drafts remain private
    const title = n.publishedTitle || n.title;
    const subtitle =
      n.publishedSubtitle !== null && n.publishedSubtitle !== undefined
        ? n.publishedSubtitle
        : n.subtitle;
    const content =
      n.publishedContent !== null && n.publishedContent !== undefined
        ? n.publishedContent
        : n.content;
    const category = n.publishedCategory || n.category || 'Essays';
    const coverImage =
      n.publishedCoverImage !== null && n.publishedCoverImage !== undefined
        ? n.publishedCoverImage
        : n.coverImage;

    let description = n.excerpt ? stripMarkdownToPlainText(n.excerpt) : '';
    if (!description && content) {
      const clean = stripMarkdownToPlainText(content);
      description = clean.slice(0, 160) + (clean.length > 160 ? '...' : '');
    }
    return {
      id: n.id,
      slug: n.slug,
      title,
      subtitle,
      description: description || 'No summary provided.',
      pubDate: n.publishedAt || n.createdAt,
      category,
      tags: n.tags || [],
      readingTime: n.readingTime || '1 min read',
      coverImage,
    };
  });

  let mdxFeedNotes: NoteCardItem[] = [];
  try {
    const mdxNotes = await getCollection('notes', ({ data }) => !data.draft);
    mdxFeedNotes = mdxNotes.map((entry) => ({
      id: entry.id,
      slug: entry.id.replace(/\.(md|mdx)$/, ''),
      title: entry.data.title,
      subtitle: entry.data.subtitle,
      description: entry.data.description,
      pubDate: entry.data.pubDate,
      category: entry.data.category || 'Essays',
      tags: entry.data.tags || [],
      readingTime: '5 min read',
      coverImage: entry.data.coverImage,
    }));
  } catch {
    // Continue if collections are empty or unavailable
  }

  // Deduplicate by slug (PostgreSQL sovereign drafts override sample mdx)
  const map = new Map<string, NoteCardItem>();
  for (const item of mdxFeedNotes) {
    map.set(item.slug, item);
  }
  for (const item of dbFeedNotes) {
    map.set(item.slug, item);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
}

/**
 * Get a single note by ID
 */
export async function getNoteById(id: string, authorId?: string): Promise<Note | null> {
  const conditions = authorId
    ? and(eq(notes.id, id), eq(notes.authorId, authorId))
    : eq(notes.id, id);

  const [result] = await db.select().from(notes).where(conditions).limit(1);
  return result || null;
}

/**
 * Get a single note by Slug
 */
export async function getNoteBySlug(slug: string): Promise<Note | null> {
  const [result] = await db.select().from(notes).where(eq(notes.slug, slug)).limit(1);
  return result || null;
}

/**
 * Create a new blank or titled draft note
 */
export async function createNoteDraft(authorId: string, initialTitle?: string): Promise<Note> {
  const title = initialTitle?.trim() || 'Untitled Note';
  let baseSlug = generateSlug(title);
  let finalSlug = baseSlug;
  let counter = 1;

  // Ensure unique slug
  while (await getNoteBySlug(finalSlug)) {
    finalSlug = `${baseSlug}-${counter}`;
    counter++;
  }

  const [newNote] = await db
    .insert(notes)
    .values({
      title,
      slug: finalSlug,
      authorId,
      category: 'Essays',
      status: 'draft',
      content: '',
      excerpt: '',
      readingTime: '1 min read',
    })
    .returning();

  return newNote;
}

/**
 * Update an existing note (used by debounced auto-save & edit forms)
 */
export async function updateNote(
  id: string,
  authorId: string,
  data: Partial<{
    title: string;
    subtitle?: string;
    category: string;
    content: string;
    excerpt?: string;
    tags?: string[];
    coverImage?: string;
  }>
): Promise<Note | null> {
  const existing = await getNoteById(id, authorId);
  if (!existing) return null;

  const updatePayload: Partial<NewNote> = {
    updatedAt: new Date(),
  };

  // If the note is already published, any edits are marked as unpublished changes
  if (existing.status === 'published') {
    updatePayload.hasUnpublishedChanges = true;
  }

  if (data.title !== undefined) {
    const trimmedTitle = data.title.trim() || 'Untitled Note';
    updatePayload.title = trimmedTitle;

    // If the slug is still the default 'untitled-note' or if in draft state, update slug cleanly
    if (
      trimmedTitle !== 'Untitled Note' &&
      (existing.slug.startsWith('untitled-note') || existing.status === 'draft')
    ) {
      let baseSlug = generateSlug(trimmedTitle);
      let candidateSlug = baseSlug;
      let counter = 1;
      while (true) {
        const conflict = await getNoteBySlug(candidateSlug);
        if (!conflict || conflict.id === id) break;
        candidateSlug = `${baseSlug}-${counter}`;
        counter++;
      }
      updatePayload.slug = candidateSlug;
    }
  }
  if (data.subtitle !== undefined) {
    updatePayload.subtitle = data.subtitle;
  }
  if (data.category !== undefined) {
    updatePayload.category = data.category;
  }
  if (data.content !== undefined) {
    updatePayload.content = data.content;
    updatePayload.readingTime = estimateReadingTime(data.content);
  }
  if (data.excerpt !== undefined) {
    updatePayload.excerpt = data.excerpt;
  }
  if (data.tags !== undefined) {
    updatePayload.tags = data.tags;
  }
  if (data.coverImage !== undefined) {
    updatePayload.coverImage = data.coverImage;
  }

  const [updated] = await db
    .update(notes)
    .set(updatePayload)
    .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
    .returning();

  return updated || null;
}

/**
 * Publish a note or publish pending draft updates to a live note
 */
export async function publishNote(id: string, authorId: string): Promise<Note | null> {
  const existing = await getNoteById(id, authorId);
  if (!existing) return null;

  const [updated] = await db
    .update(notes)
    .set({
      status: 'published',
      publishedTitle: existing.title,
      publishedSubtitle: existing.subtitle,
      publishedContent: existing.content,
      publishedCategory: existing.category,
      publishedCoverImage: existing.coverImage,
      hasUnpublishedChanges: false,
      publishedAt: existing.publishedAt || new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
    .returning();

  return updated || null;
}

/**
 * Unpublish a note (revert back to draft)
 */
export async function unpublishNote(id: string, authorId: string): Promise<Note | null> {
  const existing = await getNoteById(id, authorId);
  if (!existing) return null;

  const [updated] = await db
    .update(notes)
    .set({
      status: 'draft',
      hasUnpublishedChanges: false,
      updatedAt: new Date(),
    })
    .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
    .returning();

  return updated || null;
}

/**
 * Toggle published status of a note (supports explicit action 'publish' | 'unpublish')
 */
export async function togglePublishNote(
  id: string,
  authorId: string,
  action?: 'publish' | 'unpublish'
): Promise<Note | null> {
  const existing = await getNoteById(id, authorId);
  if (!existing) return null;

  if (action === 'publish') {
    return publishNote(id, authorId);
  }
  if (action === 'unpublish') {
    return unpublishNote(id, authorId);
  }

  // If already published and has unpublished changes, publishing copies the changes
  if (existing.status === 'published' && existing.hasUnpublishedChanges) {
    return publishNote(id, authorId);
  }

  // Otherwise toggle between draft and published
  if (existing.status === 'published') {
    return unpublishNote(id, authorId);
  } else {
    return publishNote(id, authorId);
  }
}

/**
 * Delete a note
 */
export async function deleteNote(id: string, authorId: string): Promise<boolean> {
  const result = await db
    .delete(notes)
    .where(and(eq(notes.id, id), eq(notes.authorId, authorId)))
    .returning();

  return result.length > 0;
}
