---
description: Project-specific patterns and learnings
---

# Project: Kodominio

## Tech Stack
- Framework: Next.js 16 (App Router)
- Language: TypeScript (strict mode enabled)
- Styling: Tailwind CSS v4
- UI Components: shadcn/ui (Radix UI primitives)
- Database: Supabase (PostgreSQL)
- Monorepo: Turbo + pnpm workspaces
- Package Manager: pnpm >= 10
- Node Version: >= 22

## Project Structure
- `apps/finance` - Finance/invoicing app (port 3001)
- `apps/portfolio` - Portfolio/marketing site (port 3000)
- `packages/db` - Shared Supabase client utilities
- `packages/ui` - Shared UI components (shadcn/ui)
- `packages/services` - Shared services (email, etc.)

## Tech Patterns

### API Pattern
- REST API using Next.js API routes
- Route handlers: `/app/api/[resource]/route.ts`
- Server actions for mutations when appropriate

### State Management
- Zustand (preferred for client state)
- React Context for theme/provider patterns
- Server Components + props for server state

### Forms
- react-hook-form for form handling
- Zod for schema validation
- @hookform/resolvers for Zod integration

### Testing
- Vitest (preferred testing framework)
- Test files: `*.test.ts` or `*.spec.ts`

### Database
- Supabase (PostgreSQL)
- Client: `@kodo/db` package exports `createClient()` for browser/server
- Migrations: SQL files in `apps/finance/supabase/migrations/`
- Service role key for admin operations (server-only)

### Email
- Resend for email delivery
- React Email templates in `@kodo/services`
- Email preview: `pnpm --filter @kodo/services email:dev`

## Project Patterns
- API routes use `/app/api/[resource]/route.ts` pattern
- Components use composition pattern
- Server Components by default, Client Components when needed (`"use client"`)
- Shared packages use workspace protocol: `workspace:*`
- Turbo tasks for monorepo orchestration

## Monorepo Patterns
- Workspace packages: `@kodo/db`, `@kodo/ui`, `@kodo/services`
- Turbo filters: `--filter=@kodo/[package]` for targeted commands
- Shared dependencies via catalog in root `package.json`
- Build order: packages → apps

## Known Issues & Solutions
<!-- Document solutions to project-specific problems -->

## Project-Specific Conventions
- Feature branches: `feature/[linear-id]-[description]`
- Commit format: Simple descriptive messages (not conventional commits)
- PR preference: Small, focused PRs
- Linear integration: Use `[LIN-XXX]` in commits/PRs when applicable

