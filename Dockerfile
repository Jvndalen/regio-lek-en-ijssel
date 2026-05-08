# =========================
# Builder
# =========================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependency files first (better caching)
COPY package.json bun.lock* ./

# Copy workspace/local packages if needed
COPY plugins ./plugins

ENV CI=false

# Install dependencies
RUN bun install --frozen-lockfile

# Copy rest of the app
COPY . .

# Build app
RUN bun run build


# =========================
# Runtime
# =========================
FROM node:22-alpine

WORKDIR /app

# Copy built app and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

RUN mkdir -p data

ENV HOST=0.0.0.0
ENV PORT=4321

EXPOSE 4321

CMD ["node", "./dist/server/entry.mjs"]