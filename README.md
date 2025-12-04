# Kodo Monorepo

A TurboRepo-powered workspace that hosts the **Kodo Budget** finance platform, a fully customizable portfolio site, and the shared UI/data/email packages that power both experiences.

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Applications](#applications)
5. [Shared Packages](#shared-packages)
6. [Getting Started](#getting-started)
7. [Environment Variables](#environment-variables)
8. [Database & Migrations](#database--migrations)
9. [Email & Notifications](#email--notifications)
10. [Quality & Tooling](#quality--tooling)
11. [Deployment Notes](#deployment-notes)

## Overview

The repo combines back-office tooling for agencies/freelancers (finance, invoicing, client portal) with a marketing/portfolio site. All code is written in TypeScript, uses PNPM workspaces, and shares UI primitives, Supabase helpers, and Resend-powered email utilities.

### Feature Highlights

- Multi-tenant Supabase schema with Row Level Security and end-to-end typed clients.
- Finance cockpit: dashboards, customers/projects, time entries, expense imports, recurring invoices, contracts, and a token-based client portal.
- Portfolio site built on Once UI + MDX content, complete with OG image generation, RSS, password-guarded routes, and a Resend-enabled contact form.
- Shared `@kodo/ui` component library (Radix + Tailwind v4) and `@kodo/services` React Email templates with a live preview server.
- TurboRepo pipelines for build/dev/test, Biome formatting, and Husky hooks for git hygiene.

## Tech Stack

- **Frameworks:** Next.js 16 (App Router), React 19, MDX.
- **Language & Tooling:** TypeScript 5.9, TurboRepo, PNPM 10, Biome, Zod, React Hook Form.
- **Styling & UI:** Tailwind CSS v4, Radix UI, Once UI, Lucide icons.
- **Backend & Data:** Supabase (Postgres + Auth + Storage), Supabase JS/SSR clients, RPC helpers.
- **Email & Docs:** Resend, React Email, @react-pdf/renderer for invoice PDFs, MDX docs.

## Repository Structure

| Path | Description |
| --- | --- |
| `apps/finance` | Kodo Budget web app (Next.js). Contains dashboard/customer/project/expense/invoice UIs, API routes, Supabase helpers, client portal pages, and maintenance scripts. |
| `apps/finance/supabase/migrations` | SQL migrations that define customers, projects, time entries, expenses, expense rules, contracts, invoices, recurring invoices, client portal access, and email logs (with RLS policies). |
| `apps/portfolio` | Marketing/portfolio site built on Once UI with MDX content, RSS/OG generators, password-protected routes, and a Resend-backed contact form. |
| `apps/portfolio/docs` | Authoring guides covering content, styling, Mailchimp, SEO, password protection, etc. |
| `packages/ui` | Shared component library (`@kodo/ui`) exposing Radix/Tailwind primitives via `tsup` + Tailwind CLI bundles. |
| `packages/services` | Resend abstraction + React Email templates (`@kodo/services`) with a preview server (`pnpm --filter @kodo/services email:dev`). |
| `packages/db` | Supabase browser/server clients + generated typings (`@kodo/db`). Used throughout to keep DB access typed. |
| `pnpm-workspace.yaml` | Declares workspace packages (`apps/*`, `packages/*`) and dependency catalog versions. |
| `turbo.json` | Task graph definitions (build/dev/lint/type-check) with remote cache enabled. |

## Applications

### Finance app (`apps/finance`)

**Key capabilities**

- Authenticated dashboard (`/dashboard`) summarizing budget KPIs, time tracking, and invoice status cards.
- CRUD flows for customers, projects, contracts (with Supabase Storage uploads to the `contracts` bucket), time entries, expenses, expense rules, and recurring invoices.
- CSV-based bank statement importer (`app/api/import-expenses/route.ts`) that parses files via `lib/bank-statement-parser.ts`, auto-categorizes rows with rule matching (`lib/expense-categorization.ts`), and bulk-inserts expenses in batches of 100.
- Invoice toolkit: numbering (`lib/invoices.ts`), PDF generation (`lib/pdf-generator.tsx`), payment link tokens, and Resend-powered email delivery/logging (`lib/email.ts` + `lib/email-templates.ts`).
- Client portal + payment surfaces (`/client/[token]`, `/client/portal`, `/client/invoices`, `/pay/[token]`) using the `client_portal_access` table, expiring tokens (~7 days), and `localStorage` sessions.
- Background helpers for recurring invoicing (`lib/recurring-invoices.ts`) and Supabase storage operations (`lib/storage.ts`).

**Auth & Data**

- Supabase auth is required for every page via `requireAuth` (server) and `LoginCheck` (client redirect after login).
- Database access happens through `@kodo/db/client` and `@kodo/db/server` wrappers to keep the browser/server environments aligned and typed.
- RLS is enforced on every table in the migrations; all queries filter by the authenticated user’s `user_id`.

**API routes**

| Route | Purpose |
| --- | --- |
| `app/api/import-expenses/route.ts` | Secure CSV upload API with auto-categorization + batch inserts into `expenses`. |
| `app/api/send-invoice/route.ts` | Loads invoice + customer, renders an email (with payment link) and logs the send status in `email_logs`. |
| `app/api/send-client-portal-link/route.ts` | Issues/updates portal tokens (`client_portal_access`), builds access links off `NEXT_PUBLIC_APP_URL`, and emails the client. |

**Scripts & cron jobs (`apps/finance/scripts`)**

| Script | Command | Notes |
| --- | --- | --- |
| `run-migrations.ts` | `pnpm --filter @kodo/finance tsx scripts/run-migrations.ts` | Iterates the SQL migrations and executes them via a Supabase RPC (`exec_sql`). Requires `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. |
| `run-migrations.sh` | `pnpm --filter @kodo/finance bash scripts/run-migrations.sh` | Explains Supabase CLI / dashboard options and lists migration files. |
| `apply-migrations.js`, `apply-single-migration.js`, `run-migration-direct.js`, `test-import-column.js`, `verify-column-exists.js` | Utility scripts for manually replaying or inspecting migrations using the service role key. |
| `generate-recurring-invoices.ts` | `pnpm --filter @kodo/finance tsx scripts/generate-recurring-invoices.ts` | Intended for cron (daily). Generates invoices for all active recurring templates due on/before today. |
| `create-user.ts` | `pnpm --filter @kodo/finance tsx scripts/create-user.ts` | Example admin script that provisions a Supabase auth user. Update the hard-coded credentials before reusing. |

**Supabase schema (high level)**

- `customers`, `projects`, `time_entries` – core CRM/time-tracking entities with `user_id` scoping and `updated_at` triggers.
- `expenses`, `expense_rules`, `recurring_invoices` – capture spend imports, matching rules (vendor/description/amount range), and scheduled billing templates.
- `invoices`, `invoice_items`, `email_logs` – invoice lifecycle, payment links, ledger, and communication audit trail (triggers keep totals in sync).
- `contracts` + Supabase Storage (`contracts` bucket) – files uploaded via `lib/storage.ts`.
- `client_portal_access` – stores token, email, and expiration for `/client` flows.

### Portfolio app (`apps/portfolio`)

**Key capabilities**

- Once UI-based theme system configured via `src/resources/once-ui.config.ts` (colors, effects, routes, protected routes, Mailchimp embed, etc.).
- MDX-driven content for pages and projects (`src/app/work/projects/*.mdx`) with automatic sitemap, RSS, and OG image (`/api/og/generate`) generation that depend on the `baseURL` exported from the resources bundle.
- Built-in documentation (`apps/portfolio/docs/*.mdx` + `features.md`) that explains how to customize quick start content, styling, components, Mailchimp, password protection, SEO, and routing.
- Contact form API (`src/app/api/contact/route.ts`) that validates payloads and sends templated emails through `@kodo/services/email`.
- Password gate API (`src/app/api/authenticate/route.ts`) that compares input to `PAGE_ACCESS_PASSWORD` and sets an auth cookie.

**Authoring workflow**

- Update personal data, navigation labels, newsletter copy, etc. in `src/resources/content.tsx`.
- Configure the `baseURL`, page availability (`routes`), password-guarded paths (`protectedRoutes`), Mailchimp embed, and visual effects inside `src/resources/once-ui.config.ts`.
- Add/modify MDX projects under `src/app/work/projects` — frontmatter is used for SEO + OG metadata.
- Replace assets in `public/images` as needed.

## Shared Packages

### `@kodo/ui` (`packages/ui`)

- Bundles 40+ Radix-based primitives (accordion, dialog, table, charts, inputs, OTP, etc.) and global styles under `dist/`.
- Build/watch with `pnpm --filter @kodo/ui build` or `pnpm --filter @kodo/ui dev`. Tailwind CLI compiles `src/globals.css` into `dist/globals.css`.
- Consumers import components (e.g., `import { Button } from "@kodo/ui";`) and include the compiled CSS export when needed.

### `@kodo/services` (`packages/services`)

- Resend client bootstrap + configuration helpers (`src/email/config|client|sender`).
- React Email templates (welcome, verification, table summaries, contact form, etc.) located under `src/email/templates`.
- Preview server for local template QA: `pnpm --filter @kodo/services email:dev` (defaults to port 3010; serve files from `src/email/templates`).

### `@kodo/db` (`packages/db`)

- Thin wrappers around `@supabase/ssr` client creation for browser/server contexts plus generated Supabase typings (`src/types.ts`).
- Throws descriptive errors if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing, preventing silent misconfiguration.

## Getting Started

### Prerequisites

- Node.js 22+ (ESM-only workspace).
- PNPM 10+ (workspace lockfile is pinned to `pnpm@10.18.0`).
- Supabase project (Postgres + Auth + Storage) with the SQL migrations applied.
- Resend account for outbound email.
- Optional: Vercel CLI (used by `apps/*/package.json` scripts for env management) and Supabase CLI for DB workflows.

### Installation & workspace bootstrap

```bash
pnpm install          # installs all workspace deps and runs `pnpm prepare` (Husky)
pnpm packages:build   # optional: build ui/services/db before running apps
```

### Local development commands

```bash
pnpm finance:dev      # Next dev server for Kodo Budget (port 3001)
pnpm portfolio:dev    # Next dev server for the portfolio site (port 3000)
pnpm packages:dev     # Watch build for @kodo/ui, @kodo/services, @kodo/db
pnpm services:dev     # Direct watch on @kodo/services
pnpm ui:dev           # Direct watch on @kodo/ui
pnpm lint             # turbo run lint (Biome)
pnpm type-check       # turbo run type-check (tsc --noEmit per package)
pnpm build            # turbo run build across the workspace
pnpm clean            # turbo run clean (purge .next/dist outputs)
```

> Tip: Turbo’s remote cache is enabled in `turbo.json`. Authenticate with your remote cache provider (if configured) to share build artifacts across teammates/CI.

## Environment Variables

Store secrets in the appropriate `.env` (root or `apps/*/.env.local`) and never expose service-role keys to the browser.

| Variable | Used by | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | finance app, shared DB package | Supabase project URL (safe for client). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | finance app, shared DB package | Supabase anon key used by browser/server clients. |
| `SUPABASE_SERVICE_ROLE_KEY` | finance scripts, API routes, cron jobs | Service role key for admin tasks (never expose to client bundles). |
| `NEXT_PUBLIC_APP_URL` | finance app | Base URL for payment/client-portal links (defaults to `http://localhost:3000`). |
| `RESEND_API_KEY` | finance + portfolio apps, `@kodo/services` | Auth token for sending email. Required for invoice delivery and contact forms. |
| `RESEND_FROM_EMAIL` | finance app | Custom sender (e.g., `"Kodo Budget <billing@yourdomain.com>"`). Optional fallback exists. |
| `RESEND_EMAIL_RECIPIENT` | portfolio contact API | Overrides where contact form submissions are delivered (defaults to `jamiecnisbet@gmail.com`). |
| `PAGE_ACCESS_PASSWORD` | portfolio auth API | Password required by protected routes (stored server-side and compared per request). |

Depending on your deployment stack you may also need:

- Supabase bucket names (`contracts`) created via Dashboard → Storage.
- `VERCEL_*` vars (when using `vercel env pull`) to sync envs locally.

## Database & Migrations

1. **Create a Supabase project** and enable the SQL editor.
2. **Apply migrations** from `apps/finance/supabase/migrations` in chronological order. Options:
   - Supabase CLI: `supabase link --project-ref <ref>` then `supabase db push`.
   - Dashboard SQL editor: copy each `.sql` file manually.
   - Scripted: `pnpm --filter @kodo/finance tsx scripts/run-migrations.ts` (requires an `exec_sql` RPC on your DB).
3. **Storage bucket:** create a `contracts` bucket and configure it per your access needs. The helper in `lib/storage.ts` expects that name.
4. **Functions:** if using the TypeScript migration runner, add an `exec_sql(sql text)` RPC (see Supabase docs) so SQL files can be piped through the REST API.

### Seeding & maintenance

- Use `scripts/create-user.ts` to seed admin accounts (update the hard-coded email/password).
- Schedule `scripts/generate-recurring-invoices.ts` as a cron (daily) to keep invoices in sync with recurring templates.
- `scripts/test-import-column.js` / `verify-column-exists.js` can help when evolving the schema during CSV imports.

## Email & Notifications

- Finance app emails are assembled in `apps/finance/lib/email-templates.ts` (invoice, client-portal access, reminders) and sent via `lib/email.ts`, which logs every attempt to the `email_logs` table.
- Portfolio contact messages use the React Email template located at `packages/services/src/email/templates/contact-form-email.tsx` through the shared `@kodo/services/email` sender.
- Preview any template changes with `pnpm --filter @kodo/services email:dev` (opens a local gallery).
- Configure SPF/DKIM for your sending domain in Resend to avoid deliverability issues.

## Quality & Tooling

- **Biome** handles linting + formatting (`pnpm lint`, `pnpm format`, `pnpm format:check`, `pnpm lint:check`). The `pnpm format` command writes fixes in-place.
- **TypeScript strictness** is enforced via `pnpm type-check` (each package runs `tsc --noEmit`).
- **Husky hooks** (`.husky/pre-commit`, `.husky/pre-push`) are scaffolded to remind contributors to run Biome and Turbo checks. Replace the placeholder `echo` commands with actual invocations if you want automatic gating.
- **Testing**: no automated tests are present yet—consider adding unit/integration coverage for critical flows (CSV import, invoicing, client portal) when the functionality stabilizes.

## Deployment Notes

- **Finance app**: Deploy to Vercel (or another Next-compatible host). Provide the Supabase URL/keys, Resend credentials, and `NEXT_PUBLIC_APP_URL` that matches the public domain. Lock down the Supabase service-role key to server-side environments only (Vercel serverless env variables or self-hosted secrets).
- **Portfolio app**: Also deployable on Vercel. Update `baseURL` in `src/resources/once-ui.config.ts` to the production domain so OG/RSS links are correct. Provide `RESEND_API_KEY`, `RESEND_EMAIL_RECIPIENT`, and `PAGE_ACCESS_PASSWORD` env vars.
- **Supabase**: Keep migrations versioned in git, run them via CI before promoting releases, and enable the required buckets/policies in the dashboard.
- **Cron/Background work**: Use Vercel Cron, Supabase Edge Functions, or another scheduler to invoke `scripts/generate-recurring-invoices.ts` (or wrap the logic in a hosted job) so recurring invoices continue to post in production.

---

Need more context or found a gap? Check `apps/portfolio/docs` for UI/content authoring guides or browse the `apps/finance/components` directory to see how each surface is assembled. Contributions are welcome—open an issue/PR with the proposed change and the relevant testing notes.
