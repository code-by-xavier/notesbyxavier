# Notesby Studio: Distraction-Free Editorial Canvas Guide

**Notesby Studio** is an in-browser writing environment engineered for serious thinkers, essayists, and researchers. It bridges the gap between distraction-free minimal text editors (like iA Writer) and rich modern web publishing platforms.

---

## 1. Studio Architecture & Canvas Aesthetics

The Studio operates at `/admin/editor/[id]` (or `/admin/editor/new`):

- **Zero Clutter**: Eliminates sidebars, floating widgets, and unnecessary chrome while writing.
- **Publication-Fidelity Typography**: Writing in the studio uses the exact same typography, font sizes, line heights, and margins as your live publication.
- **Live Editorial Styling**:
  - `## Headings` automatically render as styled H2 headings with generous top spacing.
  - `### Sub-headings` render as distinct H3 headings.
  - `> Blockquotes` render with Notesby's signature left accent border and italicized typography.
  - `- Bulleted lists` render with custom editorial list bullets and comfortable vertical cadence.

---

## 2. Undo / Redo History Engine

Notesby Studio includes a responsive undo and redo state engine:

### Dedicated Toolbar Controls

- **Undo Button**: Reverts the canvas to the previous edit snapshot.
- **Redo Button**: Re-applies undone changes forward in history.
- Both buttons display helpful tooltips showing the exact platform keybinding.

### Keyboard Shortcuts

Notesby Studio captures universal undo/redo key combinations across operating systems:

| Action   | macOS Shortcut                 | Windows / Linux Shortcut         |
| :------- | :----------------------------- | :------------------------------- |
| **Undo** | `Cmd + Z`                      | `Ctrl + Z`                       |
| **Redo** | `Cmd + Shift + Z` or `Cmd + Y` | `Ctrl + Shift + Z` or `Ctrl + Y` |

The history engine automatically tracks debounced typing snapshots, cut/paste actions, and deletions.

---

## 3. Sovereign Cover Image Pipeline

Every note can include an optional high-resolution editorial cover image.

### Uploading a Cover

1. Click the unified **Upload Cover** button at the top of the canvas.
2. Select any JPEG, PNG, or WebP image up to 5MB.
3. The image uploads directly through Notesby's Sovereign Storage Engine:
   - In local development: Saved to the `fake-gcs-server` emulator (port 4443).
   - In production: Uploaded to Google Cloud Storage (`notesby-media`).
   - If storage is offline: Falls back gracefully to `public/uploads/`.
4. The cover image preview appears immediately at the top of the canvas.

### Deleting a Cover

- Click the delete (trash) icon on the cover image preview.
- **Zero Layout Jump**: The image container smoothly unmounts without scrolling or disorienting your cursor position on the writing canvas.

### Reading Page vs. Feed Presentation

- **Homepage Category Sliders**: Cards remain pure text notes without thumbnail imagery, preserving clean scannability.
- **Reading Page**: Renders the cover image prominently directly below the main title and metadata banner.
- **Social & SEO**: Automatically populates `og:image`, `twitter:image`, and Schema.org Article JSON-LD markup.

---

## 4. Searchable Writing Guide Modal

Need a quick syntax reminder while in flow? Notesby Studio includes an integrated Writing Guide modal:

### Accessing the Guide

- Click the **Writing Guide** icon (open book / bookmark) in the top right portal header.
- A dark-tinted modal overlay appears above the studio canvas without losing your cursor or unsaved drafts.

### Features

- **Real-time Search Filter**: Type any keyword (e.g. `anchor`, `quote`, `tag`, `h2`) to instantly filter the reference guide.
- **Markdown Quick Reference**: Cheatsheets for headings, quotes, lists, bold/italics, and code blocks.
- **Hashtags & Taxonomies**: Guidance on tagging your thoughts for taxonomy aggregation.
- **Anchor Linking**:
  - Internal heading anchors: `[Jump to Section](#section-slug)`
  - External references: `[Source](https://example.com)`

---

## 5. Drafts, Auto-Saving, and Publishing

### Persistent State Tracking

- While editing, the top toolbar displays an active **Unsaved changes** indicator.
- The button remains visibly active as you type, ensuring you never accidentally navigate away with unpersisted work.

### Auto-Saving & Manual Save

- Notesby periodically persists drafts in the background to PostgreSQL via Drizzle ORM (`/api/notes/[id]`).
- You can manually force-save at any time using `Cmd + S` / `Ctrl + S` or by clicking **Save Draft**.

### Instant Publishing

- When your piece is ready for the world, click **Publish**.
- The note's `draft` flag is set to `false`, and the article immediately appears on your homepage in its assigned category slider row and in the `/rss.xml` syndication feed.
