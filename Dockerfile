# ── MW Admin Frontend Dockerfile ───────────────────────────────────────────────
# Multi-stage build for Next.js production deployment

FROM node:20-alpine AS base

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_API_URL is baked into the client bundle, so it has to be given at build time:
#   docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.org .
# There is deliberately no default - a silently baked-in localhost URL ships a broken console.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "ERROR: pass --build-arg NEXT_PUBLIC_API_URL=<backend origin>" && exit 1)

RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
