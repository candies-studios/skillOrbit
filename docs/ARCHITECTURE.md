# SkillOrbit — Architecture and Technical Plan

This is the Phase 0 report plus the decisions every later phase builds on. Update it whenever one of these decisions changes.

## 1. Phase 0 findings

| Item                   | Finding                                                                                                                                                                                                                                                                                         |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing repository    | None. No SkillOrbit code was provided or found, so the project was initialised from scratch.                                                                                                                                                                                                    |
| Framework              | Next.js **16.4** (App Router, Turbopack, React 19.3) with **Cache Components** and **Partial Prefetching** on (current `create-next-app` defaults).                                                                                                                                             |
| Language               | TypeScript, `strict: true`.                                                                                                                                                                                                                                                                     |
| Styling                | Tailwind CSS v4 (CSS-first `@theme` tokens in `src/app/globals.css`).                                                                                                                                                                                                                           |
| UI primitives          | shadcn/ui-style components written into `src/components/ui`, built on Radix primitives and Lucide icons. The shadcn CLI wasn't used because its registry was unreachable from the build environment; the components follow the same pattern and can be replaced or extended with the CLI later. |
| Fonts                  | Newsreader (display) and Hanken Grotesk (UI), bundled from npm via `@fontsource-variable`, so builds don't depend on Google Fonts.                                                                                                                                                              |
| Supabase               | Not configured yet (Phase 2). The catalogue reads **development seed data** through a repository layer.                                                                                                                                                                                         |
| Payments, email, video | Not configured. The UI shows explicit "not connected" states.                                                                                                                                                                                                                                   |

### Next.js 16 points that affect this codebase

- `params` and `searchParams` are Promises. Pages that read `searchParams` wrap the reading component in `<Suspense>`.
- `middleware.ts` is now **`proxy.ts`**.
- Route segment `dynamicParams`, `dynamic` and `revalidate` are **not available** with Cache Components.
- With Partial Prerendering, unknown dynamic params get a prerendered shell, so the response commits a `200` before `notFound()` can run. `src/proxy.ts` checks slugs against a lightweight index first to return a real `404` (see `src/lib/catalog/slug-index.ts`).

## 2. Project structure

```
src/
  app/
    (site)/            public pages with header, footer and sample-data banner
    (auth)/            login, register, forgot-password (split layout)
    design-system/     internal component reference (noindex)
    layout.tsx         root: fonts, metadata, skip link, toaster
    not-found.tsx, sitemap.ts, robots.ts
  components/
    ui/                design-system primitives (button, form controls, dialog,
                       confirm dialog, sheet, accordion, toaster, table, stat card,
                       badges, notices, skeleton, empty and error states)
    layout/            header, mobile nav, footer, containers, page headers
    catalog/           course, instructor, category and pricing cards, filters, grids
    marketing/         hero orbit, FAQ list, legal page shell
    auth/              auth form
  config/              brand (rename the product here) and navigation
  content/             FAQ copy
  lib/
    catalog/           types (mirror the DB schema), seed, repository, slug index
    validation/        zod schemas shared by client and server
    money.ts           integer minor-unit money helpers
    integrations.ts    env-derived integration status (server-only)
  proxy.ts             real 404s for unknown catalogue slugs
supabase/              (Phase 2) migrations, seed.sql, RLS tests
tests/unit             Vitest
tests/e2e              Playwright and axe accessibility checks
```

**Data access rule:** pages call only `src/lib/catalog/repository.ts` (and future `src/lib/*/repository.ts` modules). In Phase 2/3 the function bodies switch to Supabase queries while the signatures stay the same.

## 3. Database plan (Phase 2)

Migrations live in `supabase/migrations/` and are version-controlled. Conventions:

- `uuid` primary keys (`gen_random_uuid()`), `created_at` and `updated_at timestamptz` with a trigger.
- Money is `bigint` minor units plus `currency char(3)` with a check against the allowed ISO codes. No `numeric`/`float` money columns.
- Rates are integer **basis points** (`int`, 0–10000), never percentages as floats.
- Status columns use Postgres enums or `check` constraints.
- Financial tables are **append-only**: corrections are new reversing rows, never `UPDATE`s on amounts. This is enforced by revoking `update`/`delete` and by triggers.
- Snapshots: `order_items` stores `list_price_minor`, `discount_minor`, `tax_minor`, `instructor_share_bps`, `affiliate_rate_bps` and the course title at purchase time.

Tables, as required: `profiles, user_roles, instructor_profiles, affiliate_profiles, categories, courses, course_modules, lessons, lesson_resources, quizzes, quiz_questions, quiz_attempts, enrollments, lesson_progress, orders, order_items, payments, payment_events, refunds, membership_plans, subscriptions, membership_access, affiliate_links, referral_clicks, affiliate_attributions, commissions, payout_requests, payouts, instructor_earnings, instructor_payouts, coupons, coupon_redemptions, certificates, notifications, support_tickets, platform_settings, audit_logs`.

