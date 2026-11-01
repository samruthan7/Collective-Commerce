# Collective Commerce

A multi-category collective purchasing and reverse-bidding marketplace.
Buyers form groups for the same product variant and region, verified sellers
compete with sealed quotations, and every buyer accepts an offer individually.

All prices, names and figures in sample data are illustrative.

## Repository layout

| Path                  | Purpose                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `apps/web`            | Next.js frontend (Phase 1.4)                                       |
| `apps/api`            | Express + TypeScript API (Phase 1.3)                               |
| `packages/shared`     | Zod schemas and TypeScript types shared by web and api (Phase 1.2) |
| `supabase/migrations` | Versioned SQL migrations (Phase 2+)                                |
| `docs`                | Architecture notes                                                 |

Progress and architecture decisions live in `PROJECT_PROGRESS.md`.

## Requirements

- Node.js 20.19 or newer
- npm 10 or newer
- Git
