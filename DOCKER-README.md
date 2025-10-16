Docker local run & troubleshooting

This document captures the concrete issues encountered while dockerising the `base` project, the fixes applied, and the exact commands to run and debug the stack locally. Use this as a single source of truth while you iterate on containerization.

---

Quick summary

- What this repo contains: `frontend`, `uploadService`, `deployService`, `requestHandler`, and a `redis` service via Docker Compose.
- How to run locally: build + start everything using Docker Compose (see commands below).
- Key issues we hit during dockerisation and fixes are listed below so you can reproduce and resolve quickly.

---

Prerequisites

- Docker Desktop (macOS) or Colima + Docker CLI
- Git installed on host (for local runs) — but we also install `git` inside the `uploadService` container because `simple-git` spawns the `git` binary at runtime.

Files added/changed while dockerising

- `docker-compose.yml` — top-level compose wiring all services and redis (created)
- Dockerfiles (multi-stage) for each service:
  - `frontend/Dockerfile` (Vite build -> nginx)
  - `requestHandler/Dockerfile` (ts build -> node)
  - `uploadService/Dockerfile` (ts build -> node; runtime installs git)
  - `deployService/Dockerfile` (ts build -> node)
- `.env.example` — example environment variables to copy to `.env` for local runs
- `DOCKER-README.md` (this file)
- minor code edits to use `REDIS_URL` env var by default in services

Why a top-level `.env`?

- The compose file uses `env_file: - .env` to inject environment variables into each service container. Compose will look for the file and fail if it does not exist. You can either:
  - Create a top-level `.env` (quick and common for local dev), or
  - Edit `docker-compose.yml` to reference per-service env files (e.g., `./uploadService/.env`).

We added `.env.example` — copy it to `.env` and fill values before `docker compose up`.

Important: where to place your `.env`

- Docker Compose loads env files relative to the compose file. By default the `env_file: - .env` entry in `docker-compose.yml` points to the top-level `.env` at the repository root (the same directory as the compose file). If you put `.env` files inside individual service folders they will not be read unless you explicitly reference them in `docker-compose.yml` (for example `./uploadService/.env`).
- Practical tip: copy the example to the repo root and recreate containers so the variables are injected at container start. Example commands:

```bash
cp .env.example .env   # edit values (ACCOUNT_ENDPOINT, ACCOUNT_ACCESS_ID, ACCOUNT_SECRET_KEY, REDIS_URL)
docker compose down -v
docker compose up --build -d
```

This is important because Compose reads environment variables when a container is created. If you add or change `.env` after a container is already running you must recreate that container (or the whole stack) for the updated values to be present inside the container.

Common issues we encountered and fixes

1) YAML parse errors (tabs vs spaces)
   - Symptom: `yaml: line X: found character that cannot start any token` or compose failure parsing file.
   - Root cause: `docker-compose.yml` contained tab characters.
   - Fix: replace tabs with spaces; ensure indentation is 2 spaces per level.
   - How to check: `python -c "import yaml,sys; yaml.safe_load(open('docker-compose.yml'))"` (if you have pyyaml) or visually verify editor shows spaces.

2) Dockerfile parse error: unknown instruction
   - Symptom: `failed to solve: dockerfile parse error on line 1: unknown instruction: (#`.
   - Root cause: Dockerfile started with an extra `(` before comment or had stray parentheses wrapping comments.
   - Fix: Make comments start with `#` and remove stray parentheses. Dockerfile must begin with a valid Docker instruction (e.g., `FROM`).

3) `spawn git ENOENT` when upload service tries to clone
   - Symptom (runtime): Error stacktrace from `simple-git`: `Error: spawn git ENOENT`.
   - Root cause: `simple-git` spawns the `git` binary which wasn't available inside the runtime image.
   - Fix: install `git` (and CA certs/openssh) in the runtime stage of `uploadService/Dockerfile`:
     - `RUN apk add --no-cache git openssh ca-certificates && update-ca-certificates || true`
   - After the change: rebuild the `uploadservice` image and restart that service.

