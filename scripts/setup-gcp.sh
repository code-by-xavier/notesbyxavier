#!/usr/bin/env bash
# ==============================================================================
# File: scripts/setup-gcp.sh
# Notesby — Google Cloud Platform Sovereign Cloud Provisioning Script
#
# PURPOSE:
#   Provisions all GCP infrastructure needed to run Notesby in under 4 minutes
#   inside Google Cloud Shell (no local installation required).
#
# WHAT IT CREATES:
#   ├── Cloud SQL (db-f1-micro) — PostgreSQL database
#   ├── Google Cloud Storage    — Media & assets bucket (public read)
#   ├── Secret Manager          — DATABASE_URL + SESSION_SECRET
#   ├── Cloud Run Service       — Containerized Notesby app (port 8080)
#   └── IAM bindings            — Minimal-privilege SA roles
#
# USAGE (inside Google Cloud Shell):
#   bash <(curl -sSL https://raw.githubusercontent.com/CLSTRE-ORG/Notesby/main/scripts/setup-gcp.sh)
#
# Or clone and run locally:
#   bash scripts/setup-gcp.sh
# ==============================================================================

set -euo pipefail

# ─────────────────────────────────────────────────────────────
# 0. COLORS & HELPERS
# ─────────────────────────────────────────────────────────────
BOLD="\033[1m"
BLUE="\033[34m"
GREEN="\033[32m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