### Roles

`user_roles(user_id, role, status)` with roles `student | instructor | affiliate | admin | super_admin`. A user can hold several. Students get their role on sign-up through a trigger. Instructor and affiliate roles start `pending` and only an admin (via a `security definer` function that also writes an audit log) can approve them. RLS denies all client writes to `user_roles`.

### RLS strategy

- RLS is enabled on **every** table in exposed schemas; the default is deny.
- Helper functions `auth_has_role(role)` and `is_admin()` are `security definer`, `stable` and use a fixed `search_path`.
- Public read: `categories`, plus `courses`, `course_modules` and lesson titles where `status = 'published'`. Lesson **content** (video IDs, resource paths) sits in columns or tables that need an entitlement check.
- Owner read: students see only their own enrolments, progress, orders, certificates and notifications. Affiliates see only their own links, clicks, attributions and commissions. Instructors see only their own courses and earnings.
- All financial writes go through server code using the service role (never shipped to the browser) or `security definer` RPCs, inside transactions.
- RLS is verified with SQL tests (pgTAP via `supabase test db`) that impersonate each role.

## 4. Financial waterfall (to implement in Phases 5–8)

All amounts are integer minor units. Rates are basis points. Every rounding step uses `floor`, and the **platform absorbs the remainder**, so the parts always sum exactly to the whole.

For each paid order item:

| Step | Amount                                                                     | Notes                                                                                                                      |
| ---- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 1    | `gross` = list price snapshot                                              | From `order_items`.                                                                                                        |
| 2    | `discount`                                                                 | Coupon, allocated across items by largest-remainder.                                                                       |
| 3    | `net_sale = gross − discount`                                              | What the buyer paid for this item.                                                                                         |
| 4    | `tax`                                                                      | GST component of `net_sale` (prices are tax-inclusive by default; the setting and rate are **to be confirmed with a CA**). |
| 5    | `fee`                                                                      | Gateway fee for the payment, allocated across items by largest-remainder.                                                  |
| 6    | `distributable = net_sale − tax − fee`                                     | Basis for revenue shares. Whether fees reduce the base is a platform setting, snapshotted per order.                       |
| 7    | `affiliate = floor(distributable × affiliate_bps / 10000)`                 | Only for an eligible attribution: not a self-referral, inside the window, one commission per order.                        |
| 8    | `instructor = floor((distributable − affiliate) × instructor_bps / 10000)` | Platform-owned courses use `instructor_bps = 0`.                                                                           |
| 9    | `platform = distributable − affiliate − instructor`                        | Platform revenue. Receives rounding remainders.                                                                            |

**Invariant (unit-tested):** `gross = discount + tax + fee + affiliate + instructor + platform`.

- **Reporting:** gross sales, refunds, taxes, fees, affiliate liabilities, instructor liabilities and platform revenue are separate figures. Affiliate commissions and instructor shares are **liabilities, never platform revenue**.
- **Refunds and chargebacks:** a reversal row is written for every ledger line. A partial refund is reversed proportionally with the same rounding. If a commission or earning was already paid out, the reversal creates a negative balance that is netted against future payouts. Chargeback fees are borne by the platform.
- **Holding period:** commissions and earnings are `pending` until `available_at`, which is after the refund window. Only `available` balances can be requested for payout, and payouts need admin approval.
- **Membership revenue:** in the first release membership revenue is **platform revenue**, with no per-course instructor split. A usage-based instructor pool is an open product decision for Phase 8.
- **Idempotency:** `payment_events` has a unique `(provider, event_id)`. Webhook handlers verify the signature, check order ID, payment ID, amount and currency against the server-side order, and process inside one transaction. Duplicates are no-ops.

## 5. Security baseline

- Secrets live only in env vars. `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are used only in server files guarded with `import "server-only"`.
- All form input is validated with zod on the client for UX and **again on the server**.
- Private storage buckets (`lesson-resources`, `instructor-uploads`, `certificates`) are served through short-lived signed URLs after an entitlement check. `course-images` is public.
- Video uses a provider abstraction with expiring signed playback tokens. Permanent private URLs are never exposed.
- Admin and financial actions write `audit_logs` (actor, action, entity, before/after, IP, timestamp).
- Planned before launch: security headers (CSP, HSTS, frame-ancestors) in `next.config.ts`, and rate limiting on auth, contact and webhook endpoints.

## 6. Cost notes (INR 0–5,000 budget)

- Supabase Free and Vercel Hobby cover development. Vercel Hobby is for non-commercial use, so plan on **Vercel Pro** (or another host) before taking real payments, and **Supabase Pro** when production data and backups matter.
- Razorpay charges per transaction, with no fixed monthly fee.
- Resend has a free tier suitable for transactional email at launch.
- Video: start with a low-cost provider behind the abstraction. Self-hosting video in Supabase Storage is possible for small volumes but has no adaptive streaming.

Check current pricing before committing; plans change.
