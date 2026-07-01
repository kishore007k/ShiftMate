# Build context is the repo root (mirrors apps/api/Dockerfile).
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

# All workspace manifests must be present so --frozen-lockfile links deps correctly.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN pnpm install --frozen-lockfile

COPY packages/types ./packages/types
COPY apps/web ./apps/web

# NEXT_PUBLIC_* is inlined at build time — must be present before `next build`.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN pnpm --filter @shiftmate/types build
RUN pnpm --filter @shiftmate/web build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@9.1.0 --activate

COPY --from=builder /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=builder /app/packages/types/package.json ./packages/types/
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/next.config.mjs ./apps/web/

RUN pnpm install --prod --frozen-lockfile

# Railway injects PORT; `next start` binds to it automatically.
EXPOSE 3001
CMD ["pnpm", "--filter", "@shiftmate/web", "start"]
