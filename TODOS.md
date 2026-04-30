# Gharpayy CRM — Task Checklist

Track every granular task. Check off as you go.

---

## Phase 0 — Project Setup

### Init
- [ ] `npx create-next-app@latest gharpayy-crm --typescript --tailwind --app --src-dir=false`
- [ ] `cd gharpayy-crm && npx shadcn@latest init`
- [ ] Install dependencies:
  ```
  npm install prisma @prisma/client next-auth bcryptjs
  npm install @tanstack/react-query recharts @dnd-kit/core @dnd-kit/sortable
  npm install zod react-hook-form @hookform/resolvers
  npm install -D @types/bcryptjs
  ```
- [ ] Add shadcn components: `npx shadcn@latest add button input label card badge table select dialog toast`
- [ ] Create `.env.local` from `.env.example`
- [ ] Set `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

### Folder setup
- [ ] Create `components/ui/` (shadcn output)
- [ ] Create `components/leads/`, `components/pipeline/`, `components/visits/`, `components/dashboard/`, `components/layout/`
- [ ] Create `lib/db.ts`, `lib/auth.ts`, `lib/utils.ts`
- [ ] Create `types/index.ts`
- [ ] Create `prisma/schema.prisma`
- [ ] Create `prisma/seed.ts`

---

## Phase 1 — Data Layer

### Schema
- [ ] Write User model with Role enum
- [ ] Write Lead model with LeadSource + PipelineStage enums
- [ ] Write Visit model with VisitStatus enum
- [ ] Write Activity model
- [ ] Add all relations and indexes
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Verify schema with `npx prisma studio`

### Seed
- [ ] Create 1 ADMIN user (admin@gharpayy.com)
- [ ] Create 3 AGENT users
- [ ] Create 20 leads spread across all stages with varied sources
- [ ] Create 10 visits (mix of SCHEDULED, COMPLETED, NO_SHOW)
- [ ] Create activity log entries for each lead
- [ ] Run `npx prisma db seed` and verify in Studio

### Prisma client
- [ ] `lib/db.ts` — singleton pattern for Prisma (avoid hot-reload connections)

---

## Phase 2 — Auth

### NextAuth config
- [ ] `lib/auth.ts` — CredentialsProvider with bcrypt verify
- [ ] Include `role` in JWT token and session
- [ ] `app/api/auth/[...nextauth]/route.ts`

### Login page
- [ ] `app/(auth)/login/page.tsx` — email + password form
- [ ] Show error message on invalid credentials
- [ ] Redirect to `/` on success

### Auth guard
- [ ] `app/(dashboard)/layout.tsx` — check session, redirect to `/login` if missing
- [ ] Pass session to child via context or server props

---

## Phase 3 — Layout Shell

- [ ] `components/layout/Sidebar.tsx` — nav links with icons, active state
  - Links: Dashboard, Leads, Pipeline, Visits, Users (admin only)
- [ ] `components/layout/Topbar.tsx` — page title, user avatar + name, logout button
- [ ] Mobile: collapsible drawer for sidebar
- [ ] `app/(dashboard)/layout.tsx` — compose sidebar + topbar

---

## Phase 4 — API Routes

### /api/leads
- [ ] `GET` — parse query params (stage, agentId, source, search, page, limit)
  - Admin: all leads; Agent: own leads only
  - Return leads with agent name, total count
- [ ] `POST` — validate body with zod, create lead, log "Lead created" activity
- [ ] `GET /api/leads/:id` — return lead + all activities + visits
- [ ] `PATCH /api/leads/:id` — update fields, detect stage change, log activity
- [ ] `DELETE /api/leads/:id` — admin only, soft delete (add `deletedAt` field)

### /api/visits
- [ ] `GET` — filter by agentId (agent: own only), date range, status
- [ ] `POST` — validate, create visit, update lead stage to VISIT_SCHEDULED if it's NEW/CONTACTED, log activity
- [ ] `PATCH /api/visits/:id` — update status/notes, log activity on completion

### /api/users
- [ ] `GET` — admin only, list all users with lead count
- [ ] `POST` — admin only, create agent with hashed password
- [ ] `PATCH /api/users/:id` — admin only, update name/email/role

### /api/dashboard
- [ ] Leads by stage count
- [ ] Leads by source count
- [ ] Total leads today / this week / this month
- [ ] Conversion rate (CONVERTED / non-LOST total)
- [ ] Visits this week count
- [ ] Agent leaderboard (agent name + converted count)

---

## Phase 5 — Dashboard Page

- [ ] `app/(dashboard)/page.tsx` — fetch `/api/dashboard`
- [ ] `components/dashboard/KpiCard.tsx` — icon + number + label + trend
- [ ] KPI row: Total Leads, Converted, Visits This Week, Conversion Rate
- [ ] `components/dashboard/FunnelChart.tsx` — Recharts BarChart by stage
- [ ] `components/dashboard/SourceChart.tsx` — Recharts PieChart by source
- [ ] `components/dashboard/LeaderboardTable.tsx` — agent rows with count

---

## Phase 6 — Leads Pages

### Lead list `/leads`
- [ ] `app/(dashboard)/leads/page.tsx` — server component, fetch initial data
- [ ] `components/leads/LeadTable.tsx` — table with sortable columns
- [ ] `components/leads/LeadFilters.tsx` — stage, source, agent, date pickers, search input
- [ ] Pagination controls (prev / next / page number)
- [ ] "New Lead" button top right

### New lead `/leads/new`
- [ ] `app/(dashboard)/leads/new/page.tsx`
- [ ] `components/leads/LeadForm.tsx` — react-hook-form + zod schema
  - Fields: Name*, Phone*, Email, Source*, Budget, Move-in Date, Property Type, Location, Notes
  - Agent assignment: admin sees dropdown, agent sees "Assign to me"
- [ ] On success: redirect to `/leads/:id`
- [ ] On error: show field-level validation messages

### Lead detail `/leads/:id`
- [ ] `app/(dashboard)/leads/[id]/page.tsx`
- [ ] `components/leads/LeadInfoCard.tsx` — all lead fields, inline edit mode
- [ ] `components/leads/StageProgressBar.tsx` — clickable stage steps
- [ ] Reassign dropdown (admin only)
- [ ] "Schedule Visit" button → opens `VisitModal`
- [ ] `components/leads/ActivityTimeline.tsx` — chronological activity list
- [ ] Inline "Add Note" / "Log Call" form at bottom of timeline

---

## Phase 7 — Pipeline Kanban `/pipeline`

- [ ] `app/(dashboard)/pipeline/page.tsx`
- [ ] `components/pipeline/KanbanBoard.tsx` — @dnd-kit DndContext wrapper
- [ ] `components/pipeline/KanbanColumn.tsx` — stage name header + lead cards
- [ ] `components/pipeline/LeadKanbanCard.tsx` — name, phone, source badge, agent avatar initials
- [ ] On card drop: call `PATCH /api/leads/:id` with new stage + log activity
- [ ] Optimistic update on drag so UI doesn't flicker
- [ ] Click card → navigate to `/leads/:id`

---

## Phase 8 — Visits Page `/visits`

- [ ] `app/(dashboard)/visits/page.tsx`
- [ ] Tabs: Upcoming / Past
- [ ] `components/visits/VisitCard.tsx` — lead name, property, date, agent, status badge
- [ ] Status action buttons: Complete, No-show, Cancel
- [ ] `components/visits/VisitModal.tsx` — schedule visit form (lead search, property, datetime, notes)
- [ ] Lead search in modal: typeahead against `/api/leads?search=`

---

## Phase 9 — User Management `/users`

- [ ] `app/(dashboard)/users/page.tsx` — admin gate (redirect non-admin)
- [ ] Table: name, email, role badge, lead count, action buttons
- [ ] "Add Agent" modal — name, email, password fields
- [ ] Deactivate button (set role to "INACTIVE" or similar flag)

---

## Phase 10 — Polish

- [ ] Empty state illustrations for leads list, pipeline, visits
- [ ] Loading skeleton components for table rows and KPI cards
- [ ] Toast notifications (shadcn Toaster) on create/update/error
- [ ] 404 page for unknown lead IDs
- [ ] Mobile responsiveness audit (leads table → card stack on mobile)
- [ ] Add `<title>` metadata to each page

---

## Phase 11 — Deployment

- [ ] Push to GitHub (new repo: `gharpayy-crm`)
- [ ] Create Vercel project, link GitHub repo
- [ ] Create Vercel Postgres database
- [ ] Add environment variables in Vercel dashboard
- [ ] Trigger deploy, run `prisma migrate deploy` via build command
- [ ] Run seed on production: `npx prisma db seed`
- [ ] Smoke test: login → create lead → move pipeline → schedule visit → check dashboard

---

## Submission Checklist

- [ ] Live Vercel URL working
- [ ] Demo credentials documented in README
- [ ] All 5 core features functional: capture, assign, pipeline, visits, dashboard
- [ ] Send reply to +91 91873 17470 with message starting "TECHIE"
- [ ] Send email to submission address with Vercel URL + GitHub repo link
