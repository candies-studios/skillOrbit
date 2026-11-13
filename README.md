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

## Deployment

### GitHub Pages: static preview (works now)

`.github/workflows/deploy-pages.yml` builds a static export of the public site on every push to `main` and publishes it to `https://<owner>.github.io/<repo>/`.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions.** If Source is "Deploy from a branch", Pages shows this README instead of the site.

The preview has limits:

- It shows the public pages with sample data. It is not indexed by search engines.
- Server features can't run on GitHub Pages: sign-in, database, payments, webhooks, emails and true 404 status codes.

### Vercel: the real app (needed from Phase 2)

Import the repo in Vercel and add the env vars from `.env.example`. No build settings need changing. This is where auth, Supabase and Razorpay will run.

## Manual setup still to come

Supabase project setup, Razorpay test keys and webhook, and Resend domain verification are documented as each phase lands (see `DEVELOPMENT_STATUS.md`).
