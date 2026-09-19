// File: src/pages/rss.xml.ts
// ============================================================
// Notesby — RSS Feed Endpoint
// Generates automated RSS syndication feed for published notes.
// ============================================================

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { notesConfig } from '@config';
import { ROUTES } from '@/links';

export async function GET(context: { site: URL }) {
  const notes = await getCollection('notes', ({ data }) => !data.draft);
  const sortedNotes = notes.sort(
    (a, b) => new Date(b.data.pubDate).getTime() - new Date(a.data.pubDate).getTime()
  );

  return rss({
    title: notesConfig.siteTitle,
    description: notesConfig.description,
    site: context.site || notesConfig.domain,
    items: sortedNotes.map((note) => ({
      title: note.data.title,
      pubDate: note.data.pubDate,
      description: note.data.description,
      link: ROUTES.NOTE(note.id.replace(/\.mdx?$/, '')),
    })),
    customData: `<language>en-us</language>`,
  });
}
