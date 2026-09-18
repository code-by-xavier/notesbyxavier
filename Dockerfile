# Stage 1: Build the static site
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and pin pnpm 10 (matching lockfile)
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Copy source and build static output
COPY . .
RUN pnpm build

# Stage 2: Serve with lightweight Nginx Alpine (<25MB)
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
