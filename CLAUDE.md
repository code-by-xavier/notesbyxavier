# Notesby — Claude Code Instructions

> **Author & Lead Architect**: Xavier Lawrence ([notesbyxavier.com](https://notesbyxavier.com))  
> **Brand**: CLSTRE Ecosystem ([clstre.com](https://clstre.com))  
> **Philosophy**: _"Simplicity is my prerequisite for reliability."_

---

## Overview

**Notesby** is an open-source, sovereign publishing engine designed for serious thinkers, essayists, researchers, and technical architects. Every post is a note, structured into three distinct editorial primitives:

1. **Field Notes**: Short-form dispatches, micro-essays, and field logs (100–300 words).
2. **Editorial Essays**: Long-form, deep-dive research with rich typography, table of contents, and reading times.
3. **Op-Eds**: Focused perspectives, cultural commentary, and critiques.

---

## Tech Stack & Architectural Decisions

- **Framework**: Astro 5 (hybrid SSR with `@astrojs/node`). Reader pages statically pre-rendered & edge-cached; admin & APIs run dynamically.
- **Styling**: Vanilla CSS & SCSS. Clean CSS custom properties; no Tailwind. Brand blue: `#075aaa`.
- **Database**: PostgreSQL (Cloud SQL `db-f1-micro`).
- **ORM**: Drizzle ORM (type-safe, zero runtime overhead).
- **Media**: Google Cloud Storage (GCS).
- **Host**: Google Cloud Run (Docker container, scale-to-zero).
- **Cache**: NO REDIS (strictly avoided to eliminate cost and architectural bloat).

---

## Common Commands

- **Environment Setup**: `pnpm run setup:env` (hydrates `.env` from `.env.local` and `.env.template`)
- **Development**: `pnpm dev` (starts Astro dev server on port 4330)
- **Local Infra Services**: `pnpm run services:infra` (launches local DB and storage emulator)
- **Typecheck & Astro Check**: `pnpm run typecheck`
- **Lint & Format**: `pnpm run lint` and `pnpm run format`
- **Validation Pipeline**: `pnpm validate` (runs full 8-step validation suite)
- **Database Migrations**: `pnpm run db:generate`, `pnpm run db:push`, `pnpm run db:migrate`
- **Claude Code**: `pnpm claude` (runs Claude Code CLI configured with OpenRouter)

---

## Engineering Guidelines

1. **Preserve Upstream Boundaries**: Bespoke user code must remain modular for easy sync with `CLSTRE-ORG/Notesby`.
2. **Lean Dependencies**: Avoid introducing heavy npm packages or client-side JavaScript libraries unless essential.
3. **Always Validate**: Run `pnpm validate` before committing any code changes.
