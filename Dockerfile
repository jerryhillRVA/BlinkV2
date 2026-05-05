# syntax=docker/dockerfile:1.7
# ─── Stage 1: builder ────────────────────────────────────────────────
# Builds both apps. We do NOT use `nx run blinksocial-api:prune` because
# its `prune-lockfile` step reads the API project's local package.json
# (which only declares the Nest core deps) — yielding a manifest that's
# missing every webpack-externalized runtime dep (dotenv, axios, mammoth,
# pdfjs-dist, @anthropic-ai/sdk, …). Stage 2 instead installs production
# deps from the workspace-root package.json, which is the actual source
# of truth for what main.js requires at runtime.
#
# Why python3/make/g++: argon2 and other native deps run node-gyp on
# alpine without prebuilt binaries.
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++ libc6-compat

WORKDIR /workspace

COPY package.json package-lock.json nx.json tsconfig.base.json tsconfig.json ./
RUN npm ci --include=dev

COPY apps ./apps
COPY libs ./libs
COPY scripts ./scripts

# Web → dist/apps/blinksocial-web/{browser,server}
# API → apps/blinksocial-api/dist/{main.js, assets, ...}
# The asymmetric layout is required: AngularSsrMiddleware computes the SSR
# bundle path as `__dirname/../../../dist/apps/blinksocial-web/server/server.mjs`
# from `apps/blinksocial-api/dist/main.js`, which only resolves when both
# trees are siblings under the workspace root.
RUN npx nx build blinksocial-web --configuration=production \
    && npx nx build blinksocial-api --configuration=production

# ─── Stage 2: runtime ────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# libc6-compat is needed at runtime for some prebuilt binaries linked
# against glibc-style symbols on alpine's musl libc. python3/make/g++
# are needed because argon2 (and possibly other native deps) recompile
# on `npm ci --omit=dev` if no prebuilt is available for node:20-alpine.
RUN apk add --no-cache python3 make g++ libc6-compat

# Install production deps from the workspace-root manifest. main.js's
# externalized requires (dotenv, axios, mammoth, pdfjs-dist, @anthropic-ai/sdk,
# argon2, …) are all declared here.
#
# --ignore-scripts skips the root `prepare` script (which runs `husky`, a
# devDep that's omitted in this stage and would crash with exit 127). We
# then `npm rebuild` to re-run only the install/postinstall lifecycle
# scripts on native modules (e.g. argon2's node-pre-gyp build), which
# `prepare` is NOT part of.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts \
    && npm rebuild \
    && npm cache clean --force

# Strip build tools after native compile — they're not needed at runtime
# and bloat the image by ~150 MB.
RUN apk del python3 make g++

# Preserve the asymmetric layout the SSR middleware expects.
COPY --from=builder /workspace/apps/blinksocial-api/dist/ /app/apps/blinksocial-api/dist/
COPY --from=builder /workspace/dist/apps/blinksocial-web/ /app/dist/apps/blinksocial-web/

# `node` user (uid 1000) ships with node:20-alpine. Recursively chown the
# working tree so the unprivileged user can read everything.
RUN chown -R node:node /app

USER node

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["node", "apps/blinksocial-api/dist/main.js"]
