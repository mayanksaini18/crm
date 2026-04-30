# Gharpayy Lead Management CRM — System Architecture

## Overview

A full-stack Lead Management CRM for Gharpayy's PG (Paying Guest) reservation business. Agents capture prospect leads, track them through a booking pipeline, schedule property visits, and managers monitor conversion metrics via a dashboard.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) + TypeScript | Full-stack, file-based routing, server components |
| Styling | Tailwind CSS + shadcn/ui | Fast, consistent, accessible components |
| Database | PostgreSQL | Relational, robust for CRM relationships |
| ORM | Prisma | Type-safe queries, easy migrations |
| Auth | NextAuth.js (Credentials) | Simple role-based auth, email+password for MVP |
| State | React Query (TanStack Query) | Server state caching, optimistic updates |
| Deployment | Vercel + Vercel Postgres | Zero-config deployment |

---

## Data Models (Prisma Schema)

```prisma
model User {
  id         String   @id @default(cuid())
  name       String
  email      String   @unique
  password   String   // hashed (bcrypt)
  role       Role     @default(AGENT)
  createdAt  DateTime @default(now())

  leads      Lead[]   @relation("AssignedAgent")
  visits     Visit[]
  activities Activity[]
}

enum Role {
  ADMIN
  AGENT
}

model Lead {
  id           String       @id @default(cuid())
  name         String
  phone        String
  email        String?
  source       LeadSource
  stage        PipelineStage @default(NEW)
  budget       Int?          // monthly rent budget in INR
  moveInDate   DateTime?
  propertyType String?       // "1BHK", "2BHK", "single room", etc.
  location     String?       // preferred locality
  notes        String?
  lostReason   String?
  assignedTo   String?       // User.id
  agent        User?         @relation("AssignedAgent", fields: [assignedTo], references: [id])
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt

  visits       Visit[]
  activities   Activity[]
}

enum LeadSource {
  WEBSITE
  REFERRAL
  WALK_IN
  PHONE
  SOCIAL_MEDIA
  OTHER
}

enum PipelineStage {
  NEW           // Just captured
  CONTACTED     // First contact made
  VISIT_SCHEDULED // Visit booked
  VISITED       // Property visited
  NEGOTIATING   // Price/terms discussion
  CONVERTED     // Booking confirmed
  LOST          // Did not convert
}

model Visit {
  id          String      @id @default(cuid())
  leadId      String
  lead        Lead        @relation(fields: [leadId], references: [id])
  agentId     String
  agent       User        @relation(fields: [agentId], references: [id])
  property    String      // property name / address
  scheduledAt DateTime
  status      VisitStatus @default(SCHEDULED)
  notes       String?
  createdAt   DateTime    @default(now())
}

enum VisitStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  NO_SHOW
}

model Activity {
  id          String   @id @default(cuid())
  leadId      String
  lead        Lead     @relation(fields: [leadId], references: [id])
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  type        String   // "NOTE", "CALL", "EMAIL", "STAGE_CHANGE", "VISIT", "ASSIGNED"
  description String
  createdAt   DateTime @default(now())
}
```

---

## API Routes

All routes live under `/app/api/`. Authentication is enforced server-side via `getServerSession`.

```
POST   /api/auth/[...nextauth]     — NextAuth login/logout
GET    /api/auth/session           — Current session

GET    /api/leads                  — List leads (with filters: stage, agent, source, search)
POST   /api/leads                  — Create lead
GET    /api/leads/:id              — Lead detail + activities
PATCH  /api/leads/:id              — Update lead (stage, assignment, fields)
DELETE /api/leads/:id              — Soft delete (ADMIN only)

GET    /api/visits                 — List visits (with date range filter)
POST   /api/visits                 — Schedule visit
PATCH  /api/visits/:id             — Update visit status/notes
DELETE /api/visits/:id             — Cancel visit

GET    /api/users                  — List agents (ADMIN only)
POST   /api/users                  — Create agent (ADMIN only)
PATCH  /api/users/:id              — Update user
DELETE /api/users/:id              — Deactivate user (ADMIN only)

GET    /api/dashboard              — Aggregated metrics for dashboard
```

---

## Page Structure

```
app/
├── (auth)/
│   └── login/page.tsx             — Login screen
├── (dashboard)/
│   ├── layout.tsx                 — Sidebar + topbar shell
│   ├── page.tsx                   — Dashboard (KPIs, charts)
│   ├── leads/
│   │   ├── page.tsx               — Lead list + filters
│   │   ├── new/page.tsx           — Capture new lead form
│   │   └── [id]/page.tsx          — Lead detail + activity timeline
│   ├── pipeline/
│   │   └── page.tsx               — Kanban board by stage
│   ├── visits/
│   │   └── page.tsx               — Visit list / calendar view
│   └── users/
│       └── page.tsx               — User management (ADMIN only)
```

---

## Folder Structure

```
gharpayy-crm/
├── app/                           — Next.js App Router
│   ├── api/                       — Server-side API handlers
│   ├── (auth)/
│   └── (dashboard)/
├── components/
│   ├── ui/                        — shadcn primitives
│   ├── leads/                     — Lead card, form, detail
│   ├── pipeline/                  — Kanban column, card
│   ├── visits/                    — Visit form, list item
│   ├── dashboard/                 — KPI card, charts
│   └── layout/                    — Sidebar, topbar, nav
├── lib/
│   ├── db.ts                      — Prisma client singleton
│   ├── auth.ts                    — NextAuth config
│   └── utils.ts                   — Shared helpers
├── prisma/
│   ├── schema.prisma
│   └── seed.ts                    — Seed data (demo agents + leads)
├── types/
│   └── index.ts                   — Shared TypeScript types
├── ARCHITECTURE.md
├── PLAN.md
└── TODOS.md
```

---

## Authorization Rules

| Action | ADMIN | AGENT |
|---|---|---|
| View all leads | Yes | Own leads only |
| Assign leads | Yes | Cannot reassign |
| Delete leads | Yes | No |
| View all visits | Yes | Own visits only |
| Manage users | Yes | No |
| View dashboard | Yes | Own metrics only |

---

## Pipeline Flow

```
NEW → CONTACTED → VISIT_SCHEDULED → VISITED → NEGOTIATING → CONVERTED
                                                           ↘ LOST
```

Every stage transition is logged as an `Activity` record with timestamp and actor.

---

## Dashboard Metrics

- Total leads (today / this week / this month)
- Conversion rate (CONVERTED / total)
- Leads by stage (funnel chart)
- Leads by source (pie/bar)
- Visits scheduled this week
- Agent leaderboard (leads converted)
- Average time to conversion
