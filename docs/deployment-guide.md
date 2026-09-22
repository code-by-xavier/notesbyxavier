# Notesby — Sovereign Cloud Deployment Guide

This guide provides a comprehensive, production-grade reference for deploying **Notesby** to Google Cloud Platform (GCP) and configuring the multi-environment pipeline (Staging on Supabase and Production on Cloud SQL).

---

## 1. Multi-Environment Deployment Architecture

Notesby is architected to support two deployment tiers:

| Environment    | Database Backend                     | Connection Pattern                          | Cloud Build Pipeline      | Secret Prefix |
| :------------- | :----------------------------------- | :------------------------------------------ | :------------------------ | :------------ |
| **Staging**    | **Supabase** (Free Tier PostgreSQL)  | Direct TLS TCP via standard URL             | `cloudbuild.staging.yaml` | `STAGING_`    |
| **Production** | **Google Cloud SQL** (`db-f1-micro`) | Unix socket sidecar proxy (`/cloudsql/...`) | `cloudbuild.yaml`         | `PROD_`       |

### Why This Separation?

- **Staging on Supabase**: Zero idle compute cost, rapid testing, instant database provisioning without waiting for Cloud SQL instance creation.
- **Production on Cloud SQL**: High-security VPC locality, automatic daily backups, low latency inside the GCP region network, scale-to-zero compute on Cloud Run.

---

## 2. Cloud Build Pipelines & Environment Variables

All Cloud Build substitutions follow the CLSTRE all-caps naming convention.

### Production Pipeline (`cloudbuild.yaml`)

Deploy production with Cloud SQL sidecar proxy:

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --substitutions=_ENV="PROD",_REGION="$REGION",_SERVICE_NAME="$SERVICE_NAME",_DB_INSTANCE="$DB_INSTANCE"
```

### Staging Pipeline (`cloudbuild.staging.yaml`)

Deploy staging with Supabase (no Cloud SQL sidecar):

```bash
gcloud builds submit \
  --config=cloudbuild.staging.yaml \
  --project=$PROJECT_ID \
  --substitutions=_ENV="STAGING",_REGION="$REGION",_SERVICE_NAME="${SERVICE_NAME}-staging"
```

---

## 3. Secret Manager Naming Convention

All application secrets are stored in GCP Secret Manager and dynamically mapped to environment variables during deployment using the `${_ENV}_` prefix.

### Staging Secrets (`STAGING_`)

| Secret Name               | Value Description                                      | Example                                                                                  |
| :------------------------ | :----------------------------------------------------- | :--------------------------------------------------------------------------------------- |
| `STAGING_DATABASE_URL`    | Supabase pooled or direct PostgreSQL connection string | `postgresql://postgres.xxx:mypassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres` |
| `STAGING_SESSION_SECRET`  | 32-byte cryptographic random hex string                | Generated via `openssl rand -hex 32`                                                     |
| `STAGING_GCS_BUCKET_NAME` | GCP Storage bucket name for staging assets             | `${PROJECT_ID}-staging-media`                                                            |

### Production Secrets (`PROD_`)

| Secret Name            | Value Description                                               | Example                                                                               |
| :--------------------- | :-------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `PROD_DATABASE_URL`    | PostgreSQL connection string pointing to local Cloud SQL socket | `postgresql://user:pass@127.0.0.1:5432/dbname?host=/cloudsql/PROJECT:REGION:INSTANCE` |
| `PROD_SESSION_SECRET`  | 32-byte cryptographic random hex string (unique to prod)        | Generated via `openssl rand -hex 32`                                                  |
| `PROD_GCS_BUCKET_NAME` | GCP Storage bucket name for production editorial media          | `${PROJECT_ID}-media`                                                                 |

---

## 4. Routine Operations Cheatsheet

Once your infrastructure is provisioned, use these commands for day-to-day operations:

### View Live Streaming Logs

```bash
gcloud beta run services logs tail $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION
```

### Check Service Status & URL

```bash
gcloud run services describe $SERVICE_NAME \
  --project=$PROJECT_ID \
  --region=$REGION \
  --format="value(status.url)"
```

### List Recent Cloud Build Runs

