# Sovereign Storage & Media Architecture

Notesby is engineered on the **Sovereign Cloud** architecture: keeping relational databases lean by delegating binary media (cover images, essay illustrations, logos, and avatars) to durable object storage.

This guide details the Sovereign Media Engine, local Google Cloud Storage emulation, production GCS deployment, sovereign media proxy routing, and multi-format binary inspection.

---

## 1. Architectural Philosophy

Traditional monolithic CMS platforms store images in the local server filesystem or as BLOBs in the database, resulting in:

- Bloated database backups and slow query execution.
- Fragile container state when deploying ephemeral containers to Google Cloud Run.
- Expensive egress bandwidth and complex backup restores.

Notesby solves this through **Google Cloud Storage (GCS)** paired with an authenticated sovereign media proxy:

- **Cloud Run Native**: Ephemeral containers remain completely stateless and scale to zero when dormant.
- **Cost**: Media hosting costs pennies per gigabyte per month on Google Cloud Storage.
- **Universal Format Support**: Deep magic-byte inspection handles PNG, JPEG, WebP, AVIF, GIF, SVG, and ICO seamlessly.
- **Sovereign Proxy**: A dedicated streaming proxy (`/api/media/[...filename]`) serves assets on the application's primary port with aggressive edge caching, bypassing cross-origin blocks and private bucket 403s.

---

## 2. Storage Client Engine (`src/lib/storage.ts`)

Notesby uses `@google-cloud/storage` with adaptive routing that automatically detects whether it is running locally, in Docker emulation, or in GCP production.

### Local Development vs. Production Topology

| Environment             | Storage Provider           | Endpoint                     | URL Format                                           |
| :---------------------- | :------------------------- | :--------------------------- | :--------------------------------------------------- |
| **Local Dev / Offline** | Sovereign Media Proxy      | Local App Port (`:4330`)     | `/api/media/{filename}` or `/uploads/{filename}`     |
| **Local Emulator**      | `fake-gcs-server` (Docker) | `http://localhost:4443`      | `http://localhost:4443/{bucket}/{filename}`          |
| **GCP Production**      | Google Cloud Storage       | Native Cloud Run ADC         | `https://storage.googleapis.com/{bucket}/{filename}` |
| **CDN / Reverse Proxy** | Custom Origin              | `process.env.GCS_PUBLIC_URL` | `{GCS_PUBLIC_URL}/{bucket}/{filename}`               |

### Automatic Bucket Provisioning & Public Access

When the application boots or receives its first upload, `ensureBucket()`:

1. Verifies whether the target bucket (default: `notesby-media`) exists.
2. If missing, creates the bucket in the configured region (e.g. `US-CENTRAL1`).
3. Sets `roles/storage.objectViewer` on `allUsers` so readers across the globe can view essay images and publication branding without permission barriers.

### Resilient File Saving

```typescript
await file.save(buffer, {
  contentType: mimeType,
  resumable: false,
  metadata: {
    cacheControl: 'public, max-age=31536000',
  },
});
```

### Graceful Local Filesystem Fallback

If Docker or the GCS emulator is offline during development, `uploadMedia()` catches the error and writes the file to `public/uploads/{filename}`, returning `/uploads/{filename}`. Your writing workflow is never blocked.

---

## 3. Sovereign Media Asset Proxy (`src/pages/api/media/[...filename].ts`)

To protect against cross-origin port isolation in Docker, dev tunnel issues, or organization-level GCS public-access restrictions, Notesby includes a built-in media streaming proxy:

- **Route**: `GET /api/media/[...filename]`
- **Security**: Validates against directory traversal attacks (`path.basename`).
- **Streaming**: Streams binary buffers from GCS (or local fallback) with optimal headers:
  ```http
  HTTP/1.1 200 OK
  Content-Type: image/png (or detected MIME)
  Cache-Control: public, max-age=31536000, immutable
  Access-Control-Allow-Origin: *
  ```

---

## 4. Multi-Format Upload Engine (`src/pages/api/upload.ts`)

Notesby exposes an authenticated multipart upload endpoint equipped with deep binary inspection:

- **Authentication**: Requires a valid admin session cookie; unauthenticated requests receive `401 Unauthorized`.
- **Magic-Byte Binary Inspection**:
  - **PNG**: `89 50 4E 47 0D 0A 1A 0A`
  - **JPEG**: `FF D8 FF`
  - **GIF**: `GIF87a` / `GIF89a`
  - **WebP**: `RIFF....WEBP`
  - **AVIF**: `ftypavif` / `ftypavis`
  - **ICO**: `00 00 01 00`
  - **SVG**: XML text inspection for `<svg` tags
- **Payload Limits**: Max file size is 5MB per upload.
- **Collision-Proof Naming**: Generates timestamps + cryptographic hex hashes (`media-{timestamp}-{hash}.{ext}`).

---

## 5. Cover Image Presentation & SEO

### Homepage Feed vs. Reader Page

- **Homepage Sliders**: Note cards remain pure editorial text with title, date, reading time, and subtitle.
- **Reading Page (`/notes/[slug]/`)**: When a note has a `coverImage`, it renders as a hero image directly beneath the `H1` title and reading metadata banner.

### Social Graph & Structured Data

Uploaded cover images automatically hydrate rich social previews:

- **OpenGraph**: `<meta property="og:image" content="..." />`
- **Twitter Cards**: `<meta name="twitter:card" content="summary_large_image" />`
- **JSON-LD Schema**: Included in `Schema.org/Article` structured data for Google search engine rich snippets.
