<div align="center">

<img src="https://img.shields.io/badge/CivicaX-Disaster%20Intelligence%20Platform-0ea5e9?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=" alt="CivicaX" />

# 🌊 CivicaX — Disaster Intelligence Command Center

### *Real-time flood prediction · AI-powered emergency dispatch · Satellite hydrology pipeline*

[![Live Demo](https://img.shields.io/badge/🌐_Live_App-civicax.vercel.app-6366f1?style=for-the-badge)](https://civicax.vercel.app)
[![API](https://img.shields.io/badge/⚡_Backend_API-Railway-22c55e?style=for-the-badge)](https://civicax-production.up.railway.app)
[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-dc2626?style=for-the-badge)](./LICENSE)

[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio)](https://socket.io)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma)](https://prisma.io)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Leaflet](https://img.shields.io/badge/Leaflet_Maps-199900?style=flat-square&logo=leaflet)](https://leafletjs.com)

</div>

---

## 📖 What is CivicaX?

**CivicaX** is a full-stack, AI-augmented disaster intelligence platform built for the **Mandakini River Basin / Kedarnath** region. It continuously ingests satellite hydrology data — rainfall, soil moisture, river levels, and topographic slope — runs them through a physics-based flood engine, and delivers real-time risk scores to citizens, emergency responders, civic managers, and government officials — all from a single unified command center.

> **Built for:** District Collectors, Emergency Responders, Civic Field Teams, and Citizens in flood-prone Himalayan river basins.

---

## ✨ Feature Overview

<table>
<tr>
<td width="50%">

### 🛰️ Satellite Hydrology Pipeline
- **Open-Meteo** rainfall fetch every 10 minutes
- **NASA GPM IMERG** precipitation with graceful fallback
- **NASA SMAP** soil moisture (live API)
- **SRTM** elevation & slope analysis
- **Overpass OSM** street network ingestion
- **Manning's equation** hydraulic routing
- Flood snapshots saved to DB every cycle
- Runs immediately on server startup (no cold-start delay)

</td>
<td width="50%">

### 🌊 Flood Risk Engine
- Physics-based composite scoring:
  - Rain `0.35` · Forecast `0.30` · Soil `0.25` · Slope `0.10`
- Street-level flood spread routing
- Per-segment `FloodZoneRisk` records
- `alertLevel`: `green` → `yellow` → `orange` → `red`
- River ETA (minutes to overflow) calculation
- AI-generated situation summaries (Gemini 1.5 Flash)
- Government briefing generation for District Collectors

</td>
</tr>
<tr>
<td width="50%">

### 🚨 Emergency Responder Portal
- Live **Leaflet map** with real-time WebSocket layers
- Flood street overlay with risk-coloured segments
- Landslide risk overlay
- Safe zone & evacuation camp markers
- Active alert markers with severity badges
- Dispatch unit tracking
- SOS management with coordinate pinning
- Road closure reporting & status tracking

</td>
<td width="50%">

### 🏛️ Government Command Center
- Situation map — all layers in one view
- Active flood alerts with AI-generated official briefings
- Resource allocation dashboard
- Relief camp capacity monitoring
- Missing persons registry
- Volunteer deployment coordination
- Medical resource tracking
- Dam structural risk assessment

</td>
</tr>
<tr>
<td width="50%">

### 🛠️ Civic Manager Portal
- Public infrastructure issue reporting
- Pothole, streetlight & waste complaints
- Department-level dispatch assignment
- Status tracking (Open → In Progress → Resolved)
- Citizen feedback loop

</td>
<td width="50%">

### 👤 Citizen App
- Personal dashboard with local risk level
- Push notifications (browser) for flood alerts
- Nearby safe zones & evacuation routes
- Safety watch crowdsourced reports
- Community credibility scoring
- Missing person reports

</td>
</tr>
</table>

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CivicaX Platform                         │
├─────────────────────────┬───────────────────────────────────────┤
│       FRONTEND          │              BACKEND                   │
│  React 18 + Vite        │   Node.js / Express                   │
│  Tailwind CSS           │   Socket.io (real-time)               │
│  Framer Motion          │   Prisma ORM                          │
│  Leaflet Maps           │   PostgreSQL (Railway)                │
│  Recharts               │   Google Gemini 1.5 Flash (AI)        │
│  Zustand (state)        │                                       │
├─────────────────────────┴───────────────────────────────────────┤
│                   SATELLITE DATA PIPELINE                        │
│  Open-Meteo · NASA GPM IMERG · NASA SMAP · SRTM · OSM          │
│  → floodEngine.js → FloodSnapshot → FloodZoneRisk              │
│  → Socket.io broadcast → Live UI update                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Project Structure

```
CivicaX/
├── client/                     # React + Vite frontend
│   └── src/
│       ├── components/
│       │   ├── emergency/      # FloodPredictionPanel, FloodHistoryChart
│       │   ├── government/     # ActiveFloodAlerts, GovernmentSituationMap
│       │   ├── map/            # FloodStreetOverlay, LandslideOverlay
│       │   └── civic/          # IssueCard, DispatchPanel
│       ├── pages/              # LandingPage, EmergencyPage, GovernmentPage ...
│       ├── services/           # floodAlertNotifier.js (push notifications)
│       └── stores/             # Zustand auth + alert stores
│
├── server/                     # Node.js / Express backend
│   ├── index.js                # App entry + route registration
│   ├── modules/
│   │   ├── hydrology/
│   │   │   ├── floodEngine.js  # Physics-based flood scoring
│   │   │   └── pipeline.js     # Satellite polling scheduler
│   │   ├── satellite/          # Open-Meteo, GPM, SMAP, SRTM fetchers
│   │   └── ai/                 # governmentBriefing.js (Gemini)
│   ├── routes/                 # emergency, civic, admin, sos, medical ...
│   ├── socket/                 # Real-time event handlers
│   └── prisma/schema.prisma    # Full DB schema (20+ models)
│
├── railway.json                # Railway deployment config
└── SETUP.md                    # Local dev setup guide
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- PostgreSQL database
- Google Gemini API Key (free at [ai.google.dev](https://ai.google.dev))

### 1. Clone & Install

```bash
git clone https://github.com/akshayjadhav237237-cmd/CivicaX.git
cd CivicaX

# Install backend dependencies
cd server && npm install

# Install frontend dependencies
cd ../client && npm install
```

### 2. Configure Environment

Create `server/.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/civicax"
JWT_SECRET="your-super-secret-jwt-key"
GEMINI_API_KEY="your-gemini-api-key"
PORT=5000
NODE_ENV=development
```

### 3. Setup Database

```bash
cd server
npx prisma migrate dev
npx prisma db seed
```

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

Open **http://localhost:5173** 🎉

---

## 🌐 Live Deployment

| Service | URL | Platform |
|---------|-----|----------|
| 🎨 Frontend | [civicax.vercel.app](https://civicax.vercel.app) | Vercel |
| ⚡ Backend API | [civicax-production.up.railway.app](https://civicax-production.up.railway.app) | Railway |
| 🗄️ Database | Managed PostgreSQL | Railway |

---

## 👥 Demo Accounts

All demo accounts use password: **`demo1234`**

| Role | Email | Access |
|------|-------|--------|
| 👤 Citizen | `citizen@civicax.demo` | Dashboard, Safety Reports, Alerts |
| 🔧 Department Operator | `dept@civicax.demo` | Civic Manager, Issue Dispatch |
| 🚨 Emergency Responder | `responder@civicax.demo` | Emergency Map, Dispatch, SOS |
| 🏛️ Government Collector | `gov@civicax.demo` | Full Government Command Center |
| ⚙️ Admin | `admin@civicax.demo` | All portals + Admin Panel |

---

## 🔌 Key API Endpoints

```
GET  /api/v1/emergency/flood-risk          → Current flood risk data
GET  /api/v1/emergency/flood-history       → Last 6 prediction snapshots
POST /api/v1/emergency/flood-prediction/trigger  → Force pipeline run
GET  /api/v1/emergency/alerts              → Active emergency alerts
POST /api/v1/sos                           → Submit SOS request
GET  /api/v1/roads                         → Road closure status
GET  /api/v1/missing                       → Missing persons registry
POST /api/v1/volunteers                    → Volunteer registration
GET  /health                               → Server health check
```

---

## ⚡ Real-Time WebSocket Events

| Event | Payload | Consumer |
|-------|---------|----------|
| `zone:flood-prediction` | `{ zoneId, alertLevel, riverStatus, summary }` | All portals |
| `alert:new` | Alert object | Citizen, Emergency, Gov |
| `dispatch:new` | Dispatch assignment | Emergency Responder |
| `sos:new` | SOS location + details | Emergency Responder, Gov |
| `road:blockage` | Road closure data | Civic Manager, Gov |

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 18, Vite, TailwindCSS, Framer Motion |
| **State Management** | Zustand |
| **Maps** | Leaflet.js + react-leaflet |
| **Charts** | Recharts (AreaChart, trend sparklines) |
| **Backend** | Node.js, Express.js |
| **Real-time** | Socket.io |
| **Database** | PostgreSQL + Prisma ORM |
| **AI** | Google Gemini 1.5 Flash |
| **Satellite Data** | Open-Meteo, NASA GPM IMERG, NASA SMAP, SRTM |
| **Hydrology** | Manning's equation, composite flood scoring |
| **Auth** | JWT + bcrypt |
| **Deployment** | Vercel (frontend) + Railway (backend + DB) |

---

## 🧪 Testing the Pipeline

```bash
# Trigger a manual flood prediction run
curl -X POST https://civicax-production.up.railway.app/api/v1/emergency/flood-prediction/trigger \
  -H "Content-Type: application/json" \
  -d '{"lat": 30.7346, "lon": 79.0669}'

# Check current flood risk
curl https://civicax-production.up.railway.app/api/v1/emergency/flood-risk

# Server health
curl https://civicax-production.up.railway.app/health
```

---

## 📊 Flood Risk Scoring

The `floodEngine.js` computes a composite risk score every 10 minutes:

```
Risk Score = (Rainfall × 0.35) + (Forecast × 0.30) + (Soil Moisture × 0.25) + (Slope × 0.10)
```

| Score Range | Alert Level | Action |
|-------------|-------------|--------|
| 0.0 – 0.39 | 🟢 `green` | Normal monitoring |
| 0.4 – 0.59 | 🟡 `yellow` | Elevated watch |
| 0.6 – 0.79 | 🟠 `orange` | Prepare evacuation |
| 0.8 – 1.0+ | 🔴 `red` | Immediate evacuation |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is protected under a **Custom Proprietary License**.

- ✅ You **may view** the source code for educational reference
- ❌ You **may NOT** copy, use, modify, or redistribute any part of this code or concept
- ❌ You **may NOT** replicate the architecture or ideas in another project — even if rewritten from scratch
- ❌ You **may NOT** use this commercially without explicit written permission

> **© 2025 Akshay Jadhav — All Rights Reserved.**
> Written permission required for any use beyond viewing. See [LICENSE](./LICENSE) for full terms.


---

<div align="center">

**Built with ❤️ for disaster resilience in the Mandakini River Basin**

*Protecting communities through intelligent technology*

⭐ **Star this repo if you find it useful!** ⭐

[![GitHub stars](https://img.shields.io/github/stars/akshayjadhav237237-cmd/CivicaX?style=social)](https://github.com/akshayjadhav237237-cmd/CivicaX)
[![GitHub forks](https://img.shields.io/github/forks/akshayjadhav237237-cmd/CivicaX?style=social)](https://github.com/akshayjadhav237237-cmd/CivicaX/fork)

</div>
