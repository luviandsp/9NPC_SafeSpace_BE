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
├── routes/                    # auth, report, user, admin, notification route files
├── controllers/               # auth, report, user, admin, upload, notification controllers
└── utils/
    ├── validators/            # Zod validation schemas per feature
    ├── pdf.utils.ts           # generateReportPdf — writes report fields to a PDFDocument
    ├── history.utils.ts       # recordStatusHistory — inserts to report_status_history (try-catch wrapped)
    └── notification.utils.ts  # createNotification / createNotificationsForAdmins (try-catch wrapped)
```

**Route prefixes:**
- `/api/auth` — public (sign-up, sign-in, password reset) + some guarded endpoints
- `/api/report` — requires `requireAuth`
- `/api/user` — requires `requireAuth`
- `/api/admin` — requires `requireAdmin` (checks `user_metadata.role === 'ADMIN'`)
- `/api/notifications` — requires `requireAuth` (works for both user and admin)

## Database Schema

Drizzle ORM with PostgreSQL (Supabase). Migrations live in `supabase/migrations/`.

Key tables: `user`, `admin`, `report`, `evidence_asset`, `preference`, `report_status_history`, `notification`

Report status enum: `RECEIVED → PROCESS → REVIEW → ASSISTANCE → DONE` (or `REJECTED` / `CANCELLED`)

Relations: User → Reports (cascade delete) → EvidenceAssets (cascade delete); Report → StatusHistory (cascade delete); User/Admin → one Preference

**`report_status_history`** — auto-recorded on every status change. Fields: `reportId` (FK), `oldStatus` (null on first record), `newStatus`, `changedBy` (plain UUID, no FK — can be user or admin), `changedByRole` (`USER`/`ADMIN`/`SYSTEM`), `notes`, `createdAt`. Insert is try-catch wrapped so failures never break the main operation.

**`notification`** — fan-out notifications for key events. Fields: `recipientId` (plain UUID, no FK), `recipientRole` (`USER`/`ADMIN`), `type`, `title`, `message`, `relatedId` (nullable report ID), `isRead` (default false), `createdAt`. Composite index on `(recipientId, recipientRole)`. Insert is try-catch wrapped.

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

## Report Endpoints (beyond CRUD)

These endpoints extend `POST /api/report/create` and are all under `/api/report`:

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/:id/evidence` | Add evidence to an existing report. Body: `{ evidencePaths: string[] }` (min 1, max 5). Moves files from `temp/` to `permanent/<reportId>/`. Owner only. |
| `GET` | `/:id/download` | Stream report as PDF (pdfkit). Owner or admin. Filename: `laporan-<reportCode>.pdf`. |
| `GET` | `/:id/history` | Return status change timeline DESC. Each row includes `changedByName` resolved from `user`/`admin` tables. Owner or admin. |

## Notification Endpoints

All under `/api/notifications`, requires `requireAuth`:

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | List notifications for the logged-in user/admin. Query params: `?page`, `?limit`, `?unread=true`. |
| `GET` | `/unread-count` | Return `{ count: number }` of unread notifications. |
| `PATCH` | `/read-all` | Mark all notifications as read. Returns `{ count: number }` of rows updated. |
| `PATCH` | `/:id/read` | Mark a single notification as read. Owner only (403 otherwise). |

**Auto-notification triggers:**
- User creates report → notify all admins (`NEW_REPORT_SUBMITTED`)
- Admin updates status → notify report owner (`REPORT_STATUS_CHANGED`)
- User cancels report → notify all admins (`REPORT_CANCELLED`)

## API Specification

`safespace-api.json` at the root is a complete OpenAPI 3.0.0 spec for all endpoints.
