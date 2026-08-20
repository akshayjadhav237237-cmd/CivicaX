<div align="center">

# 🏛️ CivicaX
### **Next-Generation Hyperlocal Disaster Intelligence & Civic Command Ecosystem**
*Empowering Himalayan River Basins with Physics-Based Flood Modeling, Satellite Hydrology, and Real-Time Autonomous Emergency Dispatch.*

<br/>

[![Live Production Demo](https://img.shields.io/badge/🌐_Live_Demo-civicax--indol.vercel.app-6366f1?style=for-the-badge&logo=vercel&logoColor=white)](https://civicax-indol.vercel.app)
[![API Gateway](https://img.shields.io/badge/⚡_API_Gateway-Railway_Production-22c55e?style=for-the-badge&logo=railway&logoColor=white)](https://civicax-production.up.railway.app)
[![Proprietary License](https://img.shields.io/badge/License-Proprietary_v1.0-dc2626?style=for-the-badge&logo=open-access&logoColor=white)](./LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/akshayjadhav237237-cmd/CivicaX?style=for-the-badge&color=eab308&logo=github)](https://github.com/akshayjadhav237237-cmd/CivicaX/stargazers)

<br/>

<!-- Tech Stack Matrix Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Vite_8-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Leaflet_Maps-199900?style=flat-square&logo=leaflet&logoColor=white" alt="Leaflet" />
  <img src="https://img.shields.io/badge/Node.js_20-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express_5-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Socket.io-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="Socket.io" />
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/Google_Gemini_1.5-8E75B2?style=flat-square&logo=googlegemini&logoColor=white" alt="Gemini" />
</p>

[Explore Live Web App](https://civicax-indol.vercel.app) • [View Architecture](#-system-architecture) • [Demo Accounts](#-one-click-demo-credentials) • [API Reference](#-api-endpoints-cheatsheet) • [License Notice](#-intellectual-property--license)

---

</div>

<br/>

## 🎯 Executive Overview

**CivicaX** is an end-to-end disaster management and civic administration command platform engineered specifically for flash flood and cloudburst vulnerabilities in the **Mandakini River Basin (Kedarnath, Uttarakhand)**.

By combining **real-time satellite telemetry**, **Manning's open-channel fluid dynamics**, **high-resolution SRTM elevation slope models**, and **Google Gemini AI intelligence**, CivicaX bridges the gap between raw hydrological sensors and instant municipal action.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CORE CAPABILITIES                                     │
├────────────────────────┬────────────────────────┬───────────────────────────────────────┤
│  🌊 Early Detection    │  📡 Real-Time Dispatch │  🏛️ Multi-Agency Synergy              │
│  10-min satellite loop │  Sub-second WebSocket  │  Synchronized portals for Citizens,   │
│  with automated runoff │  broadcasts for SOS &  │  Responders, Civic Depts, Government  │
│  & street-inundation.  │  road blockages.       │  Magistrates & System Administrators. │
└────────────────────────┴────────────────────────┴───────────────────────────────────────┘
```

---

## 🧭 Navigation Index

- [✨ Four Pillars of CivicaX](#-four-pillars-of-civicax)
- [🛰️ Satellite Hydrology & Physics Pipeline](#️-satellite-hydrology--physics-pipeline)
- [🏗️ System Architecture](#-system-architecture)
- [🗺️ Street-Level Micro-Zone Inundation Engine](#️-street-level-micro-zone-inundation-engine)
- [👥 One-Click Demo Credentials](#-one-click-demo-credentials)
- [🔌 API Endpoints Cheatsheet](#-api-endpoints-cheatsheet)
- [⚡ Real-Time WebSocket Matrix](#-real-time-websocket-matrix)
- [🚀 Quickstart & Local Deployment](#-quickstart--local-deployment)
- [📄 Intellectual Property & License](#-intellectual-property--license)

---

## ✨ Four Pillars of CivicaX

<table width="100%">
<tr>
<td width="50%" valign="top">

### 🌊 Pillar I: Emergency Response & Hydrology
*Engineered for first-responders, NDRF units, and field commanders.*

- 🗺️ **Interactive Tactical Map**: Vector-rendered Leaflet map featuring real-time water depth contours and landslide hazard zones.
- 🔴 **Live SOS Beaconing**: Instant GPS pin broadcasting with status updates from citizens trapped in hazard areas.
- 🚧 **Dynamic Road Closures**: Real-time obstacle logging to prevent emergency vehicle routing into submerged paths.
- 📸 **CCTV Telemetry Verification**: Real-time cross-referencing between satellite triggers and riverbank optical sensors.

</td>
<td width="50%" valign="top">

### 🏛️ Pillar II: Government Command Center
*Designed for District Collectors, Magistrates, and Disaster Management Authorities.*

- 📋 **AI Situation Briefings**: Autonomous Google Gemini 1.5 Flash summaries translating technical telemetry into executive briefs.
- 🏢 **Relief Camp Logistics**: Live bed capacity, food rationing, and medical supplies monitoring across safe zones.
- 🔍 **Missing Persons Registry**: Centralized searchable registry with photograph tracking and family reunification alerts.
- 🛡️ **Dam & Structural Safety**: Reservoir capacity stress metrics and downstream warning thresholds.

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🛠️ Pillar III: Civic Grievance & Infrastructure
*Streamlining urban maintenance and public utility repairs.*

- 📸 **Visual Grievance Reports**: Citizen submissions with geo-tagged images for potholes, broken streetlights, and drainage blocks.
- 🏢 **Departmental Routing**: Automated dispatch to Sanitation, Public Works (PWD), Electrical, and Water Supply boards.
- ⏳ **SLA & Resolution Pipeline**: Multi-stage ticket tracker (`Submitted` → `Assigned` → `In Progress` → `Resolved`).

</td>
<td width="50%" valign="top">

### 👤 Pillar IV: Citizen Life Safety & Watch
*Personal safety radar in the pocket of every resident and pilgrim.*

- 🔔 **Instant Browser Push Alerts**: Native notifications for critical flash flood threats and evacuation notices.
- 🧭 **Hyperlocal Safe Routes**: Immediate navigation toward the nearest elevated terrain and operational relief shelter.
- 🤝 **Community Verification**: Crowdsourced incident reporting backed by automated community trust scoring.
- 📶 **Offline Demo Resilience**: Seamless simulated data layer ensuring continuity during network dropouts.

</td>
</tr>
</table>

---

## 🛰️ Satellite Hydrology & Physics Pipeline

CivicaX executes an automated multi-source ingestion pipeline on server boot and recurring every **10 minutes**:

```mermaid
flowchart LR
    subgraph DataIngestion[Telemetry Ingestion]
        A[Open-Meteo API] --> E[Hydrology Orchestrator]
        B[NASA GPM IMERG] --> E
        C[NASA SMAP Soil API] --> E
        D[SRTM 30m Elevation] --> E
    end

    subgraph PhysicsEngine[Physics & Inundation Model]
        E --> F[SCS Curve Runoff Model]
        F --> G[Manning's Open-Channel Flow]
        G --> H[Street-Level Flood Risk Vector]
    end

    subgraph IntelligenceLayer[Intelligence & Broadcast]
        H --> I[Gemini 1.5 AI Briefing]
        H --> J[PostgreSQL / Prisma Snapshot]
        H --> K[Socket.io Broadcast Room]
    end
```

### 🧮 Physics-Based Composite Scoring Formula

The core algorithm computes a normalised composite risk factor $R \in [0, 1]$:

$$R = (P_{\text{rain}} \times 0.35) + (P_{\text{forecast}} \times 0.30) + (S_{\text{soil}} \times 0.25) + (\theta_{\text{slope}} \times 0.10)$$

| Risk Score Range | Alert Tier | Visual Grading | Recommended Action |
| :--- | :---: | :---: | :--- |
| **0.00 – 0.39** | 🟢 **GREEN** | `#10B981` | Normal baseline monitoring; safe conditions. |
| **0.40 – 0.59** | 🟡 **YELLOW** | `#F59E0B` | Elevated advisory; mobilize field observers. |
| **0.60 – 0.79** | 🟠 **ORANGE** | `#F97316` | High hazard; stage evacuation transports. |
| **0.80 – 1.00** | 🔴 **RED** | `#EF4444` | Immediate life-safety emergency; mandatory evacuation. |

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                    CIVICAX ECOSYSTEM                                     │
└────────────────────────────────────────────┬─────────────────────────────────────────────┘
                                             │
               ┌─────────────────────────────┴─────────────────────────────┐
               ▼                                                           ▼
┌──────────────────────────────┐                           ┌──────────────────────────────┐
│       CLIENT LAYER           │                           │       BACKEND SERVICES       │
│  • React 18 + Vite SPA       │                           │  • Express 5 REST API        │
│  • Tailwind CSS 4 Design     │ ◄─── REST & WebSockets ──►│  • Socket.io Gateway         │
│  • Leaflet Interactive Maps  │                           │  • Prisma ORM Layer          │
│  • Zustand State Management  │                           │  • Hydrology Engine Module   │
│  • Glassmorphism Design      │                           │  • Google Gemini AI Pipeline │
└──────────────────────────────┘                           └──────────────┬───────────────┘
                                                                          │
                                           ┌──────────────────────────────┴────────────────┐
                                           ▼                                               ▼
                            ┌──────────────────────────────┐                ┌──────────────────────────────┐
                            │      DATA STORAGE LAYER      │                │   EXTERNAL SATELLITE APIS    │
                            │  • PostgreSQL Database       │                │  • Open-Meteo Weather        │
                            │  • Multi-Tenant Schema       │                │  • NASA GPM Precipitation    │
                            │  • Micro-Zone Risk Tables    │                │  • NASA SMAP Soil Moisture   │
                            │  • Offline Memory Fallbacks  │                │  • Overpass OSM Vector Grid  │
                            └──────────────────────────────┘                └──────────────────────────────┘
```

---

## 🗺️ Street-Level Micro-Zone Inundation Engine

CivicaX breaks down the complex topography of the Mandakini Basin into granular micro-zones:

```
🏔️ Kedarnath Temple Ridge (3,583m)
  ├── 📍 Zone A: Mandakini North Bank [High Velocity Inundation Corridor]
  ├── 📍 Zone B: Temple Complex Plaza [Pedestrian & Pilgrim Concentration Area]
  ├── 📍 Zone C: Rambara Bridge Approach [Critical Chokepoint & Evacuation Axis]
  └── 📍 Zone D: Gaurikund Base Transit [Shelter Staging & Resource Depot]
```

---

## 👥 One-Click Demo Credentials

Access all specialized interfaces using the unified test password **`demo1234`**:

| Portal Role | Demo Email Address | Password | Accessible Modules |
| :--- | :--- | :--- | :--- |
| 👤 **Citizen** | `citizen@civicax.demo` | `demo1234` | Personal Safety Radar, Civic Grievance, Live Alerts |
| 🚨 **Emergency Responder** | `responder@civicax.demo` | `demo1234` | Tactical Map, SOS Rescue Console, Road Closures |
| 🔧 **Department Operator** | `dept@civicax.demo` | `demo1234` | Civic Issue Dispatch, PWD Repair Tickets, Field Ops |
| 🏛️ **Government Collector** | `gov@civicax.demo` | `demo1234` | AI Situation Reports, Camps, Dam Telemetry, Whitelist |
| ⚙️ **System Admin** | `admin@civicax.demo` | `demo1234` | Full Global Access, API Health Matrix, Telemetry Pollers |

---

## 🔌 API Endpoints Cheatsheet

### 🚨 Emergency & Hydrology
```http
GET    /api/v1/emergency/flood-risk           Fetch real-time composite flood risk telemetry
GET    /api/v1/emergency/flood-history        Fetch historical prediction snapshots (last 6 cycles)
POST   /api/v1/emergency/flood-prediction/trigger  Manually trigger on-demand satellite computation
GET    /api/v1/emergency/alerts               Query all active emergency broadcast bulletins
POST   /api/v1/sos                            Submit emergency distress signal with coordinates
GET    /api/v1/roads                          Query active road closures and route obstructions
```

### 🏛️ Government & Civic Management
```http
GET    /api/v1/civic/grievances               Query reported municipal infrastructure issues
POST   /api/v1/civic/grievances               Submit new grievance with photo attachment
PATCH  /api/v1/civic/grievances/:id/status    Update ticket lifecycle (assigned, in_progress, resolved)
GET    /api/v1/government/camps               Monitor relief shelter capacities and logistics
GET    /api/v1/missing                        Search missing persons registry
POST   /api/v1/volunteers                     Register disaster relief volunteer personnel
```

---

## ⚡ Real-Time WebSocket Matrix

All real-time streaming runs over authenticated Socket.io channels:

| Event Identifier | Direction | Payload Structure | Scope / Listener |
| :--- | :---: | :--- | :--- |
| `zone:flood-prediction` | `Server ➔ Client` | `{ zoneId, alertLevel, riverStatus, summary }` | All active dashboards & maps |
| `sos:new` | `Client ➔ Server ➔ Client` | `{ id, location: { lat, lon }, message, urgency }` | Responder & Government maps |
| `alert:new` | `Server ➔ Client` | `{ id, severity, title, affectedArea, instructions }` | Citizen push & ticker banners |
| `road:blockage` | `Server ➔ Client` | `{ roadId, lat, lon, reason, alternativeRoute }` | Tactical navigation layers |

---

## 🚀 Quickstart & Local Deployment

### 📋 Prerequisites
- **Node.js** v18.0.0 or higher
- **PostgreSQL** 14+ (or Railway / Supabase Postgres instance)
- **Google Gemini API Key** ([Get free API key](https://aistudio.google.com/))

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/akshayjadhav237237-cmd/CivicaX.git
cd CivicaX
```

### 2️⃣ Configure Environment Variables
Create `server/.env`:
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/civicax"
JWT_SECRET="civicax_super_secret_jwt_key_2026"
JWT_REFRESH_SECRET="civicax_super_secret_refresh_key_2026"
GEMINI_API_KEY="your-google-gemini-api-key"
```

Create `client/.env`:
```env
VITE_API_BASE_URL="http://localhost:3001/api/v1"
VITE_WS_URL="http://localhost:3001"
```

### 3️⃣ Initialize Database
```bash
cd server
npm install
npx prisma generate
npx prisma db push
node prisma/seed.js
```

### 4️⃣ Start Development Services
```bash
# Terminal A (Backend)
cd server
npm run dev

# Terminal B (Frontend)
cd client
npm install
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 📄 Intellectual Property & License

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                         CIVICAX PROPRIETARY LICENSE v1.0
             Copyright (c) 2025-2026 Akshay Jadhav. All Rights Reserved.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

This repository and its underlying architecture, hydrology formulas, user interfaces, AI prompt workflows, and data orchestration systems are **strictly proprietary**.

- 👁️ **Permitted**: Public viewing and educational source inspection on GitHub.
- 🚫 **Prohibited**: Copying, commercial exploitation, redistribution, sublicensing, or replicating the core concept in any alternative codebase without prior written authorization.

For licensing inquiries or governmental deployment pilots, contact **[Akshay Jadhav](https://github.com/akshayjadhav237237-cmd)**.

---

<div align="center">

**Built with pride for Himalayan climate resilience and public safety.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com)
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app)

⭐ **If you find CivicaX impactful, please consider starring the repository!** ⭐

</div>
