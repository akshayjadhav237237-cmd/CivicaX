# Local Setup Guide

Follow these steps to run the CivicaX platform locally.

## Prerequisites
- Node.js (v18+)
- Postgres database (local or cloud like Supabase/Neon)

## 1. Backend Setup (`/server`)

1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and set your Postgres connect string:
   ```env
   DATABASE_URL="postgresql://user:password@host:port/dbname"
   ```
4. Run Prisma database migrations:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Seed the database with demo users, zones, and reports:
   ```bash
   node seeds/seed.js
   ```
6. Start the server (runs on `http://localhost:3001`):
   ```bash
   node index.js
   ```

## 2. Frontend Setup (`/client`)

1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the application in your browser at `http://localhost:5173`.
