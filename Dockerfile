FROM node:22-alpine AS builder

# Install pnpm
RUN corepack enable

WORKDIR /app

# Copy only dependency files first (better caching)
COPY package.json pnpm-lock.yaml ./
# Copy workspace plugins so pnpm can resolve local packages
COPY plugins ./plugins

ENV PNPM_BUILD_POLICY=allow

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy rest of the app
COPY . .

# Build
RUN pnpm build


FROM node:22-alpine

# Install pnpm (needed if you run scripts or rebuild deps)
# RUN corepack enable && corepack prepare pnpm@11.0.8 --activate

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