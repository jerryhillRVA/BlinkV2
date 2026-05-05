# Docker deployment — Google Cloud Run

This runbook walks the manual path from a fresh GCP project to a working Blink Social v2 deployment on Cloud Run. The same steps will eventually be wrapped by a CI/CD pipeline — proving the manual path first is what this ticket delivers.

The image is a single Node 20 process that serves both the Nest API (`/api/*`) and the Angular SSR-rendered frontend from one port. AgenticFilesystem (AFS) is reached over its public URL via the `AGENTIC_FS_URL` env var.

## Prerequisites

- `gcloud` CLI installed and authenticated (`gcloud auth login`)
- Docker Desktop or compatible runtime, with `docker buildx` available
- A GCP project with billing enabled
- An AFS endpoint reachable from the public internet (record its URL — e.g. `https://afs.example.com:8000`)
- An Anthropic API key

Throughout this doc, replace these placeholders:

| Placeholder | Example | Notes |
|---|---|---|
| `<project>` | `blink-prod-001` | GCP project ID |
| `<region>` | `us-central1` | Cloud Run + Artifact Registry region |
| `<sha>` | `a1b2c3d` | short git SHA, output of `git rev-parse --short HEAD` |
| `<afs-url>` | `https://afs.example.com:8000` | AFS public endpoint |
| `<anthropic-key>` | `sk-ant-...` | Anthropic API key |

## GCP project setup

One-time setup per project. Skip if these have already been run.

```bash
gcloud config set project <project>
gcloud services enable run.googleapis.com artifactregistry.googleapis.com
gcloud artifacts repositories create blinksocial \
  --repository-format=docker \
  --location=<region> \
  --description="Blink Social container images"
gcloud auth configure-docker <region>-docker.pkg.dev
```

## Local image build + smoke test

Run from the repo root.

```bash
docker build -t blinksocial:local .
docker images blinksocial:local --format '{{.Size}}'   # ~1.6 GB (see "Image size" note below)
```

