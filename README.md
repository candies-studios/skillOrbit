# SkillOrbit

An online school and marketplace for practical digital skills: course sales, membership, instructor marketplace and affiliate programme. Built for India first, open internationally.

> **Status:** Phase 1 complete (design system and public website). Not production-ready. See [DEVELOPMENT_STATUS.md](./DEVELOPMENT_STATUS.md) and [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).

## Stack

Next.js 16 (App Router, Cache Components) · TypeScript (strict) · Tailwind CSS v4 · Radix primitives and Lucide · Supabase (Phase 2+) · Razorpay (Phase 5) · Resend · Vercel

## Getting started

Requirements: Node.js 20.9 or later.

```bash
npm install
cp .env.example .env.local   # fill in only what you have; empty values show "not configured"
npm run dev                  # http://localhost:3000
```

Useful URLs:

- `/` homepage, `/courses` catalogue, `/pricing`, `/affiliates`, `/teach`
- `/design-system` internal component reference (not indexed)

## Scripts

| Command                       | What it does                                                                                                                                                                                       |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`                 | Development server                                                                                                                                                                                 |
| `npm run build` / `npm start` | Production build and server                                                                                                                                                                        |
| `npm run typecheck`           | Generate route types, then `tsc --noEmit`                                                                                                                                                          |
| `npm run lint`                | ESLint                                                                                                                                                                                             |
| `npm test`                    | Unit tests (Vitest)                                                                                                                                                                                |
| `npm run test:e2e`            | Playwright and axe tests against a production build. Run `npm run build` first. Uses Playwright's Chromium (`npx playwright install chromium`), or set `PLAYWRIGHT_CHROME_PATH` to a local Chrome. |
| `npm run check`               | Typecheck, lint, unit tests and build                                                                                                                                                              |

## Rebranding

"SkillOrbit" is a working name. Change `src/config/brand.ts` (name, tagline, description) and the colour tokens at the top of `src/app/globals.css`. Components use semantic tokens (`ink`, `primary`, `paper`, `marigold`) rather than hard-coded colours.

## Data honesty rules

- Catalogue content is **development seed data** (`src/lib/catalog/seed.ts`). Every record has `isSample: true` and is labelled "Sample" in the UI, and a site-wide banner says so.
- No ratings, enrolment counts, revenue figures or testimonials are fabricated. Testimonials render only from real records.
- Integrations without credentials show a "not configured" state. Forms never claim success they didn't achieve.
- Money is always integer minor units (paise) with an ISO currency code.

## Manual setup still to come

Supabase project setup, Razorpay test keys and webhook, Resend domain verification and Vercel deployment are documented as each phase lands (see the Phase 2 steps in `DEVELOPMENT_STATUS.md`).
