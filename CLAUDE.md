# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development (hot-reload with TSX)
npm run dev

# Build
npm run build

# Lint / Format
npm run lint
npm run format

# Database (Drizzle ORM)
npm run db:push        # Push schema changes without migration files
npm run db:generate    # Generate migration files from schema changes
npm run db:migrate     # Apply pending migrations
npm run db:studio      # Open Drizzle Studio UI
```

There are no automated tests configured.

## Environment

Copy `.env.example` to `.env`. Required variables:

```
PORT, NODE_ENV, FRONTEND_URL
DATABASE_URL          # PostgreSQL connection string (Supabase pooled)
SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SUPABASE_ID
```

## Architecture

Express.js REST API for SafeSpace — a violence/harassment incident reporting platform. Deployed on Vercel (`vercel.json`).

**Request flow:** `src/index.ts` → `src/routes/index.ts` → feature routes → middleware → controllers → DB/Supabase

```
src/
├── config/supabase.ts         # Supabase client (Auth + Storage)
├── db/
│   ├── index.ts               # Drizzle client (PostgreSQL)
│   └── schema.ts              # All table definitions and relations
├── middlewares/auth.middleware.ts   # requireAuth / requireAdmin (JWT from Bearer header)
├── routes/                    # auth, report, user, admin route files
├── controllers/               # auth, report, user, admin, upload controllers
└── utils/validators/          # Zod validation schemas per feature
```

**Route prefixes:**
- `/api/auth` — public (sign-up, sign-in, password reset) + some guarded endpoints
- `/api/report` — requires `requireAuth`
- `/api/user` — requires `requireAuth`
- `/api/admin` — requires `requireAdmin` (checks `user_metadata.role === 'ADMIN'`)

## Database Schema

Drizzle ORM with PostgreSQL (Supabase). Migrations live in `supabase/migrations/`.

Key tables: `user`, `admin`, `report`, `evidence_asset`, `preference`

Report status enum: `RECEIVED → PROCESS → REVIEW → ASSISTANCE → DONE` (or `REJECTED` / `CANCELLED`)

Relations: User → Reports (cascade delete) → EvidenceAssets (cascade delete); User/Admin → one Preference

## File Upload Pattern

Supabase Storage is used for evidence and profile pictures. The flow:
1. Client requests a signed upload URL via `POST /evidence/upload-url` or `POST /profile-picture/upload-url` — files land in `temp/`
2. After report creation or profile update, the backend moves files to permanent storage (`permanent/<reportId>/` for evidence)
3. Report creation is transactional — if the DB insert fails, evidence files are not moved

Upload handlers use a factory: `createSignedUrlHandler(bucket)` and `updateProfilePictureHandler(table)` in `src/controllers/upload.controller.ts`.

Bucket names are type-safe: only `evidence_assets` or `profile_pictures` are valid.

## Validation

All request bodies pass through Zod validators before reaching controllers. Errors are returned as flattened field errors with HTTP 400. Validators are co-located with their feature in `src/utils/validators/`.

## Key Conventions

- ESM imports use `.js` extension even for `.ts` source files (TypeScript `bundler` module resolution)
- File names: `[feature].[layer].ts` (e.g. `auth.controller.ts`, `report.route.ts`)
- Prettier: single quotes, trailing commas, 80-char width, 2-space indent
- Database enum values and report status use `UPPER_SNAKE_CASE`
- Uploaded file names are sanitized: non-alphanumeric chars replaced with `_`

## API Specification

`safespace-api.json` at the root is a complete OpenAPI 3.0.0 spec for all endpoints.
