# Deploying ShiftMate to Railway

ShiftMate is a pnpm monorepo with two deployable services — the **api** (NestJS) and the
**web** (Next.js) — plus a **Postgres** database. Each service builds from its own Dockerfile
with the **repo root** as the build context. The api runs its DB migrations automatically on
boot (`migrationsRun: true`), so there is no manual migration step.

Prerequisites: the repo is pushed to GitHub (`github.com/kishore007k/ShiftMate`) and you have a
Railway account.

## 1. Create the project + database

1. Railway → **New Project** → **Deploy from GitHub repo** → pick `ShiftMate`.
2. In the project, **+ New** → **Database** → **Add PostgreSQL**.

## 2. Deploy the **api** service

1. The first service Railway created from the repo will be the api (or **+ New → GitHub Repo**).
2. Service **Settings**:
   - **Root Directory**: `/`
   - **Dockerfile Path**: `apps/api/Dockerfile` (or add a variable `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`)
3. **Variables**:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
   | `GOOGLE_MAPS_API_KEY` | your Google Maps key |
   | `NODE_ENV` | `production` |
   | `WEB_ORIGIN` | `https://${{web.RAILWAY_PUBLIC_DOMAIN}}` (set after the web service exists) |
4. **Settings → Networking → Generate Domain** to expose it publicly.

Do **not** set `PORT` — Railway injects it and the app binds to it automatically.

## 3. Deploy the **web** service

1. **+ New → GitHub Repo → ShiftMate** (a second service on the same repo).
2. Service **Settings**:
   - **Root Directory**: `/`
   - **Dockerfile Path**: `apps/web/Dockerfile`
3. **Variables** (⚠️ `NEXT_PUBLIC_*` is baked in at build time — set it before the first build):
   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_BASE_URL` | `https://${{api.RAILWAY_PUBLIC_DOMAIN}}` |
   | `NODE_ENV` | `production` |
4. **Generate Domain** for the web service.

## 4. Wire CORS and redeploy

1. Back on the **api** service, confirm `WEB_ORIGIN` = `https://<web-domain>` (from step 3.4).
   The api only allows that origin (`apps/api/src/main.ts`).
2. Redeploy both services if you changed variables (the web must rebuild to pick up
   `NEXT_PUBLIC_API_BASE_URL`).

## 5. Load your historical shifts

Open the deployed web app → **Shifts → Import** → upload
`Downloads/shiftmate-import.csv`. Re-running is safe (duplicates are reported as conflicts).

## Notes

- `railway.toml` in the repo is a human reference for the settings above; Railway configures
  multi-service monorepos through the dashboard (per-service Dockerfile path), not a single
  config file.
- Verify locally: `docker build -f apps/api/Dockerfile -t shiftmate-api .` and
  `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 -t shiftmate-web .`