> **Image size.** The image lands around 1.6 GB because the Nest API depends transitively on heavy packages (`pdfjs-dist`, `mammoth`, `@anthropic-ai/sdk`, `argon2`'s native binary, etc.) and the runtime stage installs the workspace-root production deps verbatim. Cloud Run pulls in seconds even at this size, so it's not blocking. A future optimization can switch to bundling deps inside the webpack output (no `node_modules` at runtime), but that requires turning off webpack's `target: 'node'` externals — a separate ticket.

> **Required env var: `NG_ALLOWED_HOSTS`.** Angular SSR ships with an SSRF guard that rejects any request whose hostname isn't on its allowlist; if it's empty, every request gets a `400 Bad Request` and falls back to a static CSR shell with no real content. Always set `NG_ALLOWED_HOSTS` to the hostname(s) you'll be hitting — `localhost` for local Docker, the Cloud Run service hostname (or your custom domain) in production. Comma-separate multiple values.

Smoke test the image locally before pushing. There are two flavors — pick the one that matches what you want to verify.

### Option A — minimal smoke test (mock AFS, no `.env` needed)

The fastest way to confirm the image starts, binds the port, serves SSR'd HTML, and answers `/api/health`. The API runs in mock mode; AFS-backed endpoints return canned data.

```bash
docker run --rm -d --name blink-smoke \
  -p 8080:8080 \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e NG_ALLOWED_HOSTS=localhost \
  blinksocial:local

sleep 6
curl -s -o /tmp/index.html -w '%{http_code}\n' http://localhost:8080/                # expect 200
grep -c 'ng-server-context="ssr"' /tmp/index.html                                    # expect 1 (proves SSR fired, not CSR fallback)
grep -c 'Welcome to Blink Social' /tmp/index.html                                    # expect 1 (real dashboard markup, not the empty shell)
curl -s http://localhost:8080/api/health                                             # expect {"status":"ok",...}
docker logs blink-smoke | tail -50                                                   # expect "Application is running on: http://localhost:8080" + "AgenticFilesystem mock mode"

docker rm -f blink-smoke
```

If either grep returns `0`, the SSR bundle did not actually render — see Troubleshooting below. The most common cause is `NG_ALLOWED_HOSTS` missing or not matching the request hostname.

### Option B — full smoke test against your local `.env` + a real AFS

Use this when you want the container to talk to a real AFS (e.g. one started by `npx afs start` on the host) and pick up `ANTHROPIC_API_KEY` and any other secrets from your existing `.env` file. There are four gotchas — each has a corresponding override flag below.

| Gotcha | Why it bites | Fix |
|---|---|---|
| `.env` has `PORT=3000` (dev convention) | Cloud Run image expects to listen on `8080`; the published port mapping won't match if you take `.env`'s value verbatim. | Override with `-e PORT=8080` **after** `--env-file`. |
| `.env` has `NODE_ENV=development` | `AngularSsrMiddleware` short-circuits and skips SSR when `NODE_ENV !== 'production'`. You'll get a 200 with an empty `<app-root></app-root>` and miss the regression signal. | Override with `-e NODE_ENV=production` **after** `--env-file`. |
| `.env` has `AGENTIC_FS_URL=http://localhost:8000` (or similar) | Inside the container, `localhost` is the container itself — AFS isn't there. The service silently falls back to mock mode. | Override with `-e AGENTIC_FS_URL=http://host.docker.internal:8000` (Mac/Windows) and add `--add-host=host.docker.internal:host-gateway` on Linux. |
| `.env` does not set `NG_ALLOWED_HOSTS` | Angular SSR rejects every request and falls back to a 400 / CSR shell. | Set `-e NG_ALLOWED_HOSTS=localhost`. |

`docker run` evaluates `--env-file` first and then `-e` flags, so later flags win. That's the lever we use to keep the convenient secrets-from-`.env` flow while patching the values that matter for production-image parity.

```bash
docker run --rm -d --name blink-smoke \
  -p 8080:8080 \
  --env-file .env \
  -e PORT=8080 \
  -e NODE_ENV=production \
  -e NG_ALLOWED_HOSTS=localhost \
  -e AGENTIC_FS_URL=http://host.docker.internal:8000 \
  --add-host=host.docker.internal:host-gateway \
  blinksocial:local

sleep 6
curl -s -o /tmp/index.html -w '%{http_code}\n' http://localhost:8080/                # expect 200
grep -c 'ng-server-context="ssr"' /tmp/index.html                                    # expect 1
grep -c 'Welcome to Blink Social' /tmp/index.html                                    # expect 1
curl -s http://localhost:8080/api/health                                             # expect {"status":"ok",...}
docker logs blink-smoke | grep -i 'agenticfilesystem'                                # expect a real AFS URL log line, NOT "mock mode"

docker rm -f blink-smoke
```

If logs show `AgenticFilesystem mock mode` despite `AGENTIC_FS_URL` being set, AFS is unreachable from the container — verify it's running on the host (`curl http://localhost:8000/health` from your shell, not the container) and that the `--add-host` flag is present on Linux.

The `--add-host=host.docker.internal:host-gateway` flag is a no-op on Mac/Windows (the hostname is already wired up by Docker Desktop) but required on Linux. Including it unconditionally is safe and portable.

## Push to Artifact Registry

Tag the local image with the registry path and push.

```bash
SHA=$(git rev-parse --short HEAD)
docker tag blinksocial:local <region>-docker.pkg.dev/<project>/blinksocial/blinksocial:${SHA}
docker tag blinksocial:local <region>-docker.pkg.dev/<project>/blinksocial/blinksocial:latest
docker push <region>-docker.pkg.dev/<project>/blinksocial/blinksocial:${SHA}
docker push <region>-docker.pkg.dev/<project>/blinksocial/blinksocial:latest
```

## Deploy to Cloud Run

```bash
SHA=$(git rev-parse --short HEAD)
gcloud run deploy blinksocial \
  --image=<region>-docker.pkg.dev/<project>/blinksocial/blinksocial:${SHA} \
  --region=<region> \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --cpu-boost \
  --set-env-vars=NODE_ENV=production,NG_ALLOWED_HOSTS=<service-hostname>,AGENTIC_FS_URL=<afs-url>,ANTHROPIC_API_KEY=<anthropic-key>
```

`<service-hostname>` is the bare hostname (no scheme) that Cloud Run assigns or that you've mapped to the service — e.g. `blinksocial-abc123-uc.a.run.app` or your custom domain like `app.example.com`. Comma-separate if you serve under multiple. Without this, Angular SSR's SSRF guard rejects every request and the page falls back to an empty CSR shell.

**Secret handling.** `--set-env-vars` puts `ANTHROPIC_API_KEY` in plaintext into the Cloud Run service config, visible to anyone with `roles/run.viewer` on the project. This is acceptable for the initial bring-up; migrating to Google Secret Manager (`--set-secrets=ANTHROPIC_API_KEY=anthropic-key:latest`) is the natural follow-up and is tracked separately.

**Bootstrap order.** On first deploy, the Cloud Run hostname isn't known until after the service exists, but the service won't fully serve traffic without `NG_ALLOWED_HOSTS` matching it. Deploy first with a placeholder (e.g. `NG_ALLOWED_HOSTS=*.run.app`), capture the assigned URL, then re-deploy with the exact hostname. Or, if you're using a custom domain, set it to the custom hostname from the start and Cloud Run will accept the deploy regardless.

After deploy, capture the service URL:

```bash
SERVICE_URL=$(gcloud run services describe blinksocial --region=<region> --format='value(status.url)')
echo "$SERVICE_URL"
```

## Post-deploy verification

```bash
curl -s "$SERVICE_URL/api/health"                              # expect {"status":"ok",...}
curl -s -o /tmp/cloud-run-index.html -w '%{http_code}\n' "$SERVICE_URL/"
grep -c 'ng-server-context="ssr"' /tmp/cloud-run-index.html    # expect 1 (proves SSR ran, not CSR fallback)
grep -c 'Welcome to Blink Social' /tmp/cloud-run-index.html    # expect 1 (real dashboard markup)
```

To confirm AFS is wired up correctly (and not silently in mock mode), hit any AFS-backed endpoint and verify the response uses real data — for example, list workspaces and confirm the IDs differ from the mock fixture (`hive-collective`, etc.).

```bash
curl -s "$SERVICE_URL/api/workspaces" | jq
gcloud run services logs read blinksocial --region=<region> --limit=50 | grep -i 'agenticfilesystem'
```

If the logs show `AgenticFilesystem mock mode`, AFS is unreachable or `AGENTIC_FS_URL` is wrong — see Troubleshooting.

## Troubleshooting

| Symptom | Diagnostic command | Likely fix |
|---|---|---|
| Cold-start 504 / startup probe timeout | `gcloud run services logs read blinksocial --region=<region> --limit=200` | Bump `--min-instances=1` (keeps a warm instance) and verify `--cpu-boost` is on. Image-pull from Artifact Registry takes seconds on first request. |
| Container fails to start (`Default STARTUP TCP probe failed`) | `gcloud run services logs read ...` for the listening line | Container must bind `$PORT` (which Cloud Run sets to `8080`). Confirm `Application is running on: http://localhost:8080` appears in logs. If `node main.js` exits with a stack trace, fix that first. |
| Response is the empty CSR shell (no `ng-server-context="ssr"`, no `Welcome to Blink Social`) AND logs show `URL with hostname "<host>" is not allowed` | `docker logs blink-smoke 2>&1 \| grep "not allowed"` | `NG_ALLOWED_HOSTS` is unset or doesn't match the request hostname. Set it to the exact hostname (no scheme, no port) — `localhost` for local Docker, the Cloud Run service hostname (or your custom domain) in production. Comma-separate multiple values. |
| Response is the empty CSR shell AND logs show `Cannot find module .../server.mjs` | `docker run --rm --entrypoint sh blinksocial:local -c 'ls /app/dist/apps/blinksocial-web/server/server.mjs'` | The Angular SSR bundle didn't load. The middleware computes `__dirname/../../../dist/apps/blinksocial-web/server/server.mjs` from `apps/blinksocial-api/dist/main.js` — both directories must sit under `/app/` in the image. If `ls` fails, re-check the `COPY --from=builder` lines in `Dockerfile`. |
| `Cannot find module 'dotenv'` (or any other) at container start | `docker logs blink-smoke 2>&1 \| head -30` | A runtime require isn't declared in the workspace-root `package.json` `dependencies`. Add it (e.g. `npm install <pkg> --save`), commit `package.json` + `package-lock.json`, rebuild. The webpack bundle externalizes everything — anything `import`ed by API code must be a declared root runtime dep. |
| Static assets (CSS/JS) 404 from `<service-url>/` | `docker run --rm --entrypoint sh blinksocial:local -c 'ls /app/dist/apps/blinksocial-web/browser/ \| head'` | The `browser/` directory wasn't copied into the runtime stage. Re-check `Dockerfile` stage 2 `COPY` of `dist/apps/blinksocial-web/`. |
| `AgenticFilesystem mock mode` in logs even though `AGENTIC_FS_URL` is set | `gcloud run services describe blinksocial --region=<region> --format='value(spec.template.spec.containers[0].env)'` | Either the env var didn't get set on the revision (re-run `gcloud run deploy` with `--set-env-vars`), or the URL is unreachable from Cloud Run egress. Test from Cloud Shell: `curl -v <afs-url>/health`. |
| 502 / 503 on first request, recovers after | (none — expected on cold start) | Add `--cpu-boost` and `--min-instances=1` if the latency is unacceptable. |
| `argon2` errors on container start | `gcloud run services logs read ...` for `Error: Cannot find module` or native-binding errors | The runtime stage is missing `libc6-compat` (already installed in the published Dockerfile). If you forked it and removed the `apk add libc6-compat` line in stage 2, restore it. |
| `npm ci` fails with `sh: husky: not found` (exit 127) | `docker build` output during stage 2 | The Dockerfile is missing `--ignore-scripts` on the runtime-stage `npm ci`. The workspace-root `prepare` script invokes `husky` (a devDep that's omitted under `--omit=dev`). The published Dockerfile runs `npm ci --omit=dev --ignore-scripts && npm rebuild` — `npm rebuild` re-runs only the `install`/`postinstall` lifecycle for native deps (e.g. argon2), not `prepare`. |
| `ENOSPC: no space left on device` mid-build | `docker system df` | Docker Desktop's VM disk is full. Run `docker system prune -af --volumes` and `docker builder prune -af` to reclaim space, then rebuild. Bump Docker Desktop's disk allocation in Settings → Resources if it's a recurring problem. |
| esbuild deadlock (`fatal error: all goroutines are asleep`) during the Angular build | `docker build` output | Docker Desktop is starving the build of memory. Bump Docker Desktop's memory cap to ≥ 6 GB in Settings → Resources, then rebuild. On Apple Silicon hosts, also try `--platform=linux/arm64` to avoid amd64 emulation. |
| Image size much larger than expected (> 2 GB) | `docker history blinksocial:local` | Build context probably leaked something large. Confirm `.dockerignore` excludes `node_modules/`, `dist/`, `.git/`, `.nx/`, `.angular/`, `coverage/`. Run `du -sh apps/* libs/* \| sort -h` to find unexpected large checkins. The expected size is around 1.6 GB given the runtime dep set. |

## Rollback

Cloud Run keeps revisions. To roll back to the previous good image:

```bash
gcloud run services update-traffic blinksocial \
  --region=<region> \
  --to-revisions=blinksocial-<previous-revision>=100
```

Or redeploy a known-good tag:

```bash
gcloud run deploy blinksocial \
  --image=<region>-docker.pkg.dev/<project>/blinksocial/blinksocial:<previous-sha> \
  --region=<region>
```

Image artifacts in Artifact Registry are not deleted by a redeploy — older SHAs remain available until you prune them manually.

## What's next (out of scope for this doc)

- GitHub Actions / Cloud Build pipeline that builds, pushes, and deploys on merge to `main`.
- Migration of `ANTHROPIC_API_KEY` (and any future secrets) to Google Secret Manager via `--set-secrets`.
- Custom domain mapping, Cloud CDN, Cloud Armor, IAM-restricted invocation.
- Serverless VPC Access connector (only needed if AFS moves to a private network).
