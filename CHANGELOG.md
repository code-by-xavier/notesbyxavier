# Changelog

All notable changes to **Notesby** are documented in this file.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] — 2026-09-20

### 🚀 Highlights

This is a major milestone release transforming Notesby from a pure static publisher into a
**full-stack Sovereign Cloud Publishing Engine** with a database-backed admin portal, Google Cloud
Storage media pipeline, and a turnkey 1-click GCP deployment system.

---

### Added — Sovereign Cloud Deployment System

- **`scripts/setup-gcp.sh`** — Interactive Cloud Shell provisioning script. Provisions Cloud SQL
  (`db-f1-micro`), GCS media bucket, Secret Manager secrets, Cloud Run service, and DB migrations
  in under 4 minutes. Zero local tooling required.
- **`cloudbuild.yaml`** — Updated with Secret Manager secret injection (`--update-secrets`), Cloud
  SQL sidecar connection, and a post-deploy step that prints the live URL + setup wizard link.
- **`docs/deployment.md`** — New "1-Click Cloud Shell Deploy" section with full GCP provisioning
  flow, wizard steps table, and GitOps/Terraform alternatives.

---

### Added — 5-Step Guided Setup Wizard (`/setup`)

- **Step 1 — Cloud Connection**: Real-time DB + GCS health check cards with ✅/❌ live state,
  "Retry" button, and Cloud Shell tip box. "Continue" is gated until both services pass.
- **Step 2 — Publication Identity**: Publication title, author name, short bio (live character
  counter), and canonical domain URL.
- **Step 3 — Admin Account**: Email, password with show/hide eye toggle, 5-level password strength
  meter, confirm-match error.
- **Step 4 — Branding (optional)**: Avatar photo upload (routes to GCS via `/api/upload`), live
  preview, "Skip for now" bypass.
- **Step 5 — Launch**: Summary review card of all entered settings → "Launch My Publication →" CTA
  → claims publication and redirects to Studio.
- Animated step progress bar + step-dot indicator at top.
- Smooth `panel-enter` slide-in transition between steps. Step locking — each step validates before
  the next unlocks.

---

### Added — Health Check API

- **`GET /api/setup/health`** — Real-time connectivity probe used by wizard Step 1. Checks
  PostgreSQL (`siteSettings` table read) and GCS bucket existence. Returns
  `{ db, storage, alreadySetup, errors }`.

---

### Added — Google Cloud Storage (GCS) Media Pipeline

- **`src/lib/storage.ts`** — GCS client with `fake-gcs-server` local emulator support and
  production Cloud Run ADC. Auto-creates bucket if missing. Graceful fallback to `public/uploads/`.
- **`docker-compose.yml`** — Added `notesby_storage` service (`fsouza/fake-gcs-server:latest`,
  port 4443) and `notesby_storage_data` named volume.
- **`/api/upload`** — Authenticated image upload endpoint with magic-byte MIME validation, 5 MB
  limit, and collision-free naming. Routes to GCS in all environments.

---

### Added — Full Admin Portal (Zen Studio)

- **`/admin`** — Dashboard with post counts, quick actions, and publication status.
- **`/admin/editor/[id]`** — Distraction-free Zen Studio editor with slash commands (`/h2`,
  `/quote`, `/code`, `/image`), live word count, reading time, auto-save draft, and one-click
  publish.
- **`/admin/settings`** — Sovereign configuration portal: Identity & Branding, PWA Icons, Reading
  Experience, Legal & Compliance, SEO & Social — all editable from the UI without code changes.
- **`/admin/login`**, **`/admin/reset-password`** — Full session authentication with bcrypt + 30-day
  cookie.

---

### Added — Database Layer

- **Drizzle ORM** + **PostgreSQL** schema: `users`, `sessions`, `siteSettings`, `notes` tables.
- **`/api/auth/setup`** — Setup endpoint extended to persist `authorBio`, `domain`, `avatarUrl`.
- **`scripts/rescue-admin.ts`** — Emergency admin recovery CLI tool.
- **`scripts/clean.ts`** — Platform cleanup engine with `--cache`, `--deps`, `--uploads`, `--all`
  flags.
- **`scripts/setup-env.ts`** — Automatic `.env` hydration from `.env.local` with safe defaults.
- **`scripts/validate.ts`** — 8-check platform integrity suite (config, routes, content, SCSS,
  imports, Astro, TypeScript, Prettier).

---

### Added — Design System

- **SCSS Abstracts** (`src/styles/abstracts/`) — Centralized `_variables.scss`, `_mixins.scss`,
  `_index.scss` with full design token coverage (brand colors, typography scale, spacing, shadows,
  breakpoints).
