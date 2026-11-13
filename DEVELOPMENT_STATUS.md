# Development status

Last updated: 14 November 2026. **Not production-ready.** Auth, database, payments and security testing are not built yet.

Legend: `[x]` done and verified · `[~]` partial (UI only, or placeholder) · `[ ]` not started

## Phase 0 — Inspection and plan ✅

- [x] Repository inspected (none existed); project initialised on Next.js 16.4, TypeScript strict, Tailwind v4
- [x] Architecture, data model, RLS strategy and financial waterfall documented (`docs/ARCHITECTURE.md`)
- [x] `.env.example` with placeholders only

## Phase 1 — Brand, design system, public site ✅

**Design system** (`/design-system`, noindex)

- [x] Design tokens (colour, type, radius, shadow, motion) in `globals.css`; brand name in `src/config/brand.ts`
- [x] Navigation, footer, mobile navigation (sheet)
- [x] Buttons (8 variants, loading and disabled), inputs, select, textarea, checkbox, accessible `Field` wrapper
- [x] Course, instructor, category and pricing cards
- [x] Dashboard KPI widget (shows "No data source connected" instead of a number when there is no data)
- [x] Table and filter bar
- [x] Modal, confirmation dialog (async-safe), toast notifications
- [x] Loading skeletons, empty states, error states, notices (including an "unconfigured" tone)

**Public pages**

- [x] Homepage: hero with search, categories, featured courses, why-us, outcomes, instructors, membership promo, affiliate promo; testimonials render only when genuine records exist (currently none)
- [x] Course catalogue with keyword, category, level and price filters and sorting (URL-based, works without JS)
- [x] Categories index and category pages
- [x] Course detail with curriculum accordion and preview-lesson markers
- [x] Instructors index and profiles
- [x] Membership pricing (checkout disabled and labelled)
- [x] Affiliate programme, Teach page, About, FAQ, Contact
- [x] Login, register, forgot password (validated; report "not connected" honestly)
- [~] Privacy, Terms, Refund policies — **drafts for legal review**, with visible placeholders for business details
- [x] 404 page (real 404 status via `proxy.ts`), error boundary, sitemap, robots

**Verification**

- [x] `npm run typecheck`, `npm run lint`, `npm run build` pass
- [x] 25 unit tests (money, catalogue filtering, query sanitising, seed integrity, validation)
- [x] 55 Playwright tests on desktop and mobile: every page renders with no horizontal overflow, no console errors and **no serious or critical axe (WCAG 2 A/AA) violations**; search, filters, real 404s, forms and mobile menu
- [x] Manual screenshot review at 1440, 768 and 390 px

**Known gaps in Phase 1**

- [~] Course imagery is generated cover art; real images come with Storage (Phase 3)
- [~] Catalogue uses clearly labelled development seed data
- [ ] Contact messages are not stored (needs `support_tickets`, Phase 2)
- [ ] Security headers / CSP not yet configured (Phase 10)

## Phase 2 — Supabase, auth, roles, RLS

- [ ] Supabase project and CLI setup; local dev with `supabase start`
- [ ] Migrations for all 37 tables, enums, indexes, constraints, triggers
- [ ] RLS on every table, plus role helper functions
- [ ] Storage buckets (public and private) with policies
- [ ] Supabase Auth: email/password, email verification, password reset, SSR session cookies (`@supabase/ssr`)
- [ ] Protected `/dashboard` and `/admin` routes; multi-role authorisation
- [ ] Admin-only role approval RPC with audit log
- [ ] Contact form → `support_tickets`
- [ ] pgTAP RLS tests and auth/role e2e tests

## Phase 3 — Marketplace and course management

- [ ] Catalogue repository switched to Supabase; slug index from DB
- [ ] Instructor application and approval workflow
- [ ] Course builder: modules, lessons, uploads, pricing, preview, draft → review → published or rejected
- [ ] Admin course and category management

## Phase 4 — Student learning

- [ ] Dashboard, my courses, course player, video abstraction with signed playback
- [ ] Progress, resume, notes and bookmarks, quizzes and assignments, resources (signed URLs)
- [ ] Certificates with verification page

## Phase 5 — Orders and payments (Razorpay test mode)

- [ ] Server-created orders, signature verification, webhooks, idempotency, amount/currency checks
- [ ] Enrolment only after verified payment; refunds and reversals
- [ ] Tests: signature, duplicate webhook, amount mismatch, refund reversal

## Phase 6 — Membership

- [ ] Plans, subscriptions, states (active, cancelled, expired, past_due, suspended), grace period, entitlements

## Phase 7 — Affiliates

- [ ] Referral codes and links, server-side click tracking, attribution (first or last click, window), self-referral and duplicate prevention, commission ledger, holding period, reversals, payouts

## Phase 8 — Instructor earnings

- [ ] Earnings ledger from the waterfall, refund adjustments, manual payouts

## Phase 9 — Admin, CMS, notifications, reporting

- [ ] KPIs from verified queries, revenue charts, CSV exports, homepage CMS, notifications, email via Resend, audit log viewer

## Phase 10 — Security review, E2E, deployment

- [ ] Security headers, rate limiting, dependency audit, full e2e, Vercel deployment and runbook
