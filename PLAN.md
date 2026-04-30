# Gharpayy Lead Management CRM — Implementation Plan

## Assignment
48-hour MVP for a Lead Management CRM that captures leads, assigns ownership, manages a pipeline, schedules visits, and provides a dashboard.

**Submission deadline:** 48 hours from receipt  
**Contact:** +91 91873 17470 / sayzoindia@gmail.com  
**Reply trigger:** TECHIE

---

## Phase 0 — Project Setup (2h)

- [ ] Init Next.js 15 project with TypeScript + Tailwind
- [ ] Install and configure shadcn/ui
- [ ] Set up Prisma + PostgreSQL (Vercel Postgres or local)
- [ ] Configure NextAuth.js with Credentials provider
- [ ] Set up project folder structure
- [ ] Create `.env.example`
- [ ] Add `prisma/seed.ts` with 2 admin users, 3 agents, 20 demo leads

---

## Phase 1 — Data Layer (3h)

- [ ] Write `prisma/schema.prisma` (User, Lead, Visit, Activity models)
- [ ] Run `prisma migrate dev --name init`
- [ ] Create `lib/db.ts` Prisma singleton
- [ ] Create `lib/auth.ts` NextAuth config with role-based session
- [ ] Write seed script and verify with `prisma db seed`

---

## Phase 2 — API Routes (4h)

### Auth
- [ ] `POST /api/auth/[...nextauth]` — login/logout

### Leads
- [ ] `GET /api/leads` — list with filters (stage, agentId, source, search, pagination)
- [ ] `POST /api/leads` — create lead + log Activity
- [ ] `GET /api/leads/:id` — detail + activities
- [ ] `PATCH /api/leads/:id` — update stage/fields + log Activity
- [ ] `DELETE /api/leads/:id` — admin-only soft delete

### Visits
- [ ] `GET /api/visits` — list with date range
- [ ] `POST /api/visits` — schedule + auto-update lead stage to VISIT_SCHEDULED + log Activity
- [ ] `PATCH /api/visits/:id` — update status/notes

### Users (Admin)
- [ ] `GET /api/users` — list agents
- [ ] `POST /api/users` — create agent
- [ ] `PATCH /api/users/:id` — update

### Dashboard
- [ ] `GET /api/dashboard` — aggregated stats (counts by stage, source, agent, conversion rate)

---

## Phase 3 — Auth UI (1h)

- [ ] Login page (`/login`) — email + password form
- [ ] Session guard in `(dashboard)/layout.tsx`
- [ ] Redirect unauthenticated users to `/login`

---

## Phase 4 — Core Pages (10h)

### Layout Shell (1h)
- [ ] Sidebar with nav links
- [ ] Top bar with user info + logout
- [ ] Responsive mobile drawer

### Dashboard Page `/` (2h)
- [ ] KPI cards: total leads, conversions, visits this week, conversion rate
- [ ] Leads by stage funnel (Recharts bar chart)
- [ ] Leads by source (pie chart)
- [ ] Agent leaderboard table

### Leads List `/leads` (2h)
- [ ] Table with columns: Name, Phone, Stage, Source, Agent, Created
- [ ] Filter bar: stage, source, agent, date range, search
- [ ] Sortable columns
- [ ] Pagination
- [ ] "Add Lead" button → `/leads/new`

### New Lead Form `/leads/new` (1h)
- [ ] Fields: Name*, Phone*, Email, Source, Budget, Move-in Date, Property Type, Preferred Location, Notes
- [ ] Assign to agent (admin sees all agents; agent auto-assigns to self)
- [ ] Form validation (zod)
- [ ] On submit → redirect to lead detail

### Lead Detail `/leads/:id` (2h)
- [ ] Lead info card with inline edit
- [ ] Stage progression bar with click-to-advance
- [ ] Assign/reassign dropdown (admin only)
- [ ] Schedule visit button → visit modal
- [ ] Activity timeline (all notes, calls, stage changes, visits)
- [ ] Add note / log call inline

### Pipeline Kanban `/pipeline` (2h)
- [ ] Columns per stage (NEW → CONVERTED)
- [ ] Drag-and-drop cards to change stage (react-dnd or @dnd-kit)
- [ ] Lead card: name, phone, source badge, assigned agent avatar
- [ ] Card click → navigate to lead detail

---

## Phase 5 — Visits Page (2h)

- [ ] `/visits` — list view with tabs: Upcoming / Past
- [ ] Visit card: lead name, property, date/time, agent, status badge
- [ ] Status actions: Mark Completed, Mark No-show, Cancel
- [ ] Schedule visit modal (from lead detail or visits page)
- [ ] Fields: Lead (search/select), Property, Date & Time, Notes

---

## Phase 6 — User Management (1h, Admin only)

- [ ] `/users` — table of agents with name, email, role, leads count
- [ ] Add Agent modal
- [ ] Deactivate agent button

---

## Phase 7 — Polish & Deployment (2h)

- [ ] Empty states for all pages
- [ ] Loading skeletons
- [ ] Toast notifications (success/error)
- [ ] Mobile responsive check
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel dashboard
- [ ] Run seed on production DB
- [ ] Smoke test all flows

---

## Total Estimated Time

| Phase | Time |
|---|---|
| 0 — Setup | 2h |
| 1 — Data layer | 3h |
| 2 — API routes | 4h |
| 3 — Auth UI | 1h |
| 4 — Core pages | 10h |
| 5 — Visits | 2h |
| 6 — User management | 1h |
| 7 — Polish + deploy | 2h |
| **Total** | **25h** |

Well within the 48-hour window.

---

## Demo Credentials (post-seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@gharpayy.com | admin123 |
| Agent | agent1@gharpayy.com | agent123 |

---

## Scalability Notes

- Pagination on all list APIs from day 1 (no full-table scans)
- Activity log is append-only — never mutated
- Role checks enforced server-side, never trust client role
- Prisma migrations tracked in git — database is always reproducible
- All date storage in UTC; display in IST on client
- Agent self-assign enforced in API (not just UI) for integrity
