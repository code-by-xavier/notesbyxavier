# Authoring Guide: Writing in Notesby

Notesby offers two sovereign authoring workflows designed to give writers complete control over their intellectual property:

1. **[Notesby Studio](#workflow-a-notesby-studio-in-browser-editor)**: A distraction-free in-browser writing environment featuring live typography styling, full undo/redo history, cover image uploading, and a searchable Markdown reference.
2. **[Local Content Collections](#workflow-b-local-markdown--mdx-collections)**: Direct file-based authoring via Git and `.mdx` files in `src/content/notes/`.

Every post is called a **note** (such as an Essay, an Op-Ed, or a Field Note). You focus purely on thinking and writing — Notesby automatically handles typography, reading time calculations, mobile responsiveness, and sticky table of contents generation.

---

## Workflow A: Notesby Studio (In-Browser Editor)

Notesby Studio provides a distraction-free writing environment accessible from `/admin/editor/[id]`.

### Key Features

- **Live Editorial Styling**: Typing `## Section Title`, `### Sub-heading`, `> Blockquote`, or bulleted lists applies real-time typography styling directly on the editor canvas so your writing looks identical to the live published note.
- **Undo / Redo Support**: Complete history tracking with dedicated toolbar icons and universal keyboard shortcuts:
  - **Undo**: `Cmd + Z` (macOS) / `Ctrl + Z` (Linux/Windows)
  - **Redo**: `Cmd + Shift + Z` or `Cmd + Y` (macOS) / `Ctrl + Shift + Z` or `Ctrl + Y` (Linux/Windows)
- **Cover Image Uploading**: Upload header cover images directly to Google Cloud Storage (or local GCS emulator). Removing a cover is seamless with zero layout shifting.
- **Searchable Writing Guide Modal**: Click the bookmark/guide portal icon in the top header to search markdown shortcuts, hashtags, and internal anchor link formatting without leaving the editor.
- **Persistent State & Auto-Save**: Real-time status indicator warns of unsaved changes and prevents accidental navigation while drafts auto-save.

> [!TIP]
> For a comprehensive walkthrough of the studio interface, keyboard shortcuts, and slash commands, see the **[Notesby Studio Guide](studio-guide.md)**.

---

## Workflow B: Local Markdown / MDX Collections

If you prefer writing in your local editor (VS Code, Obsidian, Neovim) and deploying through Git:

1. Open `src/content/notes/`.
2. Create a new file with a `.md` or `.mdx` extension (e.g. `my-first-note.mdx`).
3. Add the YAML frontmatter block at the top:

   ```mdx
   ---
   title: 'The Simplicity of Calm Publishing'
   subtitle: 'Why distraction-free writing produces clearer thinking'
   description: 'A short summary of this note that will appear on Google and social media previews.'
   pubDate: 2026-09-17
   category: 'Essays'
   tags: ['Writing', 'Philosophy']
   readingTime: '5 min read'
   draft: false
   coverImage: '/images/essays/my-photo.jpg'
   ---

   Your note starts right here. Write naturally using standard Markdown paragraphs.
   ```

4. Save the file. Your new note is immediately live on your homepage in its category row slider!

---

## Categories Explained

Notesby supports categorizing your writing into distinct rows on the homepage:

- **`Essays`**: Long-form analytical writing, deep-dive research, and monographs with automated table of contents.
- **`Op-Eds`**: Opinion pieces, cultural critique, and sharp commentary on current ideas.
- **`Field Notes`**: Rapid dispatches, field logs, and micro-observations (100–300 words).
- Custom categories can be added anytime in `notes.config.ts`.

---

## Markdown Syntax Cheatsheet

| Formatting Goal     | Markdown Syntax                                 | Publication Output                                                  |
| :------------------ | :---------------------------------------------- | :------------------------------------------------------------------ |
| **Section Heading** | `## My Section Title`                           | Formatted H2 section title (auto-added to sticky Table of Contents) |
| **Sub-heading**     | `### A Smaller Point`                           | Formatted H3 sub-heading in text and Table of Contents              |
| **Bold Text**       | `**very important**`                            | **very important**                                                  |
| **Italic Text**     | `*thoughtful reflection*`                       | _thoughtful reflection_                                             |
| **Editorial Quote** | `> Simplicity is prerequisite for reliability.` | Styled blockquote with left accent bar and generous margins         |
| **Bullet List**     | `- First point`<br/>`- Second point`            | Unordered list with comfortable editorial line-height               |
| **Numbered List**   | `1. Step one`<br/>`2. Step two`                 | Clean numbered list                                                 |
| **Hyperlink**       | `[CLSTRE](https://clstre.com)`                  | [CLSTRE](https://clstre.com)                                        |
| **Inline Code**     | `` `pnpm dev` ``                                | Monospace highlighted snippet                                       |
| **Code Block**      | ` ```typescript `                               | High-contrast syntax highlighted code block                         |

---

## Cover Images & SEO Presentation

Notesby follows a strict editorial layout philosophy for cover images:

1. **Homepage Feed**: Note cards in the category sliders remain clean, distraction-free text without thumbnail clutter.
2. **Note Reading Page**: Uploaded cover images render prominently directly below the main `H1` title and reading metadata.
3. **Social & Search Graph**: Uploaded covers automatically populate OpenGraph (`og:image`), Twitter Cards (`twitter:image`), and Schema.org Article JSON-LD markup.

For more details on sovereign media storage, see **[Sovereign Storage & Media](storage.md)**.
