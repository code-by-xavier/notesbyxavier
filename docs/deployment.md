# Deployment Guide for Notesby

Notesby is engineered for sovereign cloud ownership, specifically optimized for **Google Cloud Platform (GCP)** while maintaining complete portability to run on any container host or VPS.

> 💡 **Looking for the command cheatsheet and operations lifecycle?** See the [Deployment Lifecycle & Command Cheatsheet](./deployment-guide.md).

---

## ⚡ Option A — 1-Click Google Cloud Shell Deploy (Recommended)

The fastest path to a live Notesby publication. No software to install — everything runs inside Google Cloud Shell, which is already authenticated to your GCP account.

### How it works

1. Click the **"Deploy to Google Cloud"** button on [clstre.com](https://clstre.com).
2. Google Cloud Shell opens in your browser, already authenticated.
3. The `scripts/setup-gcp.sh` script runs interactively and provisions:
   - **Cloud SQL** (`db-f1-micro` PostgreSQL) — ~$7/mo
   - **GCS Bucket** — public media storage
   - **Secret Manager** — `DATABASE_URL` + `SESSION_SECRET`
   - **Cloud Run** — containerized Notesby app
   - **DB migrations** — runs automatically as a one-off Cloud Run Job
4. The script prints your live URL and setup wizard link.

### Run manually (any time)

```bash
# Inside Google Cloud Shell (already authenticated):
bash <(curl -sSL https://raw.githubusercontent.com/CLSTRE-ORG/Notesby/main/scripts/setup-gcp.sh)
```

### 5-Step Setup Wizard

After provisioning, open your setup wizard URL (e.g. `https://notesby-xxxx-uc.a.run.app/setup`):

| Step               | What happens                                             |
| :----------------- | :------------------------------------------------------- |
| **1 — Connection** | Real-time DB + GCS health checks — must pass to continue |
| **2 — Identity**   | Name your publication, author name, bio, domain          |
| **3 — Account**    | Set your master admin email + password (bcrypt-hashed)   |
| **4 — Branding**   | Optional: upload a profile photo (saved to GCS)          |
| **5 — Launch**     | Review + claim your publication, land in Notesby Studio  |

> The setup route (`/setup`) is permanently locked after first use. Revisiting it redirects to `/admin/login`.

---

## 🔧 Option B — GitOps / Terraform (DevOps)

Use the `cloudbuild.yaml` and `terraform/` module for automated CI/CD pipelines.

---

## 1. Google Cloud Run (Manual Steps Reference)

Google Cloud Run provides the optimal production home for Notesby:

- **Scales to Zero**: Zero compute cost when dormant.
- **Micro Cloud SQL**: Connects to `db-f1-micro` PostgreSQL over private VPC or Cloud SQL Auth Proxy.
- **Sovereign Media**: Directly offloads media to Google Cloud Storage (`notesby-media`).
- **Predictable Cost**: Full sovereign ownership for ~$10–$15/month.

### Step 1: Environment Variables on Cloud Run

Configure the following environment variables in your Cloud Run service:

| Variable          | Example Value                                                            | Description                       |
| :---------------- | :----------------------------------------------------------------------- | :-------------------------------- |
| `NODE_ENV`        | `production`                                                             | Production mode                   |
| `PORT`            | `8080`                                                                   | Default Cloud Run port            |
| `PUBLIC_SITE_URL` | `https://yourdomain.com`                                                 | Live public publication URL       |
| `DATABASE_URL`    | `postgresql://user:pass@/notesby?host=/cloudsql/project:region:instance` | Cloud SQL socket or host          |
| `SESSION_SECRET`  | `(32+ character random string)`                                          | Secure session cookie signing key |
| `GCS_BUCKET_NAME` | `notesby-media`                                                          | Production GCS bucket name        |
| `GCP_PROJECT_ID`  | `your-gcp-project-id`                                                    | GCP Project ID                    |

### Step 2: Service Account IAM Permissions

Grant the Cloud Run runtime service account the necessary permissions to access Cloud SQL, Secret Manager, and Google Cloud Storage:

```bash
export PROJECT_ID="your-gcp-project-id"
export PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
export CLOUDRUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
export GCS_BUCKET="your-gcs-bucket-name"

# Cloud SQL client
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/cloudsql.client"

# Secret Manager access
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Google Cloud Storage Object Admin (Project & Bucket level)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/storage.objectAdmin"

gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/storage.objectAdmin"
```

### Step 3: Build and Deploy to Cloud Run

```bash
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"
export SERVICE_NAME="notesby"

# Build container image with Google Cloud Build
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest

# Deploy to Cloud Run
gcloud run deploy ${SERVICE_NAME} \
  --image gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 5
```

### Step 4: Map Custom Domain

```bash
gcloud beta run domain-mappings create \
  --service ${SERVICE_NAME} \
  --domain yourdomain.com \
  --region ${REGION}
```

Google automatically provisions managed SSL certificates for your custom domain within minutes.

---

## 2. Self-Hosted Docker (Any Linux VPS / Portainer)

You can run Notesby on any Linux server (Debian, Ubuntu, AlmaLinux):

```bash
# 1. Clone repository
git clone https://github.com/CLSTRE-ORG/Notesby.git
cd Notesby

# 2. Configure production .env
cp .env.template .env
nano .env

# 3. Spin up Docker containers
docker compose -f docker-compose.yml up -d
```

---

## 3. Pre-Deployment Integrity Checklist

Before deploying changes to production, always verify project integrity:

```bash
# 1. Format code
pnpm run format

# 2. Run the 8-phase platform integrity suite
pnpm run validate

# 3. Test compile the production bundle
pnpm run build
```
