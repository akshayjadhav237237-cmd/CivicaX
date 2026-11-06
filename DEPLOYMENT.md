# CivicaX Production Deployment Guide

Zero-downtime deployment documentation for CivicaX Backend (`server/`), PostgreSQL Database (Supabase / Railway), and Frontend SPA (`client/` on Vercel).

---

## 🏛 Architecture Overview

```
 ┌─────────────────────────┐               ┌─────────────────────────┐
 │   Vercel Edge Network   │               │     Railway / Render    │
 │   CivicaX Frontend      │   REST / WSS  │     CivicaX Backend     │
 │   (React 19 + Vite)     │ ────────────► │   (Node 22 / Express)   │
 └─────────────────────────┘               └───────────┬─────────────┘
                                                       │
                                   Prisma ORM (SSL +   │ PgBouncer Pooling)
                                                       ▼
                                           ┌─────────────────────────┐
                                           │   Supabase PostgreSQL   │
                                           │   (PostGIS + Realtime)  │
                                           └─────────────────────────┘
```

---

## 🚀 Option 1: 1-Click Railway Deployment (Recommended)

### Step 1: Connect GitHub Repository
1. Navigate to [Railway Dashboard](https://railway.app/dashboard).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select the `CivicaX` repository.

### Step 2: Configure Service Settings
Railway uses the root `railway.json` automatically, but ensure these settings in **Settings**:
- **Root Directory**: Leave as `/` (monorepo root) or set to `/server`
- **Build Command**: `cd server && npm install && npx prisma generate` *(set automatically via `railway.json`)*
- **Start Command**: `npm run start:migrate` *(set automatically via `railway.json`)*
- **Healthcheck Path**: `/api/v1/health` (or `/health`)
- **Healthcheck Timeout**: `30` seconds
- **Restart Policy**: `ON_FAILURE` (Max retries: 5)

### Step 3: Configure Environment Variables
In Railway **Variables** tab, add:
| Variable | Value | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true` | Supabase or Railway PostgreSQL |
| `DIRECT_URL` | `postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require` | Direct connection for migrations (optional) |
| `JWT_SECRET` | *(Random 32+ char string)* | Signing secret for access tokens |
| `JWT_REFRESH_SECRET` | *(Random 32+ char string)* | Signing secret for refresh tokens |
| `CORS_ORIGIN` | `https://your-frontend.vercel.app,http://localhost:5173` | Allowed frontend origins |
| `NODE_ENV` | `production` | Production environment flag |
| `PORT` | `3001` | Server listening port |

### Step 4: Generate Public Domain
1. In the service settings, navigate to **Networking** → **Public Networking**.
2. Click **Generate Domain** (e.g. `civicax-production.up.railway.app`).
3. Test your health endpoint in the browser or terminal:
   ```bash
   curl -s https://civicax-production.up.railway.app/api/v1/health
   ```

---

## 🐘 Option 2: Supabase PostgreSQL Database Setup

### Step 1: Create a Supabase Project
1. Log in to [Supabase](https://supabase.com).
2. Click **New Project**, choose your organization, and select the region closest to your Railway backend (e.g., `AWS ap-south-1 Mumbai` or `us-east-1`).
3. Set a secure database password and save it.

### Step 2: Copy Connection Strings
1. In Supabase, go to **Project Settings** → **Database** → **Connection strings**.
2. **Transaction Pooler (Port 6543)** — Used for runtime queries:
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
   ```
   *Note: CivicaX's database configuration automatically appends `sslmode=require&pgbouncer=true` if omitted.*
3. **Session Pooler / Direct Connection (Port 5432)** — Used for schema migrations:
   ```
   postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres?sslmode=require
   ```

### Step 3: Apply Migrations & Seed Data
From your local terminal:
```bash
# Set your Supabase connection strings
export DATABASE_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
export DIRECT_URL="postgresql://postgres.[ref]:[pass]@aws-0-[region].pooler.supabase.com:5432/postgres?sslmode=require"

cd server

# Validate schema
npx prisma validate

# Push/deploy migrations to Supabase
npx prisma migrate deploy

# Seed demo users, emergency zones, and Kedarnath telemetry
node seeds/seed.js
```

---

## ⚡ Option 3: Vercel Frontend Deployment

### Step 1: Import Project in Vercel
1. Log in to [Vercel Dashboard](https://vercel.com).
2. Click **Add New** → **Project** → select your `CivicaX` repository.
3. In **Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `client`

### Step 2: Configure Environment Variables
In the **Environment Variables** section, add:
| Variable | Value | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `https://your-railway-app.up.railway.app/api/v1` | Production Railway backend base API URL |
| `VITE_API_URL` | `https://your-railway-app.up.railway.app` | Production Railway host for WebSockets |

### Step 3: Deploy & Verify
1. Click **Deploy**.
2. Once deployed (e.g. `https://civicax.vercel.app`), add this URL to `CORS_ORIGIN` in your Railway backend variables.

---

## 🛡️ Zero-Downtime & Resilience Mechanics

CivicaX is engineered with automated zero-downtime resilience:

1. **Non-Crashing Database Migrations**:
   - `startCommand` invokes `node prisma/migrate.js && node index.js`.
   - If PostgreSQL is provisioning or momentarily unreachable, migrations log a warning and exit code 0.
   - The server boots smoothly in **Offline Demo Mode** instead of entering a crash loop.

2. **Dynamic SSL & Connection Pooling**:
   - `server/config/prisma.js` sanitizes database URLs on startup.
   - Remote hosts automatically receive `sslmode=require`.
   - Supabase poolers (port 6543) automatically receive `pgbouncer=true&connection_limit=10`.

3. **Multi-Stage Docker Container**:
   - `server/Dockerfile` builds on `node:22-alpine` with `libc6-compat` and `openssl`.
   - Employs a non-root user (`civicax:nodejs` UID 1001) for strict security compliance.
   - Caches node modules and pre-generates the Prisma Client during build.

4. **Health Check Probing**:
   - `GET /api/v1/health` and `GET /health` monitor:
     - `uptime`: Process lifetime in seconds.
     - `database`: `ONLINE` or `OFFLINE_DEMO_MODE`.
     - `pipeline`: Real-time status of the Mandakini Basin disaster intelligence pipeline.
     - `memory`: Heap used/total and RSS metrics in megabytes.

---

## 🧪 Local & CI Verification

Run the automated test suite locally before pushing to production:

```bash
# 1. Verify Prisma models and generate client
cd server
npx prisma validate
npx prisma generate

# 2. Syntax validation
node -c index.js

# 3. Execute health and resilience test suite (Node native test runner)
npm test

# 4. Monorepo root test
cd ..
npm test
```
