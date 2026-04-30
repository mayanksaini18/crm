# Gharpayy Lead Management CRM

MVP for Gharpayy's PG reservation business — captures leads, tracks a booking pipeline, schedules property visits, and surfaces metrics on a dashboard.

## Features
- **Lead Capture** — form with source, budget, move-in date, location preferences
- **Ownership** — assign leads to agents; role-based visibility (Admin / Agent)
- **Pipeline** — Kanban board across 7 stages: New → Contacted → Visit Scheduled → Visited → Negotiating → Converted / Lost
- **Visit Scheduling** — schedule, complete, and track property visits per lead
- **Dashboard** — KPIs, funnel chart, source breakdown, agent leaderboard

## Stack
Next.js 15 · TypeScript · Tailwind CSS · shadcn/ui · Prisma · PostgreSQL · NextAuth.js · Vercel

## Docs
- [Architecture](ARCHITECTURE.md) — data models, API routes, folder structure
- [Plan](PLAN.md) — phased implementation plan with time estimates
- [Todos](TODOS.md) — granular task checklist

## Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | admin@gharpayy.com | admin123 |
| Agent | agent1@gharpayy.com | agent123 |

## Quick Start
```bash
npm install
cp .env.example .env.local
# fill in DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL
npx prisma migrate dev
npx prisma db seed
npm run dev
```
