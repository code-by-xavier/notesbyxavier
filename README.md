# Notesby

> **The Sovereign Editorial Engine for Thinkers, Researchers, and Architects.**
>
> An open-source publishing platform where every post is a note. Built on [Astro](https://astro.build), [PostgreSQL](https://www.postgresql.org), and [Drizzle ORM](https://orm.drizzle.team), engineered for sovereign deployment on [Google Cloud Platform](https://cloud.google.com).

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: Astro 5](https://img.shields.io/badge/Framework-Astro_5-orange.svg)](https://astro.build)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_Cloud_SQL-336791.svg)](https://www.postgresql.org)
[![ORM: Drizzle](https://img.shields.io/badge/ORM-Drizzle_ORM-C5F74F.svg)](https://orm.drizzle.team)
[![Ecosystem: CLSTRE](https://img.shields.io/badge/Ecosystem-CLSTRE-075aaa.svg)](https://clstre.com)

---

## Why Notesby?

The modern web is overwhelmed by bloated content management systems (WordPress) and walled-garden subscription platforms (Substack, Medium). **Notesby is the antidote.**

Notesby provides a sovereign, high-contrast, distraction-free home for your intellectual property with four distinct pillars:

### 1. The Native GCP "Sovereign Cloud" Moat

Notesby is the first publishing engine engineered natively for **Google Cloud Platform (GCP)**:

- **Cloud Run**: Blazing-fast containerized compute that automatically scales to zero when idle.
- **Cloud SQL (`db-f1-micro`)**: Enterprise-grade PostgreSQL holding 50,000+ essays with sub-2ms query times.
- **Google Cloud Storage (GCS)**: Ultra-cheap, durable media hosting for pennies a month.
- **Zero Redis**: Engineered with efficient indexing and edge caching, eliminating redundant database servers and high memorystore costs.
- **Predictable Cost**: Full sovereign ownership on Google enterprise infrastructure for a modest ~$10–$15/month.

### 2. The "Notes vs. Essays" Editorial Hierarchy

Every post is a note, but thoughts come in different depths:

- **Field Notes**: Rapid dispatches, field logs, and micro-observations (100–300 words). Replaces the impulse to publish thoughts onto closed social platforms like X/Twitter.
- **Editorial Essays**: Long-form, deep-dive research, explorations, and monographs with automated tables of contents and reading times.
- **Op-Eds**: Focused, sharp perspectives, cultural commentary, and critiques on any subject.

### 3. Notesby Studio (Distraction-Free Editorial Canvas)

- In-browser, distraction-free writing environment (feels like _iA Writer meets Notion_).
- Live editorial canvas styling: real-time publication-fidelity headings (`##`, `###`), quotes, and lists.
- Full undo / redo history with dedicated toolbar icons and keyboard shortcuts (`Cmd/Ctrl + Z`, `Cmd/Ctrl + Shift + Z`, `Cmd/Ctrl + Y`).
- Single-click cover image uploading backed by sovereign Google Cloud Storage (GCS) or local emulator.
- Integrated **Searchable Writing Guide Modal** for Markdown shortcuts, hashtags, and internal/external anchor linking.
- Live auto-saving drafts, persistent state tracking, and one-click instant publishing.

### 4. Publication Settings Portal (`/admin/settings`)

- **Zero-Code Customization**: Personalize your publication name, author bio, and social profiles directly in the browser.
- **Brand Marks & Avatars**: Upload custom logos (SVG, PNG, WebP) and profile photos with instant live preview.
- **PWA Ready**: Upload favicons (`.ico`, `.png`, `.svg`, `.webp`) and mobile home screen touch icons with an auto-generated Web App Manifest (`/manifest.webmanifest`).
- **Legal Sovereignty**: Built-in editors for legal entity names, Terms of Service (`/terms`), Privacy Policy (`/privacy`), and AI training scraper protection (`/ai-policy`).

### 5. Distraction-Free Reader Experience

- **Zero Bloat**: No cookie popups, no newsletter gatewalls, no tracking scripts.
- **Editorial Typography**: High-contrast typography with smooth dark/light mode switching (`#075aaa` brand accents).
- **Clean Syndication**: Automated clean RSS feed with dedicated header and post-footer RSS links.

---

## Getting Started

### Path A: Developers & DevOps (CLI & Docker)

```bash
# 1. Clone repository
git clone https://github.com/CLSTRE-ORG/Notesby.git
cd Notesby

# 2. Install dependencies
pnpm install

# 3. Spin up local PostgreSQL & GCS storage infrastructure
pnpm run services:infra

# 4. Push database schema
pnpm run db:push

# 5. Start local writing server (port 4330)
pnpm dev

# 6. Validate & build for production
pnpm validate
pnpm build
```

#### Developer CLI Quick Reference

| Category            | Command                 | Description                                                   |     Data Preserved?     |
| :------------------ | :---------------------- | :------------------------------------------------------------ | :---------------------: |
| **Development**     | `pnpm dev`              | Starts local dev server at `http://localhost:4330`            |         ✅ Yes          |
|                     | `pnpm fresh`            | Cleans `.astro` build cache and starts fresh dev server       |         ✅ Yes          |
|                     | `pnpm restart`          | Cleans cache, restarts Docker services, and re-syncs `.env`   |         ✅ Yes          |
|                     | `pnpm build`            | Compiles production server and client bundles via Astro       |         ✅ Yes          |
|                     | `pnpm preview`          | Previews the compiled production build locally                |         ✅ Yes          |
| **Infrastructure**  | `pnpm services:infra`   | Starts PostgreSQL (port 5432) and GCS emulator (port 4443)    |         ✅ Yes          |
|                     | `pnpm services:status`  | Inspects container status and health (`docker compose ps`)    |         ✅ Yes          |
|                     | `pnpm services:restart` | Restarts Docker containers without wiping data                |         ✅ Yes          |
|                     | `pnpm services:stop`    | Pauses containers without removing them                       |         ✅ Yes          |
|                     | `pnpm services:down`    | Stops containers and removes network                          |         ✅ Yes          |
|                     | `pnpm services:reset`   | Stops containers and **purges volumes** (`down -v`)           |      ❌ Data wiped      |
| **Cleanup Engine**  | `pnpm clean`            | Purges `.astro/`, `dist/`, `.temp/`, and log files            |         ✅ Yes          |
|                     | `pnpm clean:cache`      | Alias for `pnpm clean`                                        |         ✅ Yes          |
|                     | `pnpm clean:deps`       | Purges `node_modules/`, `.astro/`, and `dist/`                | ✅ Yes (Keeps DB/media) |
|                     | `pnpm clean:uploads`    | Purges all files in `public/uploads/*` (preserves `.gitkeep`) |  ⚠️ Local media wiped   |
|                     | `pnpm clean:full`       | Full wipe: cache + `node_modules` + uploads + Docker volumes  |  ❌ Full platform wipe  |
| **Database & Auth** | `pnpm db:push`          | Syncs Drizzle schema directly to active PostgreSQL database   |         ✅ Yes          |
|                     | `pnpm db:studio`        | Opens Drizzle Studio GUI for visual database management       |         ✅ Yes          |
|                     | `pnpm db:migrate`       | Runs formal Drizzle migration files                           |         ✅ Yes          |
|                     | `pnpm rescue:admin`     | CLI utility to reset admin passwords without SMTP             |         ✅ Yes          |
| **Code Quality**    | `pnpm validate`         | Runs all 8 platform integrity and typing checks               |         ✅ Yes          |
|                     | `pnpm format`           | Formats codebase with Prettier (`.astro`, `.scss`, `.ts`)     |         ✅ Yes          |
|                     | `pnpm typecheck`        | Validates TypeScript and Astro components without emitting    |         ✅ Yes          |

### Path B: 1-Click Launch & Download (The Open Source Creator Model)

Similar to downloading open-source creative suites like **Inkscape**:

1. Click **Deploy Notesby** on [clstre.com](https://clstre.com) or download the turnkey setup script.
2. Enter your GCP Project ID and custom domain.
3. Open your live publication and complete the **Welcome Onboarding Wizard** (`/setup`) to configure your author bio, avatar, and secure admin credentials.
4. Step immediately into **Notesby Studio** and write your first note.

---

## Documentation

- **[Architecture & AI Agent Guide](AGENTS.md)** — Architectural decisions, tech stack specifications, and agent rules.
- **[Operations & CLI Reference](docs/operations.md)** — Comprehensive operations, Docker services, cleanup engine, and restart workflows.
- **[Notesby Studio Guide](docs/studio-guide.md)** — Deep-dive on the in-browser canvas, live styling, shortcuts, and writing guide.
- **[Sovereign Storage & Media](docs/storage.md)** — Sovereign GCS asset pipeline, local emulation, fallbacks, and SEO cover images.
- **[Authoring Guide](docs/authoring-guide.md)** — Writing notes, formatting essays, frontmatter schemas, and setting categories.
- **[Customization Guide](docs/configuration.md)** — Personalizing your brand, bio, and social links in `notes.config.ts`.
- **[Deployment Guide](docs/deployment.md)** — Google Cloud Run & Cloud SQL production deployment instructions.
- **[Upstream Sync Guide](docs/upstream-sync.md)** — Safely pulling updates from `CLSTRE-ORG/Notesby` without merge conflicts.

---

## Tech Stack Overview

| Layer         | Technology                                                                   |
| :------------ | :--------------------------------------------------------------------------- |
| **Framework** | [Astro 5](https://astro.build) (Hybrid SSR with `@astrojs/node`)             |
| **Database**  | [PostgreSQL](https://www.postgresql.org) on Google Cloud SQL (`db-f1-micro`) |
| **ORM**       | [Drizzle ORM](https://orm.drizzle.team)                                      |
| **Styles**    | Vanilla CSS & SCSS Custom Properties (`#075aaa` brand blue)                  |
| **Container** | Docker Alpine running on [Google Cloud Run](https://cloud.google.com/run)    |
| **Assets**    | Google Cloud Storage (GCS)                                                   |

---

## Brand & Community

Notesby is an open-source initiative created under the **CLSTRE** technology ecosystem.

- **Ecosystem**: [CLSTRE](https://clstre.com)
- **Author & Lead Architect**: [Xavier Lawrence](https://notesbyxavier.com) ([XLawrence@clstre.com](mailto:XLawrence@clstre.com))
- **Support & Issues**: [GitHub Issues](https://github.com/CLSTRE-ORG/Notesby/issues) | [support@clstre.com](mailto:support@clstre.com)
- **Reference Publication**: [notesbyxavier.com](https://notesbyxavier.com)

---

## License

Open source under the [MIT License](LICENSE). Built for sovereign thinkers and the open web.
