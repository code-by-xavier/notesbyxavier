# NOTES

> An open-source, minimalist static publishing engine inspired by [Dario Amodei](https://darioamodei.com), built on [Astro](https://astro.build).

Designed for thinkers, architects, and essayists who value elevated typography, high-signal writing, and zero runtime bloat.

---

## Features

- **Dario Amodei Reading Experience**: High-contrast, elegant editorial serif typography with generous line-height and optimal reading column width.
- **Sticky Table of Contents**: Dynamic left-hand "Contents" sidebar that automatically indexes headings and tracks reader scroll position.
- **Instant Dark & Light Modes**: Native theme toggle with zero-flicker client initialization and `localStorage` persistence.
- **Card-Driven Index**: Minimal, clean homepage feed with reading time estimates, dates, subtitles, and topic tags.
- **Single-File Configuration (`notes.config.ts`)**: Customize author name, bio, site title, navigation links, and social URLs in seconds.
- **Content Collections**: Write in Markdown or MDX with type-safe frontmatter validation.
- **RSS & Sitemap Included**: Pre-configured RSS 2.0 feed (`/rss.xml`) and automated Google sitemap.
- **Sub-Second Cloud Run Deployment**: Production-ready multi-stage Dockerfile serving static files via Nginx Alpine (<25MB image size, sub-second cold starts).

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start local development server (port 4330)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

---

## Configuration

Edit `notes.config.ts` in the project root to configure your personal publication:

```ts
export const notesConfig = {
  siteTitle: 'Notes by Xavier',
  authorName: 'Xavier Lawrence',
  authorBio: 'Founder & Cloud Architect.',
  domain: 'https://notesbyxavier.com',
  // ...
};
```

---

## Adding New Essays

Create a Markdown file in `src/content/notes/`:

```markdown
---
title: "My New Essay"
subtitle: "A thoughtful perspective on modern engineering"
description: "Brief summary for SEO and feed cards"
pubDate: 2026-09-17
author: "Xavier Lawrence"
tags: ["Engineering", "Architecture"]
draft: false
---

Your essay content here in standard Markdown...
```

---

## License

Open source under the [MIT License](LICENSE). Built under the [CLSTRE](https://clstre.com) ecosystem.