info()    { echo -e "${BLUE}${BOLD}  →${RESET} $*"; }
success() { echo -e "${GREEN}${BOLD}  ✓${RESET} $*"; }
warn()    { echo -e "${YELLOW}${BOLD}  ⚠${RESET} $*"; }
error()   { echo -e "${RED}${BOLD}  ✗ ERROR:${RESET} $*" >&2; exit 1; }
header()  { echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════${RESET}"; echo -e "${BOLD}  $*${RESET}"; echo -e "${BOLD}${BLUE}═══════════════════════════════════════${RESET}\n"; }

# ─────────────────────────────────────────────────────────────
# 1. PREFLIGHT — check required tools
# ─────────────────────────────────────────────────────────────
header "Notesby — Sovereign Cloud Provisioning"

for cmd in gcloud openssl; do
  command -v "$cmd" &>/dev/null || error "Required command not found: $cmd. Run this script inside Google Cloud Shell."
done

# ─────────────────────────────────────────────────────────────
# 2. GATHER CONFIGURATION
# ─────────────────────────────────────────────────────────────
# Detect current GCP project
DETECTED_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")

echo -e "\n${BOLD}Let's configure your Notesby deployment.${RESET}\n"

# Project ID
if [[ -n "$DETECTED_PROJECT" ]]; then
  read -rp "  GCP Project ID [${DETECTED_PROJECT}]: " PROJECT_ID
  PROJECT_ID="${PROJECT_ID:-$DETECTED_PROJECT}"
else
  read -rp "  GCP Project ID: " PROJECT_ID
fi
[[ -z "$PROJECT_ID" ]] && error "Project ID is required."

# Region
read -rp "  GCP Region [us-central1]: " REGION
REGION="${REGION:-us-central1}"

# Service / app name
read -rp "  Service Name [notesby]: " SERVICE_NAME
SERVICE_NAME="${SERVICE_NAME:-notesby}"

# DB password
while true; do
  read -rsp "  PostgreSQL Password (min 16 chars): " DB_PASSWORD
  echo
  if [[ ${#DB_PASSWORD} -ge 16 ]]; then
    break
  fi
  warn "Password must be at least 16 characters. Try again."
done

# Derive names
DB_INSTANCE="${SERVICE_NAME}-db"
DB_NAME="${SERVICE_NAME}"
DB_USER="${SERVICE_NAME}"
GCS_BUCKET="${PROJECT_ID}-${SERVICE_NAME}-media"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"
SESSION_SECRET=$(openssl rand -hex 32)

echo ""
info "Project  : ${PROJECT_ID}"
info "Region   : ${REGION}"
info "Service  : ${SERVICE_NAME}"
info "DB       : ${DB_INSTANCE} (db-f1-micro)"
info "GCS      : gs://${GCS_BUCKET}"
info "Image    : ${IMAGE}"
echo ""

read -rp "  Proceed? [Y/n]: " CONFIRM
CONFIRM="${CONFIRM:-Y}"
[[ ! "$CONFIRM" =~ ^[Yy]$ ]] && { echo "Aborted."; exit 0; }

# ─────────────────────────────────────────────────────────────
# 3. ENABLE REQUIRED APIS
# ─────────────────────────────────────────────────────────────
header "Enabling GCP APIs"

APIS=(
  "run.googleapis.com"
  "sqladmin.googleapis.com"
  "storage.googleapis.com"
  "secretmanager.googleapis.com"
  "cloudbuild.googleapis.com"
  "containerregistry.googleapis.com"
  "iam.googleapis.com"
)

gcloud services enable "${APIS[@]}" --project="$PROJECT_ID" --quiet
success "All required APIs enabled."

# ─────────────────────────────────────────────────────────────
# 4. CLOUD SQL — PostgreSQL db-f1-micro
# ─────────────────────────────────────────────────────────────
header "Provisioning Cloud SQL (PostgreSQL db-f1-micro)"

if gcloud sql instances describe "$DB_INSTANCE" --project="$PROJECT_ID" &>/dev/null; then
  warn "Cloud SQL instance '${DB_INSTANCE}' already exists — skipping creation."
else
  info "Creating Cloud SQL instance (this may take 2–4 minutes)…"
  gcloud sql instances create "$DB_INSTANCE" \
    --project="$PROJECT_ID" \
    --database-version="POSTGRES_15" \
    --tier="db-f1-micro" \
    --region="$REGION" \
    --storage-size="10GB" \
    --storage-type="SSD" \
    --storage-auto-increase \
    --backup-start-time="03:00" \
    --retained-backups-count="7" \
    --no-assign-ip \
    --quiet
  success "Cloud SQL instance created."
fi

# Create database
gcloud sql databases create "$DB_NAME" \
  --instance="$DB_INSTANCE" \
  --project="$PROJECT_ID" \
  --quiet 2>/dev/null || warn "Database '${DB_NAME}' already exists — skipping."

# Create user
gcloud sql users create "$DB_USER" \
  --instance="$DB_INSTANCE" \
  --password="$DB_PASSWORD" \
  --project="$PROJECT_ID" \
  --quiet 2>/dev/null || warn "User '${DB_USER}' already exists — skipping."

success "PostgreSQL database ready: ${DB_NAME}@${DB_INSTANCE}"

# Build connection strings
DB_CONNECTION_NAME="${PROJECT_ID}:${REGION}:${DB_INSTANCE}"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

# ─────────────────────────────────────────────────────────────
# 5. GOOGLE CLOUD STORAGE BUCKET
# ─────────────────────────────────────────────────────────────
header "Provisioning GCS Media Bucket"

if gsutil ls "gs://${GCS_BUCKET}" &>/dev/null; then
  warn "Bucket 'gs://${GCS_BUCKET}' already exists — skipping creation."
else
  gsutil mb -p "$PROJECT_ID" -l "$REGION" "gs://${GCS_BUCKET}"
  success "Bucket created: gs://${GCS_BUCKET}"
fi

# Enable uniform bucket-level access and public read for editorial media
gsutil uniformbucketlevelaccess set on "gs://${GCS_BUCKET}"
gsutil iam ch allUsers:objectViewer "gs://${GCS_BUCKET}"
success "Bucket is publicly readable (suitable for editorial image hosting)."

# Set CORS for browser uploads
cat > /tmp/notesby-cors.json <<'EOF'
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 86400
  }
]
EOF
gsutil cors set /tmp/notesby-cors.json "gs://${GCS_BUCKET}"
success "CORS policy applied to bucket."

# ─────────────────────────────────────────────────────────────
# 6. SECRET MANAGER
# ─────────────────────────────────────────────────────────────
header "Storing Secrets in Secret Manager"

create_or_update_secret() {
  local name="$1"
  local value="$2"
  if gcloud secrets describe "$name" --project="$PROJECT_ID" &>/dev/null; then
    echo "$value" | gcloud secrets versions add "$name" \
      --data-file=- \
      --project="$PROJECT_ID" \
      --quiet
    info "Secret '${name}' version updated."
  else
    echo "$value" | gcloud secrets create "$name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project="$PROJECT_ID" \
      --quiet
    success "Secret '${name}' created."
  fi
}

create_or_update_secret "notesby-database-url"    "$DATABASE_URL"
create_or_update_secret "notesby-session-secret"  "$SESSION_SECRET"
create_or_update_secret "notesby-gcs-bucket"      "$GCS_BUCKET"

success "All secrets stored in Secret Manager."

# ─────────────────────────────────────────────────────────────
# 7. BUILD & PUSH CONTAINER IMAGE
# ─────────────────────────────────────────────────────────────
header "Building Container Image"

# Ensure we're in the repo root
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

info "Submitting Cloud Build (this builds your Docker image on GCP)…"
gcloud builds submit \
  --project="$PROJECT_ID" \
  --tag="$IMAGE" \
  --timeout="15m" \
  --quiet \
  .

success "Image built and pushed: ${IMAGE}"

# ─────────────────────────────────────────────────────────────
# 8. IAM — Grant Cloud Run SA minimal permissions
# ─────────────────────────────────────────────────────────────
header "Configuring IAM"

# Compute default SA used by Cloud Run
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
CLOUDRUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

info "Granting Cloud Run SA access to Secret Manager…"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None \
  --quiet >/dev/null

info "Granting Cloud Run SA access to Cloud SQL…"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${CLOUDRUN_SA}" \
  --role="roles/cloudsql.client" \
  --condition=None \
  --quiet >/dev/null

info "Granting Cloud Run SA access to GCS bucket…"
gsutil iam ch "serviceAccount:${CLOUDRUN_SA}:roles/storage.objectAdmin" "gs://${GCS_BUCKET}"

success "IAM bindings applied."

# ─────────────────────────────────────────────────────────────
# 9. DEPLOY TO CLOUD RUN
# ─────────────────────────────────────────────────────────────
header "Deploying to Cloud Run"

info "Deploying ${SERVICE_NAME} to Cloud Run in ${REGION}…"

gcloud run deploy "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --image="$IMAGE" \
  --region="$REGION" \
  --platform="managed" \
  --allow-unauthenticated \
  --port=8080 \
  --memory="256Mi" \
  --cpu="1" \
  --min-instances=0 \
  --max-instances=3 \
  --add-cloudsql-instances="${DB_CONNECTION_NAME}" \
  --update-secrets="DATABASE_URL=notesby-database-url:latest,SESSION_SECRET=notesby-session-secret:latest,GCS_BUCKET_NAME=notesby-gcs-bucket:latest" \
  --set-env-vars="NODE_ENV=production,HOST=0.0.0.0,PORT=8080,NOTESBY_SETUP_COMPLETED=false" \
  --quiet

LIVE_URL=$(gcloud run services describe "$SERVICE_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --format="value(status.url)")

success "Cloud Run service deployed: ${LIVE_URL}"

# ─────────────────────────────────────────────────────────────
# 10. RUN DB MIGRATIONS (Cloud Run Job)
# ─────────────────────────────────────────────────────────────
header "Running Database Migrations"

info "Executing drizzle-kit migrate as a one-off Cloud Run Job…"

JOB_NAME="${SERVICE_NAME}-migrate-$(date +%s)"

gcloud run jobs create "$JOB_NAME" \
  --project="$PROJECT_ID" \
  --image="$IMAGE" \
  --region="$REGION" \
  --add-cloudsql-instances="${DB_CONNECTION_NAME}" \
  --update-secrets="DATABASE_URL=notesby-database-url:latest" \
  --set-env-vars="NODE_ENV=production" \
  --command="node" \
  --args="./node_modules/.bin/drizzle-kit,migrate" \
  --max-retries=1 \
  --quiet

gcloud run jobs execute "$JOB_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --wait \
  --quiet

success "Database migrations applied."

# Clean up migration job
gcloud run jobs delete "$JOB_NAME" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --quiet 2>/dev/null || true

# ─────────────────────────────────────────────────────────────
# 11. DONE — Print summary
# ─────────────────────────────────────────────────────────────
SETUP_URL="${LIVE_URL}/setup"

echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════════╗${RESET}"
echo -e "${GREEN}${BOLD}║   🚀  Notesby is live on Google Cloud!           ║${RESET}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════════╝${RESET}"
echo ""
echo -e "  ${BOLD}Publication URL:${RESET}  ${LIVE_URL}"
echo -e "  ${BOLD}Setup Wizard:${RESET}     ${SETUP_URL}"
echo -e "  ${BOLD}GCS Bucket:${RESET}       gs://${GCS_BUCKET}"
echo -e "  ${BOLD}DB Instance:${RESET}      ${DB_CONNECTION_NAME}"
echo ""
echo -e "  ${YELLOW}${BOLD}Next step:${RESET} Open the setup wizard to claim your publication:"
echo ""
echo -e "  ${BOLD}${BLUE}  ${SETUP_URL}${RESET}"
echo ""
echo -e "  The wizard will guide you through naming your publication,"
echo -e "  setting up your admin account, and uploading a profile photo."
echo ""
