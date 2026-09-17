# Writing Essays in NOTES

Writing a new piece in NOTES is as simple as creating a text file. You focus purely on thinking and writing — the system automatically handles typography, reading time calculations, mobile responsiveness, and table of contents generation.

---

## Step-by-Step: Adding a New Essay

1. Open the folder: `src/content/notes/`
2. Create a new file with a `.mdx` extension (e.g. `my-first-essay.mdx`).
3. At the very top of the file, add this small information block:

```mdx
---
title: "The Simplicity of Calm Publishing"
subtitle: "Why distraction-free writing produces clearer thinking"
description: "A short summary of this essay that will appear on Google and social media previews."
pubDate: 2026-09-17
tags: ["Writing", "Philosophy"]
readingTime: "5 min read"
draft: false
---

Your essay starts right here. Write naturally using standard paragraphs.
```

1. Save the file. Your new note is immediately live on your homepage!

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

## Adding Images to Your Essay

1. Place your image inside the `public/images/essays/` folder (e.g., `my-photo.jpg`).
2. In your essay text, write:

   ```markdown
   ![Description of my photo](/images/essays/my-photo.jpg)
   ```

### Optional Header Cover Image

If you want an image to display at the very top of your essay, add `coverImage` to your information block:

```yaml
coverImage: "/images/essays/my-photo.jpg"
```

---

## Draft Mode

If you are still working on an essay and don't want it published to the world yet, simply set:

```yaml
draft: true
```

NOTES will keep it private until you change it to `draft: false`.

---

## Future Roadmap: Visual Editor

NOTES is designed from the ground up for distraction-free writing. Future releases will include a companion lightweight, browser-based visual editor so non-technical writers can draft and publish directly from their web browser.
