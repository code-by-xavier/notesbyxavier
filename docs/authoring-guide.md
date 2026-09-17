# Writing Notes in Notesby

Writing a new piece in Notesby is as simple as creating a text file. Every post is called a **note** (such as an Essay, an Op-Ed, or a Field Note). You focus purely on thinking and writing — the system automatically handles typography, reading time calculations, mobile responsiveness, and table of contents generation.

---

## Step-by-Step: Adding a New Note

1. Open the folder: `src/content/notes/`
2. Create a new file with a `.mdx` extension (e.g. `my-first-note.mdx`).
3. At the very top of the file, add this small information block:

```mdx
---
title: "The Simplicity of Calm Publishing"
subtitle: "Why distraction-free writing produces clearer thinking"
description: "A short summary of this note that will appear on Google and social media previews."
pubDate: 2026-09-17
category: "Essays"
tags: ["Writing", "Philosophy"]
readingTime: "5 min read"
draft: false
---

Your note starts right here. Write naturally using standard paragraphs.
```

1. Save the file. Your new note is immediately live on your homepage in its category row slider!

---

## Categories Explained

Notesby supports categorizing your writing into distinct rows on the homepage:

- **`Essays`**: Long-form analytical writing and system blueprints.
- **`Op-Eds`**: Opinion pieces and commentary on technology and culture.
- **`Field Notes`**: Rapid dispatches, benchmarks, and engineering logs.
- Or any custom category name you define!

---

## Writing Cheatsheet

| What you want to do | How to write it | What it looks like |
| :--- | :--- | :--- |
| **Section Heading** | `## My Section Title` | Creates an elegant section title and **automatically adds it to your sticky Table of Contents** on the left! |
| **Sub-heading** | `### A Smaller Point` | Creates a nested sub-heading in your text and table of contents. |
| **Bold Text** | `**very important**` | **very important** |
| **Italic Text** | `*thoughtful reflection*` | *thoughtful reflection* |
| **Quotes** | `> Simplicity is prerequisite for reliability.` | Displays an editorial quote block with generous margins. |
| **Bullet List** | `- First point`<br/>`- Second point` | Clean bullet list with comfortable spacing. |
| **Numbered List** | `1. Step one`<br/>`2. Step two` | Numbered list. |
| **Links** | `[Read more](https://example.com)` | [Read more](https://example.com) |

---

## Adding Images to Your Note

1. Place your image inside the `public/images/essays/` folder (e.g., `my-photo.jpg`).
2. In your note text, write:

   ```markdown
   ![Description of my photo](/images/essays/my-photo.jpg)
   ```

### Optional Header Cover Image

If you want an image to display at the very top of your note, add `coverImage` to your information block:

```yaml
coverImage: "/images/essays/my-photo.jpg"
```

---

## Draft Mode

If you are still working on a note and don't want it published to the world yet, simply set:

```yaml
draft: true
```

Notesby will keep it private until you change it to `draft: false`.
