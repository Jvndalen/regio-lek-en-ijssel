# syntax=docker/dockerfile:1

# =========================
# Builder
# =========================
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy dependency files first for caching
COPY package.json bun.lock* ./

# Copy workspace/local packages if needed
COPY plugins ./plugins

ENV CI=false

# Install dependencies
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --frozen-lockfile

# Copy rest of app
COPY . .

# Build app
RUN --mount=type=cache,target=/app/.astro \
    --mount=type=cache,target=/app/node_modules/.vite \
    bun run build


# =========================
# Runtime
# =========================
FROM oven/bun:1-alpine

WORKDIR /app

# Copy build output + deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p data

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["bun", "dist/server/entry.mjs"]