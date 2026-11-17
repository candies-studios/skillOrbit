# Development status

Last updated: 17 November 2026. **Not production-ready.** Payments, the learning player, membership, affiliate tracking, settlements and the security review are still to come.

Legend: `[x]` done and verified · `[~]` partial · `[ ]` not started

## Phase 0 — Inspection and plan ✅

- [x] Project initialised (Next.js 16.4, TypeScript strict, Tailwind v4); architecture in `docs/ARCHITECTURE.md`

## Phase 1 — Brand, design system, public site ✅

- [x] Design system (`/design-system`), all public pages, policies (drafts for legal review), real 404s
- [x] GitHub Pages static preview (sample data, no accounts)

## Phase 2 — Supabase, auth, roles, RLS ✅

**Database** (`supabase/migrations`, 5 files)

- [x] All 37 tables, with UUID keys, foreign keys, indexes, check constraints and timestamps
- [x] Money as `bigint` minor units with a currency check; rates as integer basis points
- [x] Price, instructor-share and affiliate-rate snapshots on `order_items`
- [x] Append-only ledgers (order items, earnings, payouts, redemptions, audit log); payment and commission amounts can't be edited
- [x] RLS enabled on **every** table; clients can't write any financial table
- [x] Storage: 4 buckets (1 public, 3 private) with path-based policies
- [x] Role helpers, sign-up trigger (profile + student role), application guards
- [x] Audited admin RPCs: review instructor/affiliate, set course status, manage admin roles (super admin only; can't remove the last super admin)
- [x] Seed: the 6 real categories and default platform settings only

**Auth**

- [x] Email/password sign-up with email confirmation, login, logout, forgot/reset password
- [x] `/auth/confirm` handles both the PKCE `code` and `token_hash` email flows
- [x] Sessions in cookies (`@supabase/ssr`), refreshed in `proxy.ts`; signed-out visitors redirected from account areas
- [x] Multi-role: one account can be student, instructor, affiliate and admin at once
- [x] Server checks with `auth.getUser()`, and RLS enforces the same rules again in the database
- [x] Open-redirect-safe `?next=` handling

**Verification**

- [x] **32 database tests** (`tests/db`, real migrations on PGlite/Postgres 18): RLS for each role, no self-promotion, instructor ownership, lesson-content privacy, entitlements, affiliate and financial privacy, append-only rules, storage paths, support tickets
- [x] **End-to-end journey, 24 steps, passing 3 runs in a row**, against a local Supabase-compatible stack (Postgres 18 + PostgREST 12 + an auth emulator) through the real UI. It covers: sign-up, login, bad password, role bootstrap, instructor application → approval → course build → review → publish → public page (no video-ID leak) → student enrolment on mobile → access denials → contact ticket → audit log → logout
- [~] Not yet run against a hosted Supabase project. Use the checklist in `docs/SUPABASE_SETUP.md` after setup, especially the **email links and Storage uploads**: the local stack emulated Auth and didn't include the Storage API.

## Phase 3 — Marketplace and course management ✅ (first release)

- [x] Public catalogue, categories, instructors and course pages read from Supabase (cached, refreshed instantly on changes); sample data only when Supabase isn't configured
- [x] Instructor application, admin approval with revenue share, public instructor profiles
- [x] Course builder: details, pricing in ₹ (stored in paise), outcomes, cover upload, modules and lessons (add/edit/reorder/delete), free-preview flag, private video IDs, downloadable files (private bucket)
- [x] Workflow: draft → in review (editing locked) → published / needs changes, plus withdraw, unpublish, archive and delete-draft rules
- [x] Preview of unpublished courses for owners and admins
- [x] Admin: overview KPIs from live counts, course review queue with checklist, featuring, categories, applications, users and roles, support tickets, audit log
- [x] Student dashboard: my courses, notifications, profile, application status; free-course enrolment
- [x] Contact form saves support tickets
- [ ] Quiz builder UI (tables and security rules exist) — Phase 4
- [ ] Instructor sales analytics — Phase 8 (enrolment counts are shown now)
- [ ] Course-level affiliate commission settings — Phase 7

## Phase 4 — Student learning (next)

- [ ] Course player with protected video (provider abstraction, signed playback), progress and resume, notes and bookmarks, quizzes and assignments, signed download links, certificates and verification page

## Phase 5 — Orders and payments (Razorpay test mode)

- [ ] Server-created orders, signature-verified checkout and webhooks, idempotency, amount/currency checks, enrolment after verified payment, refunds and reversals

## Phase 6 — Membership

- [ ] Plans admin, subscriptions, states, grace period, entitlements (the `has_course_access` function already checks membership windows)

## Phase 7 — Affiliates

- [ ] Click tracking, attribution, commission ledger, holding period, reversals, payouts

## Phase 8 — Instructor earnings

- [ ] Earnings ledger from the distribution waterfall, refund adjustments, manual payouts

## Phase 9 — Admin analytics, CMS, notifications, reporting

- [ ] Revenue charts, CSV exports, homepage CMS, email notifications via Resend, platform settings UI

## Phase 10 — Security review, testing, deployment

- [ ] Security headers/CSP, rate limiting, dependency audit, load test, production runbook
