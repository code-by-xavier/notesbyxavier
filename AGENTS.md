# Notesby — AI Agent & Developer Architecture Guide

> **Core Philosophy**: *"Simplicity is my prerequisite for reliability."*
>
> **Brand**: CLSTRE Ecosystem ([clstre.com](https://clstre.com))
>
> **Author & Lead Architect**: Xavier Lawrence ([notesbyxavier.com](https://notesbyxavier.com))

---

## 1. Product Vision & Positioning

**Notesby** is an open-source, sovereign publishing engine designed for serious thinkers, essayists, researchers, and technical architects.

Unlike bloated legacy CMSs (WordPress) or newsletter-centric subscription platforms (Ghost, Substack), Notesby is built on four distinct pillars:

### Pillar 1: The Native GCP "Sovereign Cloud" Moat

- Turnkey deployment specifically optimized for **Google Cloud Platform (GCP)**.
- Combines **Cloud Run** (blazing fast, containerized, scale-to-zero) with **Cloud SQL (`db-f1-micro` PostgreSQL)** and **Google Cloud Storage (GCS)**.
- Delivers enterprise-grade Google edge networking, automatic SSL, and high security for a modest, predictable cost (~$10–$15/mo) without vendor lock-in.

### Pillar 2: The "Notes vs. Essays" Editorial Hierarchy

Every post is a note, but content is structured into three distinct editorial primitives:

1. **Field Notes**: Short-form dispatches, raw observations, micro-essays, and engineering benchmarks (100–300 words). Replaces the impulse to post thoughts to closed platforms like X/Twitter.
2. **Editorial Essays**: Long-form, deep-dive architectural blueprints and research with rich typography, table of contents, and reading times.
3. **Op-Eds**: Focused, sharp perspectives on technology, design, and digital sovereignty.

### Pillar 3: The "Zen Studio" Editor

- A distraction-free in-browser writing experience (like iA Writer meets Notion).
- Single canvas, slash commands (`/h2`, `/quote`, `/code`, `/image`), auto-saving drafts.
- True-to-life typography preview: writing looks identical to the live publication.
- One-click instant publishing.

### Pillar 4: Distraction-Free Reader Experience

- Zero cookie banners, zero tracking scripts, zero intrusive popups.
- High-contrast editorial typography, accessible dark/light mode toggle with CLSTRE brand blue (`#075aaa`) accents.
- Built-in RSS feed and automatic reading time calculation.

---

## 2. Core Architecture & Tech Stack

Any AI developer working on Notesby must adhere to the following architectural decisions:

| Layer | Technology | Decision & Rationale |
| :--- | :--- | :--- |
| **Framework** | **Astro 5** | Hybrid SSR with `@astrojs/node`. Reader pages are statically pre-rendered & edge-cached; admin & APIs run dynamically. |
| **Styling** | **Vanilla CSS & SCSS** | Clean CSS custom properties, no heavy utility frameworks (Tailwind avoided). Brand blue: `#075aaa`. |
| **Database** | **PostgreSQL (Cloud SQL `db-f1-micro`)** | Open-source relational standard. Capacity: 50,000–100,000+ articles without upgrading. |
| **ORM** | **Drizzle ORM** | Type-safe, zero runtime overhead, compiles to raw SQL, instantaneous container boot. |
| **Media / Assets** | **Google Cloud Storage (GCS)** | Images and media are stored in GCS buckets, keeping the database light. |
| **Compute / Host** | **Google Cloud Run** | Docker container, port 8080, memory 256Mi–512Mi, scales to zero when dormant. |
| **Cache / Queue** | **NO REDIS** | Redis is strictly avoided to prevent cost (~$40/mo) and architectural bloat. Indexed DB reads take <2ms; Astro handles page caching. |

---

## 3. Distribution & Onboarding Roadmap

Notesby is engineered to support two distinct onboarding personas:

### A. Technical Developers / DevOps

- Standard Git clone, `pnpm dev`, Docker, and turnkey **Terraform** (`terraform/`) module provisioning GCP Cloud Run + Cloud SQL + GCS.

### B. Non-Technical Creators ("1-Click / Download & Launch")

- Similar to open-source platforms like Inkscape or Ghost:
  1. Users click a button on `clstre.com` or `notesbyxavier.com` to download a lightweight launcher / setup script or trigger a 1-click Google Cloud deploy.
  2. The system prompts for a project name and domain.
  3. The web onboarding wizard (`/setup`) automatically opens, prompting the writer to set their Name, Bio, and initial password.
  4. The user is immediately dropped into the **Zen Studio** to write their first note.

---

## 4. Key Engineering Constraints for AI Agents

1. **Preserve Upstream Boundaries**: Bespoke user code must remain modular so that users can sync updates from `CLSTRE-ORG/Notesby` without merge conflicts (see `docs/upstream-sync.md`).
2. **Keep Dependencies Lean**: Avoid introducing heavy npm packages or client-side JavaScript libraries unless essential.
3. **Validate Thoroughly**: Always run `pnpm validate` (`tsx ./scripts/validate.ts && astro check && tsc --noEmit`) before committing code.
