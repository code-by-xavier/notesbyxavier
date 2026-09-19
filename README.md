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

- **Field Notes**: Rapid dispatches, benchmarks, and micro-observations (100–300 words). Replaces the impulse to publish thoughts onto closed social platforms like X/Twitter.
- **Editorial Essays**: Long-form, deep-dive architectural blueprints and research with automated tables of contents and reading times.
- **Op-Eds**: Focused, sharp perspectives on technology, design, and digital sovereignty.

### 3. The "Zen Studio" Editor (For Non-Tech Writers)

- In-browser, distraction-free writing environment (feels like _iA Writer meets Notion_).
- Clean canvas with intuitive slash commands (`/h2`, `/quote`, `/code`, `/image`).
- Live auto-saving drafts and one-click instant publishing.
- True-to-life typography preview: writing in the studio looks identical to the live publication.

### 4. Distraction-Free Reader Experience

- **Zero bloat**: No cookie popups, no newsletter gatewalls, no tracking scripts.
- **Editorial typography**: High-contrast typography with smooth dark/light mode switching (`#075aaa` brand accents).
- **Syndication**: Automated clean RSS feed and reading progress tracking.

---

## Getting Started

### Path A: Developers & DevOps (CLI & Docker)

```bash
# 1. Clone repository
git clone https://github.com/CLSTRE-ORG/Notesby.git
cd Notesby

# 2. Install dependencies
pnpm install

# 3. Start local writing server (port 4330)
pnpm dev

# 4. Validate & build for production
pnpm validate
pnpm build
```

### Path B: 1-Click Launch & Download (The Open Source Creator Model)

Similar to downloading open-source creative suites like **Inkscape**:

1. Click **Deploy Notesby** on [clstre.com](https://clstre.com) or download the turnkey setup script.
2. Enter your GCP Project ID and custom domain.
3. Open your live publication and complete the **Welcome Onboarding Wizard** (`/setup`) to configure your author bio, avatar, and secure admin credentials.
4. Step immediately into the **Zen Studio** and write your first note.

---

## Documentation

- **[Architecture & AI Agent Guide](AGENTS.md)** — Architectural decisions, tech stack specifications, and agent rules.
- **[Authoring Guide](docs/authoring-guide.md)** — Writing notes, formatting essays, and setting categories.
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
