// File: src/pages/rss.xml.ts
// ============================================================
// Notesby — RSS Feed Endpoint
// Generates automated RSS syndication feed for published notes.
// ============================================================

import rss from '@astrojs/rss';
import { getAllFeedNotes } from '@/lib/notes';
import { notesConfig } from '@config';
import { ROUTES } from '@/links';

export const prerender = false;

export async function GET(context: { site: URL }) {
  const sortedNotes = await getAllFeedNotes();

  return rss({
    title: notesConfig.siteTitle,
    description: notesConfig.description,
    site: context.site || notesConfig.domain,
    items: sortedNotes.map((note) => ({
      title: note.title,
      pubDate: new Date(note.pubDate),
      description: note.description,
      link: ROUTES.NOTE(note.slug),
    })),
    customData: `<language>en-us</language>`,
  });
}
