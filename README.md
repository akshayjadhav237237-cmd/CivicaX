# CivicaX Platform

CivicaX is an interactive, civic-management and emergency-response platform designed with a modern "liquid glass" UI. It features specific modules for different types of civic and safety management scenarios.

## 🌟 Core Pillars

1. **Emergency Responder (Pillar I):** Manage emergency zones, active alerts, safe zones, and environmental data (elevation, population density).
2. **Civic Manager (Pillar II):** Handle pothole reports, broken streetlights, waste management, and infrastructure monitoring.
3. **Safety Watch (Pillar III):** Report safety incidents, verify them via community features, and track credibility scores.
4. **Government Command Center:** Top-level view of all active emergencies, audit logs, and resource allocation.

## 🛠 Tech Stack

- **Frontend:** React + Vite, Tailwind CSS, Framer Motion, Zustand for state management.
- **Backend:** Node.js, Express, Socket.io for real-time alerts.
- **Database:** PostgreSQL (managed natively via Prisma ORM).

## 🚀 Getting Started

See [SETUP.md](./SETUP.md) for detailed instructions on local development, environment variables, and running the application.

## 👥 Demo Users

The database seed provides several demo accounts:
- `citizen@civicax.demo`
- `dept@civicax.demo`
- `gov@civicax.demo`
- `admin@civicax.demo`

*(Password for all demo accounts: `demo1234`)*