4) Port already in use
   - Symptom: `Error response from daemon: Ports are not available: exposing port TCP 0.0.0.0:3000 -> ... bind: address already in use`.
   - Fixes:
     - Stop the conflicting local process (use `lsof -iTCP:3000 -sTCP:LISTEN -n -P` to find it).
     - Stop the other container using `docker ps` and `docker stop <container>`.
     - Change the host port mapping in `docker-compose.yml` if you want to avoid the conflict.

5) Missing `.env` file (compose warning/error)
   - Symptom: `env file /path/.env not found`.
   - Fix: copy `.env.example` to `.env` and fill secrets. Or change `docker-compose.yml` to reference different env files.

6) Build/runtime caching confusing changes
   - When editing Dockerfiles, use `--no-cache` when rebuilding to ensure changes take effect:
     - `docker compose build --no-cache <service>`

Commands: run, rebuild, and debug

From repo root `/Users/varunk/playground/Base`

- Start full stack (build and detach):
```bash
cp .env.example .env  # edit .env before running
docker compose up --build -d
```

- Rebuild one service and restart it (e.g., uploadservice):
```bash
docker compose build --no-cache uploadservice
docker compose up -d uploadservice
```

- Stop and remove stack (cleanup containers, networks, anonymous volumes):
```bash
docker compose down -v
```

- Check running services and ports:
```bash
docker compose ps
```

- Tail logs (single service):
```bash
docker compose logs -f uploadservice
```

- View last N log lines (quick):
```bash
docker compose logs --tail=200 uploadservice
```

- Attach shell to container (inspect env & files):
```bash
docker compose exec uploadservice sh
# inside container examples
printenv | grep -i REDIS
ls -la /app
ls -la /app/dist
```

Runtime environment variables used by services (examples)

- `ACCOUNT_ENDPOINT` — S3-compatible endpoint (R2/MinIO)
- `ACCOUNT_ACCESS_ID` — access key id for S3
- `ACCOUNT_SECRET_KEY` — secret key for S3
- `REDIS_URL` — e.g. `redis://redis:6379` (default uses compose service hostname)

Notes on `.env` strategy

- Local dev: top-level `.env` (easy & central) — copy `.env.example` and fill
- Per-service `.env`: more secure/isolated if you want separate files under each service folder — change compose to reference `./service/.env` per service
- Production: inject env via your platform (Fly, ECS, Kubernetes secrets, etc). Do not commit production secrets.

Small follow-ups & recommended improvements

- Add `scripts` to each `package.json` for clarity: `"build": "tsc -p tsconfig.json"`, `"start": "node dist/index.js"`. This makes Dockerfiles and CI clearer.
- (Removed) A `docker-compose.override.yml` for MinIO was previously suggested; we removed it to keep the repo focused on Cloudflare R2. If you want local S3 emulation later we can add it back as an optional override.
- Add health endpoints to each service (e.g., `/health`) that return 200 for simple smoke tests from Compose.
- Use a managed Redis (Upstash / Elasticache) for production and avoid running Redis in production containers unless you manage persistence/backup.

Example: rebuild uploadservice after adding git to runtime

```bash
# from repo root
docker compose build --no-cache uploadservice
docker compose up -d uploadservice
docker compose logs -f uploadservice
```

If you want me to expand this file

I can:
- Add a `docker-compose.override.yml` that includes a MinIO service and an example `ACCOUNT_ENDPOINT` so uploads/downloads work out-of-the-box.
- Create per-service `.env.example` files and update `docker-compose.yml` to reference them.
- Add health endpoints to services and small unit tests.

Tell me what you'd like next and I'll update the repo accordingly.


Deploy worker (`deployservice`) — recent fixes

- Problem: Building downloaded repos inside the worker failed for some projects. Symptoms included `tsc: not found`, `No build output found`, and engine warnings for Vite/plug-ins.
- Fixes applied:
   - Use Node 20 in the `deployService` Dockerfile to match toolchain engine requirements (Vite, plugins).
   - The worker's build helper now installs devDependencies for downloaded repos before running the build: `npm install --include=dev` so `tsc`, `vite`, etc. are available.
   - The worker now detects common build output directories (`dist`, `build`, `out`) and prints helpful diagnostics (contents of the repo folder) if none are found.
   - A `REPOS_DIR` env var is set (defaults to `/app/repos`) so the canonical repo location inside the container is consistent.

