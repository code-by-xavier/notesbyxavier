# Stage 1: Build the Astro hybrid application
FROM node:22-alpine AS builder

WORKDIR /app

# Enable Corepack and pin pnpm
RUN corepack enable && corepack prepare pnpm@10.30.1 --activate

# Install dependencies
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source and build
COPY . .
RUN pnpm build

# Prune devDependencies for a lean production image
RUN pnpm prune --prod --ignore-scripts

# Stage 2: Production Node.js Cloud Run container
FROM node:22-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=8080

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

EXPOSE 8080

CMD ["node", "./dist/server/entry.mjs"]
