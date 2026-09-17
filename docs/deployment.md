# Deployment Guide for Notesby

Notesby is built with Astro in static output mode (`output: 'static'`). It compiles down to pure HTML, CSS, and zero-runtime client JavaScript, making it deployable anywhere with sub-second speeds.

---

## 1. Google Cloud Run (Recommended for CLSTRE Ecosystem)

Notesby includes a multi-stage, production-ready `Dockerfile` that serves static files using an Alpine Nginx image weighing under 25MB.

### Step 1: Build and Tag Docker Image

```bash
# Set your GCP Project ID and Region
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE_NAME="notesby"

# Build image with Google Cloud Build or local Docker
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest
```

### Step 2: Deploy to Cloud Run

```bash
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5
```

### Step 3: Map Custom Domain

```bash
gcloud beta run domain-mappings create \
  --service ${SERVICE_NAME} \
  --domain yourdomain.com \
  --region ${REGION}
```

---

## 2. Cloudflare Pages

Cloudflare Pages provides instant global edge deployment with zero configuration:

1. Connect your GitHub repository (`CLSTRE-ORG/notesby`).
2. Set the build configuration:
   - **Framework preset**: Astro
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Node.js version**: 20 or 22 (Environment variable: `NODE_VERSION=22`)
3. Click **Deploy**.

---

## 3. Vercel

1. Import the repository from GitHub in the Vercel Dashboard.
2. Vercel will automatically detect Astro:
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
3. Deploy.

---

## 4. Self-Hosted Docker (Any Linux VPS / Portainer)

```bash
# Build local container image
docker build -t notesby:latest .

# Run container on port 80 or 8080
docker run -d -p 8080:8080 --name notesby-app notesby:latest
```

---

## Pre-Deployment Verification Checklist

Before pushing to production, always run the validation suite:

```bash
# Run validation check (validates config, content collections, and Astro types)
pnpm validate

# Run production build test
pnpm build
```