Commands to rebuild and test the worker

```bash
docker compose build --no-cache deployservice
docker compose up -d deployservice
docker compose logs -f deployservice
```

If builds still fail, check the logs for the `npm install --include=dev` and `npm run build` output in the worker logs. If the project uses `pnpm` or `yarn` you may need to detect and run the correct package manager (I can add that automation if you want).


Repo path normalization issue (why `/app` vs `/app/dist` mattered)

- Symptom: The worker threw `ENOENT` when scanning for built artifacts, e.g. `scandir '/app/dist/utils/repos/cccbg/dist'` or later `scandir '/app/repos/phskx/dist'` depending on edits. The build ran but `copyFinalDist` couldn't find the `dist` folder.
- Root cause: differences between source layout (TypeScript `src`) and runtime layout (compiled `dist`) combined with inconsistent use of relative paths. In short:
   - Compiled JS files use `__dirname` which resolves to `/app/dist/...` inside the container once TypeScript has been compiled and copied into the image.
   - Some parts of the code wrote downloaded repos relative to `__dirname` (which ended up under `/app/dist/utils/...`) while other parts expected repos under a different absolute path (e.g. `/app/repos/...`). This created a mismatch so the build artifacts were not where `copyFinalDist` looked for them.
- Fix applied:
   - Introduced a single canonical repo base directory (`REPOS_DIR`, default `/app/repos`) and resolved it with `path.resolve(...)` in the code so it is absolute and consistent regardless of `__dirname` or working directory differences.
   - Updated the download, build and upload helpers to use that same base path: downloaded files now go to `REPOS_DIR/<id>`, the build helper `cd`s into that exact directory before running `npm install` and `npm run build`, and `copyFinalDist` reads the build output from that directory.
   - Added defensive detection & logging (check `dist|build|out`) and clearer errors if nothing is produced.
   - Made the Dockerfile set `WORKDIR /app` and expose `REPOS_DIR=/app/repos` so the runtime filesystem layout is explicit.

- Why this happened after dockerising: locally you may have run TS directly (ts-node) or used a different working directory where relative paths matched. Once compiled and copied into the image the runtime `__dirname` changed, exposing the mismatch in path assumptions.

How to verify locally

1. Rebuild and restart the worker:

```bash
docker compose build --no-cache deployservice
docker compose up -d deployservice
docker compose logs -f deployservice
```

2. On build failure the worker will now log which candidate output folder it checked and the contents of the repo folder. Inspect `/app/repos/<id>` inside the container if needed:

```bash
docker compose exec deployservice sh
ls -la /app/repos
ls -la /app/repos/<id>
```

3. If a project builds to `build` instead of `dist` you will see that detected. If nothing is produced check the build logs (`npm run build`) — common issues are missing devDependencies (fixed by `npm install --include=dev`) or engine mismatches (we switched to Node 20 in the Dockerfile).


Docker image layout — short summary

- Cause: during multi-stage builds we compile TypeScript into `dist` in the build stage and then `COPY` that `dist` into the runtime image (for example `COPY --from=build /app/dist ./dist`). That changes where compiled JS files live inside the container (e.g. `/app/dist/utils/...`) and therefore changes the value of `__dirname` at runtime.
- Symptom: code that used `__dirname`-relative paths (writing/reading `repos/...`) ended up writing to `/app/dist/...` while other parts of the system expected `/app/repos/...` or `/app/repos/<id>/dist`, producing `ENOENT` errors when scanning for build outputs.
- Two safe ways to address it:
   1. Code-first (recommended): use a single canonical, absolute repo directory (e.g. `REPOS_DIR=/app/repos`) and reference that everywhere (download, build, upload). This decouples code from image layout and is robust to future Dockerfile changes.
   2. Dockerfile-first: change how `dist` is copied into the runtime image so compiled JS files appear where the code expects them (for example `COPY --from=build /app/dist .` or change `WORKDIR` to `/app/dist`). This avoids code edits but keeps layout-coupling between code and image.
- We implemented the code-first approach and also documented the Dockerfile layout; either approach is valid — the key is consistency and making the expected paths explicit in code and in the image via `ENV` or `WORKDIR`.
