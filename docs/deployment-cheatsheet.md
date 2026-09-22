# Notesby — Deployment Lifecycle & Command Cheatsheet

This guide provides a definitive reference for the deployment lifecycle of **Notesby**, detailing what commands to run, how frequently you run them, how other users deploy, and the complete step-by-step sequence.

---

## 1. Quick Answers: How Often & Who Runs What?

### Q1: How often will I need to run those deployment commands?

- **Infrastructure Commands (Cloud SQL, GCS, Secrets, IAM)**: **RUN ONCE (EVER).**
  You never need to re-run the commands that created your PostgreSQL database, storage bucket, or service account permissions. They are permanent cloud assets.

- **Code Updates (When you change code or publish updates)**: **RUN 1 COMMAND.**
  Whenever you make changes to your codebase and want them live, you only run:

  ```bash
  gcloud builds submit --config=cloudbuild.yaml --project=notesbyxavier
  ```

  _(Or if you connect Cloud Build to GitHub, you run **0 commands** — pushing to `main` deploys automatically)._

### Q2: Will other users need to do the same sequence?

- **NO.** Regular users and non-technical creators **do not** run terminal commands manually.
- Other users deploy via the **"1-Click Google Cloud Shell Deploy"** button on `clstre.com` or `notesbyxavier.com`.
- When they click the button:
  1. Google Cloud Shell opens in their browser (pre-authenticated).
  2. The interactive script (`scripts/setup-gcp.sh`) runs automatically.
  3. It prompts them for 4 basic inputs: Project ID, Region, Service Name, and a DB Password.
  4. The script executes the entire infrastructure creation, builds the container, and deploys it.
  5. It prints the live publication URL and setup wizard link (`/admin/setup`).

### Q3: What happens when you test with a different email?

- When you log into Google Cloud with a fresh account and click the **Deploy to Google Cloud** button, you will experience the automated non-technical flow. Cloud Shell will launch, run `scripts/setup-gcp.sh`, provision their dedicated GCP project resources, and present them with the 5-step Web Setup Wizard (`/admin/setup`).

---

## 2. Routine Operations Cheatsheet (For Your Active Project)

Keep these everyday commands handy:

### Deploy Code Changes

```bash
# From your workspace root:
gcloud builds submit --config=cloudbuild.yaml --project=notesbyxavier
```

### View Live Streaming Logs

```bash
gcloud beta run services logs tail notesbyxavier \
  --project=notesbyxavier \
  --region=us-central1
```

### Check Service Status & Current URL

```bash
gcloud run services describe notesbyxavier \
  --project=notesbyxavier \
  --region=us-central1 \
  --format="value(status.url)"
```

### List Recent Cloud Build Runs

```bash
gcloud builds list --project=notesbyxavier --limit=5
```

### Check Cloud SQL Database Status

```bash
gcloud sql instances describe notesbyxavier-db --project=notesbyxavier
```

---

## 3. The Full Complete Sequence (DevOps / Manual Reference)

Below is the complete, chronological sequence executed to provision Notesby from a clean slate.

### Phase 1: Environment Variables

```bash
export PROJECT_ID="notesbyxavier"
export REGION="us-central1"
export SERVICE_NAME="notesbyxavier"
export DB_INSTANCE="${SERVICE_NAME}-db"
export DB_NAME="${SERVICE_NAME}"
export DB_USER="${SERVICE_NAME}"
export GCS_BUCKET="${PROJECT_ID}-media"
export DB_PASSWORD="YourSecurePasswordHere123!"
export SESSION_SECRET=$(openssl rand -hex 32)
```

### Phase 2: Enable Required GCP APIs

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

### Phase 3: Cloud SQL (PostgreSQL db-f1-micro)

```bash
# 1. Create Cloud SQL PostgreSQL 15 instance
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

### Phase 4: Google Cloud Storage (Media Bucket)

```bash
# 1. Create the bucket
gsutil mb -p "${PROJECT_ID}" -l "${REGION}" "gs://${GCS_BUCKET}"

# 2. Enable uniform bucket-level access
gsutil uniformbucketlevelaccess set on "gs://${GCS_BUCKET}"

# 3. Make editorial media publicly readable
gsutil iam ch allUsers:objectViewer "gs://${GCS_BUCKET}"

# 4. Apply CORS policy for in-browser uploads
cat <<'EOF' > /tmp/cors.json
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

### Phase 5: Secret Manager

```bash
DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# Store DATABASE_URL
echo -n "${DATABASE_URL}" | gcloud secrets create notesby-database-url \
  --data-file=- \
  --replication-policy="automatic" \
  --project="${PROJECT_ID}"

# Store SESSION_SECRET
echo -n "${SESSION_SECRET}" | gcloud secrets create notesby-session-secret \
  --data-file=- \
  --replication-policy="automatic" \
  --project="${PROJECT_ID}"

# Store GCS_BUCKET_NAME
echo -n "${GCS_BUCKET}" | gcloud secrets create notesby-gcs-bucket \
  --data-file=- \
  --replication-policy="automatic" \
  --project="${PROJECT_ID}"
```

### Phase 6: Service Account & IAM Permissions

```bash
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CLOUDRUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
CLOUDBUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

# Grant Cloud Run SA access to Secrets
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Grant Cloud Run SA access to Cloud SQL
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/cloudsql.client"

# Grant Cloud Run SA access to GCS (both project-level and bucket-level)
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/storage.objectAdmin"

gcloud storage buckets add-iam-policy-binding "gs://${GCS_BUCKET}" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/storage.objectAdmin"

# Grant Cloud Build SA permissions to deploy to Cloud Run
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${CLOUDBUILD_SA}" \
  --role="roles/iam.serviceAccountUser"
```

### Phase 7: Build & Deploy to Cloud Run

```bash
# Build and deploy via cloudbuild.yaml
gcloud builds submit --config=cloudbuild.yaml --project="${PROJECT_ID}"

# Allow public unauthenticated web access
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --region="${REGION}" \
  --project="${PROJECT_ID}" \
  --member="allUsers" \
  --role="roles/run.invoker"
```

### Phase 8: Custom Domain Mapping (Optional)

```bash
gcloud beta run domain-mappings create \
  --service="${SERVICE_NAME}" \
  --domain="notesbyxavier.com" \
  --region="${REGION}" \
  --project="${PROJECT_ID}"
```

---

## 4. Comparing User Personas

| Feature               | You (The Architect / DevOps)             | New Users / Creators                                        |
| :-------------------- | :--------------------------------------- | :---------------------------------------------------------- |
| **Deployment Method** | Local workspace + `gcloud builds submit` | **1-Click Button** (Cloud Shell)                            |
| **Terminal Commands** | Only 1 command to push code updates      | **0 manual commands**                                       |
| **Setup Experience**  | Manual CLI or Cloud Build automation     | Automated interactive prompts + Web Wizard (`/admin/setup`) |
| **Code Access**       | Full Git repository access               | Cloned automatically into Cloud Shell                       |
| **Cost**              | ~$10–$15/mo on GCP                       | ~$10–$15/mo on their own GCP account                        |
