# syntax=docker/dockerfile:1.7
# ─── Stage 1: builder ────────────────────────────────────────────────
# Builds both apps and produces a runtime-ready API dist with native
# binaries already compiled. Why python3/make/g++: argon2 and other
# native deps run node-gyp on alpine without prebuilt binaries.
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
RUN npm ci --include=dev

COPY apps ./apps
COPY libs ./libs
COPY scripts ./scripts

# Web → dist/apps/blinksocial-web/{browser,server}
# API → apps/blinksocial-api/dist/{main.js, package.json, package-lock.json, workspace_modules/}
# The asymmetric layout is required: AngularSsrMiddleware computes the SSR
# bundle path as `__dirname/../../../dist/apps/blinksocial-web/server/server.mjs`
# from `apps/blinksocial-api/dist/main.js`, which only resolves when both
# trees are siblings under the workspace root.
RUN npx nx build blinksocial-web --configuration=production \
    && npx nx run blinksocial-api:prune --configuration=production

# Install production deps inside the pruned API dist. node-gyp runs here
# (build deps from the apk install above are still on PATH); stage 2 does
# not need build tools because we copy the resulting node_modules as-is.
WORKDIR /workspace/apps/blinksocial-api/dist
RUN npm ci --omit=dev

# ─── Stage 2: runtime ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# libc6-compat is needed at runtime for some prebuilt binaries linked
# against glibc-style symbols on alpine's musl libc.
RUN apk add --no-cache libc6-compat

# Preserve the asymmetric layout the SSR middleware expects.
COPY --from=builder --chown=node:node /workspace/apps/blinksocial-api/dist/ /app/apps/blinksocial-api/dist/
COPY --from=builder --chown=node:node /workspace/dist/apps/blinksocial-web/ /app/dist/apps/blinksocial-web/

USER node

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["node", "apps/blinksocial-api/dist/main.js"]
