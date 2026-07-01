# Deploying ShiftMate (Render + Neon)

ShiftMate is a pnpm monorepo with two Docker services — the **api** (NestJS) and the **web**
(Next.js) — plus a **Postgres** database. The api runs its migrations automatically on boot
(`migrationsRun: true`), so there's no manual migration step.

We host the two services on **Render** (via the `render.yaml` Blueprint) and Postgres on
**Neon** (its free tier is persistent, unlike most platform-bundled free databases).

Prerequisites: the repo is on GitHub (`github.com/kishore007k/ShiftMate`), plus free Render and
Neon accounts.

## 1. Create the database (Neon)

1. [neon.tech](https://neon.tech) → **New Project** (pick a region near you, e.g. Singapore/AU).
2. Copy the **connection string** from the dashboard. It looks like:
   `postgresql://user:pass@ep-xxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`
   Keep the `?sslmode=require` — the api enables SSL when `NODE_ENV=production`.

## 2. Deploy both services (Render Blueprint)

1. [render.com](https://render.com) → **New** → **Blueprint** → connect the `ShiftMate` repo.
   Render reads `render.yaml` and proposes the `shiftmate-api` and `shiftmate-web` services.
2. Render prompts for the `sync: false` variables. Enter:
   | Service | Variable | Value |
   |---------|----------|-------|
   | api | `DATABASE_URL` | your Neon string (with `?sslmode=require`) |
   | api | `GOOGLE_MAPS_API_KEY` | your Google Maps key |
   | api | `WEB_ORIGIN` | `https://shiftmate-web.onrender.com` |
   | web | `NEXT_PUBLIC_API_BASE_URL` | `https://shiftmate-api.onrender.com` |
3. **Apply** — Render builds both Docker images and deploys.

> `NEXT_PUBLIC_API_BASE_URL` is **baked into the web build**, and `WEB_ORIGIN` sets the api's
> CORS allow-list (`apps/api/src/main.ts`). Both use Render's default hostname pattern
> `https://<service-name>.onrender.com`.

## 3. If a service name was taken

Render appends a suffix (e.g. `shiftmate-api-ab12`). If so, update the two URL variables to the
real hostnames (**api → Settings → Environment**: `WEB_ORIGIN`; **web**:
`NEXT_PUBLIC_API_BASE_URL`) and **redeploy the web service** so the corrected API URL is baked in.

## 4. Load your historical shifts

Open the deployed web app → **Shifts → Import** → upload `Downloads/shiftmate-import.csv`.
Re-running is safe (duplicates are reported as conflicts, not re-added).

## Notes

- **Free web services sleep** after ~15 min idle and cold-start in ~30s on the next request —
  fine for personal use. Upgrade a service to a paid instance to keep it always-on.
- **Ports**: don't set `PORT`. Render injects it; Nest reads `process.env.PORT` and Next's
  `next start` binds to it automatically.
- **Verify the images locally** (Docker):
  `docker build -f apps/api/Dockerfile -t shiftmate-api .`
  `docker build -f apps/web/Dockerfile --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:3000 -t shiftmate-web .`
- `railway.toml` is left as a reference for anyone deploying to Railway instead.

## Alternative: Fly.io (no cold-start sleep)

Fly keeps a machine warm (`min_machines_running = 1`), so there's no ~30s wake-up like Render's
free tier. Configs are `fly.api.toml` and `fly.web.toml`; still use Neon for Postgres.

```bash
# one-time: install flyctl and log in
#   https://fly.io/docs/flyctl/install/   then:  fly auth login

# from the repo ROOT (the Dockerfiles build with repo-root context):
fly apps create shiftmate-api
fly apps create shiftmate-web

# api secrets (Neon URL + Maps key)
fly secrets set --config fly.api.toml \
  DATABASE_URL="postgresql://...neon.tech/neondb?sslmode=require" \
  GOOGLE_MAPS_API_KEY="your-key"

# deploy both
fly deploy --config fly.api.toml
fly deploy --config fly.web.toml
```

- URLs follow `https://<app-name>.fly.dev`. `fly.api.toml` already sets
  `WEB_ORIGIN=https://shiftmate-web.fly.dev` and `fly.web.toml` bakes
  `NEXT_PUBLIC_API_BASE_URL=https://shiftmate-api.fly.dev` as a build arg — edit both if you use
  different app names.
- `min_machines_running = 1` keeps each service warm (small cost). Set it to `0` in the toml to
  scale to zero and pay less, at the cost of a brief wake-up.
- Then load your shifts the same way: **Shifts → Import** → `Downloads/shiftmate-import.csv`.