- **UI Component Library** (`src/components/ui/`) — `Button`, `Input`, `Textarea`, `FormField`,
  `FormError`, `HelperText`, `LegalNotice` reusable primitives.
- **`src/components/Icon.astro`** — Unified SVG icon component replacing all inline emoji/icon
  usage.
- **`src/components/SEO.astro`** — Centralized SEO/meta/JSON-LD component.
- **`src/components/PortalToast.astro`** — Admin toast notification system.
- **`src/components/WritingGuideModal.astro`** — In-editor slash command reference modal.

---

### Added — Content & Pages

- **`/rss.xml`** — Full RSS 2.0 feed with reading time and category metadata.
- **`/manifest.webmanifest`** — PWA web app manifest.
- **`/ai-policy`** — AI content scraping policy page.
- **Category Slider** — Horizontal swipeable category filter on homepage.

---

### Added — Documentation

- `docs/authoring-guide.md` — Full writer's guide for Zen Studio.
- `docs/configuration.md` — `notes.config.ts` configuration reference.
- `docs/deployment.md` — 1-Click Cloud Shell + GitOps + manual deployment guide.
- `docs/operations.md` — Docker, CLI commands, env management, DB operations reference.
- `docs/storage.md` — GCS emulator setup and production media guide.
- `docs/studio-guide.md` — Zen Studio editor feature reference.
- `docs/upstream-sync.md` — Guide for downstream forks syncing upstream updates.
- `SECURITY.md` — Responsible disclosure policy.

---

### Changed

- **Framework** — Notesby is now a **hybrid SSR application** (`@astrojs/node` adapter) with
  dynamic admin/API routes and statically pre-rendered reader-facing pages. Previously fully static.
- **`astro.config.mjs`** — Switched from `output: "static"` to `output: "hybrid"` with
  `@astrojs/node` server adapter.
- **`notes.config.ts`** — Extended `NotesConfig` interface with `siteLogo`, `siteLogoDark`,
  `appleTouchIcon`, `ogImage` fields.
- **`BaseLayout.astro`** — Added `hideNav` / `hideFooter` props, dark/light theme CSS custom
  properties, and PWA meta tags.
- **`Dockerfile`** — Multi-stage Node.js build (replaces single-stage Nginx Alpine). Serves via
  `node ./dist/server/entry.mjs` on port 8080.
- **`cloudbuild.yaml`** — Added Secret Manager injection, Cloud SQL connection, `_DB_INSTANCE`
  substitution variable, and post-deploy URL printer.

---

### Fixed

- GCS SDK `STORAGE_EMULATOR_HOST` path prefix override — cleared env var before SDK init to
  preserve `/storage/v1` routing against `fake-gcs-server`.
- RSS icon brand orange color regression in dark/light mode.
- Card hover elevation shadow and category slider border clipping.
- Nginx port 8080 redirect loop and missing trailing slash on note links.
- Docker pnpm version pinning for reproducible container builds.

---

### Infrastructure — v1.2.0

| Layer     | Technology            | Version                     |
| :-------- | :-------------------- | :-------------------------- |
| Framework | Astro (hybrid SSR)    | 5.18.x                      |
| Adapter   | @astrojs/node         | 9.5.x                       |
| ORM       | Drizzle ORM           | 0.45.x                      |
| Database  | PostgreSQL            | 16 (local) / 15 (Cloud SQL) |
| Storage   | @google-cloud/storage | 8.2.x                       |
| Auth      | bcryptjs              | 3.x                         |
| Styling   | Vanilla SCSS          | —                           |
| Runtime   | Node.js               | 22 Alpine                   |
| Container | Docker multi-stage    | —                           |
| CI/CD     | Google Cloud Build    | —                           |

---

## [1.0.0] — 2026-09-17

### Added — Initial Release

- Initial open-source release of Notesby static publishing platform.
- MDX content collections with Zod schema validation.
- Horizontal note card sliders by category (Essays, Op-Eds, Field Notes).
- CLSTRE brand blue (`#075aaa`) design system.
- Google Cloud Run deployment with Nginx Alpine container.
- `cloudbuild.yaml` CI/CD pipeline.
- RSS 2.0 feed, dark/light mode toggle, reading time calculation.
- Responsive editorial typography (Newsreader serif headings, Inter sans body).
- `SECURITY.md`, `LICENSE` (MIT), upstream sync documentation.

---

[1.2.0]: https://github.com/CLSTRE-ORG/Notesby/compare/v1.0.0...v1.2.0
[1.0.0]: https://github.com/CLSTRE-ORG/Notesby/releases/tag/v1.0.0