```bash
gcloud builds list --project=$PROJECT_ID --limit=5
```

### Check Cloud SQL Database Status

```bash
gcloud sql instances describe $DB_INSTANCE --project=$PROJECT_ID
```

---

## 5. Clean-Slate Infrastructure Provisioning (DevOps Reference)

Follow this sequence to set up a brand-new Notesby deployment from scratch.

### Step 1: Set Target Variables

```bash
export PROJECT_ID="my-notesby-project"
export REGION="us-central1"
export SERVICE_NAME="notesby"
export DB_INSTANCE="${SERVICE_NAME}-db"
export DB_NAME="${SERVICE_NAME}"
export DB_USER="${SERVICE_NAME}-admin"
export GCS_BUCKET="${PROJECT_ID}-media"
export DB_PASSWORD=$(openssl rand -base64 18)
export SESSION_SECRET=$(openssl rand -hex 32)
```

### Step 2: Enable Required GCP APIs

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  iam.googleapis.com \
  --project="${PROJECT_ID}"
```

### Step 3: Provision Cloud SQL (Production)

```bash
# 1. Create Cloud SQL PostgreSQL 15 instance (minimal f1-micro tier)
gcloud sql instances create "${DB_INSTANCE}" \
  --project="${PROJECT_ID}" \
  --database-version="POSTGRES_15" \
  --tier="db-f1-micro" \
  --region="${REGION}" \
  --storage-size="10GB" \
  --storage-type="SSD" \
  --storage-auto-increase \
  --backup-start-time="03:00" \
  --retained-backups-count="7"

# 2. Create the application database
gcloud sql databases create "${DB_NAME}" \
  --instance="${DB_INSTANCE}" \
  --project="${PROJECT_ID}"

# 3. Create the database user
gcloud sql users create "${DB_USER}" \
  --instance="${DB_INSTANCE}" \
  --password="${DB_PASSWORD}" \
  --project="${PROJECT_ID}"
```

### Step 4: Provision Google Cloud Storage

```bash
# 1. Create the media bucket
gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${GCS_BUCKET}"

# 2. Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on "gs://${GCS_BUCKET}"

# 3. Grant public read access to media assets
gsutil iam ch allUsers:objectViewer "gs://${GCS_BUCKET}"

# 4. Set CORS policy for direct browser uploads
cat <<EOF > /tmp/cors.json
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 86400
  }
]
EOF
gsutil cors set /tmp/cors.json "gs://${GCS_BUCKET}"
rm /tmp/cors.json
```

### Step 5: Store Secrets in Secret Manager

```bash
DB_CONN_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
PROD_DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?host=/cloudsql/${DB_CONN_NAME}"

# Create Production Secrets
echo -n "${PROD_DB_URL}" | gcloud secrets create PROD_DATABASE_URL \
  --data-file=- --replication-policy="automatic" --project="${PROJECT_ID}"

echo -n "${SESSION_SECRET}" | gcloud secrets create PROD_SESSION_SECRET \
  --data-file=- --replication-policy="automatic" --project="${PROJECT_ID}"

echo -n "${GCS_BUCKET}" | gcloud secrets create PROD_GCS_BUCKET_NAME \
  --data-file=- --replication-policy="automatic" --project="${PROJECT_ID}"
```

### Step 6: Configure IAM Permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CLOUDRUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run Service Account permissions
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/cloudsql.client"

gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/storage.objectAdmin"

# Grant Cloud Build Service Account deployment permissions
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

### Step 7: Deploy via Cloud Build

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project="${PROJECT_ID}" \
  --substitutions=_ENV="PROD",_REGION="${REGION}",_SERVICE_NAME="${SERVICE_NAME}",_DB_INSTANCE="${DB_INSTANCE}"
```

---

## 6. Custom Domain Mapping

To map your sovereign publication to a custom domain:

```bash
gcloud beta run domain-mappings create \
  --service="${SERVICE_NAME}" \
  --domain="example.com" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"
```

Follow the DNS record verification prompts displayed by GCP in your DNS provider settings (Cloudflare, Google Domains, etc.). SSL certificate provisioning is fully automated by Google Cloud.
