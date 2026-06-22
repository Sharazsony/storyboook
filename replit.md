# ClassMind — Smart Academic Assistant

A web app that connects to Google Classroom, uses AI (Groq) to extract academic events (quizzes, exams, vivas, assignments) from course announcements, and syncs them to Google Calendar.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Auth: Google OAuth 2.0 (express-session)
- AI: Groq API (llama3-70b-8192)
- Google APIs: Classroom (read announcements), Calendar (create events)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + TailwindCSS + shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — API contract source of truth
- `lib/db/src/schema/users.ts` — users table (Google OAuth tokens stored here)
- `lib/db/src/schema/events.ts` — academic events table
- `artifacts/api-server/src/routes/auth.ts` — Google OAuth flow
- `artifacts/api-server/src/routes/courses.ts` — Classroom sync + AI processing
- `artifacts/api-server/src/routes/events.ts` — event CRUD + Calendar sync
- `artifacts/api-server/src/lib/google.ts` — OAuth2 client factory
- `artifacts/api-server/src/lib/groq.ts` — AI event extraction
- `artifacts/classroom-assistant/src/` — React frontend

## Architecture decisions

- Google OAuth tokens (access + refresh) stored per-user in PostgreSQL — no separate token store needed
- Announcements are deduped by `announcement_id` so repeated syncs don't create duplicates
- AI extraction skips events with confidence < 0.4 to reduce noise
- Calendar sync happens automatically during classroom sync if a date is detected, and can also be triggered manually per event
- Session stored in express-session (memory store in dev); should use a persistent store in production

## Product

- Login with Google (requires Classroom + Calendar scopes)
- Dashboard: upcoming events in 14 days, event type breakdown, courses list
- Events page: full filterable event list with per-event calendar sync and delete
- Sync button: fetches all active courses, processes announcements through Groq AI, creates calendar events

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Google OAuth redirect URI must be configured in Google Cloud Console. In development, add: `https://<your-replit-dev-domain>/api/auth/google/callback`. In production, add the deployed domain.
- Classroom API requires the app to be authorized by the user. First-time users will see a consent screen.
- The `SESSION_SECRET` env var is required — it's already set as a Replit secret.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GROQ_API_KEY` must be set (already configured as secrets).
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
