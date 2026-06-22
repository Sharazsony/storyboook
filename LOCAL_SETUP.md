# ClassMind — Local Development Guide (VS Code + GitHub Copilot)

> **For GitHub Copilot / AI Agents:** This document is the single source of truth.
> Do NOT suggest alternative tools, frameworks, or package managers.
> Every technology choice in this project is FIXED. Follow instructions exactly as written.

---

## Tech Stack (Fixed — Do Not Change)

| Layer | Technology | Version |
|---|---|---|
| Runtime | Node.js | **24.x** |
| Package Manager | **pnpm** only | 10.x |
| Monorepo | pnpm workspaces | — |
| Language | TypeScript | ~5.9.3 |
| API Server | Express | 5 |
| Database | PostgreSQL + Drizzle ORM | — |
| Auth | Google OAuth 2.0 + express-session | — |
| AI | Groq API (`llama-3.3-70b-versatile`) | — |
| Google APIs | Classroom v1, Calendar v3 | — |
| Frontend | React 19 + Vite 7 + TailwindCSS 4 + shadcn/ui | — |
| Validation | Zod v4 (`zod/v4`) + drizzle-zod | — |
| API Contract | OpenAPI 3.1 → Orval codegen | — |
| Build | esbuild (CJS bundle via `build.mjs`) | 0.27.3 |

**Do NOT substitute:** npm, yarn, bun, Prisma, Next.js, NestJS, Fastify, Mongoose, dotenv packages, or any alternative to the above.

---

## Prerequisites

Install these **before** cloning:

1. **Node.js 24** — https://nodejs.org/en/download (select v24 LTS)
   ```
   node --version   # must show v24.x.x
   ```

2. **pnpm 10** — install globally via Node.js corepack:
   ```
   corepack enable
   corepack prepare pnpm@latest --activate
   pnpm --version   # must show 10.x.x
   ```

3. **PostgreSQL 15+** — running locally
   - macOS: `brew install postgresql@15 && brew services start postgresql@15`
   - Windows: https://www.postgresql.org/download/windows/
   - Linux: `sudo apt install postgresql`
   - Create a database:
     ```sql
     createdb classmind
     ```
   - Your connection string will be: `postgresql://localhost:5432/classmind`

---

## Step 1 — Clone and Fix Platform Overrides

```bash
git clone <your-repo-url>
cd classmind
```

> **CRITICAL for macOS and Windows users:**
> The `pnpm-workspace.yaml` has Linux-only platform overrides for esbuild, rollup, and lightningcss.
> These will cause `pnpm install` to fail on your machine.
> You must remove them before installing.

Open `pnpm-workspace.yaml` and **delete the entire `overrides:` block** (lines starting with `overrides:` down to the end of the file). Replace it with just:

```yaml
overrides:
  "@esbuild-kit/esm-loader": "npm:tsx@^4.21.0"
  esbuild: "0.27.3"
```

This keeps the two important overrides (esbuild version pin and esm-loader fix) but removes all the Linux-only platform exclusions.

---

## Step 2 — Install Dependencies

```bash
pnpm install
```

This installs all packages across all workspace packages at once. Do not run `npm install` or `yarn install`.

---

## Step 3 — Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

If `.env.example` doesn't exist, create `artifacts/api-server/.env` manually:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://localhost:5432/classmind

# Google OAuth 2.0 — get from Google Cloud Console
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Groq AI API key — get from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Session secret — any long random string (32+ chars)
SESSION_SECRET=your_super_secret_session_key_min_32_characters_long
```

> The API server reads env vars via `process.env["VAR_NAME"]`.
> Do NOT use dotenv package — the server uses Node.js native `--env-file` or the vars are expected in the shell environment.

Load the env file when starting the server:
```bash
# The dev command in artifacts/api-server/package.json handles this automatically
```

Actually, set them in your shell or use a `.env` loader. The simplest approach for local dev:
```bash
export $(cat artifacts/api-server/.env | xargs)
```

Or add them to your shell profile (`~/.zshrc`, `~/.bashrc`, etc.).

---

## Step 4 — Google Cloud Console Setup

You need a Google Cloud project with OAuth credentials.

1. Go to https://console.cloud.google.com
2. Create a new project (or use existing)
3. Enable these APIs:
   - **Google Classroom API**
   - **Google Calendar API**
4. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add Authorized redirect URIs:
   ```
   http://localhost:5000/api/auth/google/callback
   ```
7. Copy the **Client ID** and **Client Secret** into your `.env`
8. Go to **APIs & Services → OAuth consent screen**:
   - Add your Google account email as a **Test user**
   - Add these scopes:
     - `email`, `profile`, `openid`
     - `https://www.googleapis.com/auth/classroom.courses.readonly`
     - `https://www.googleapis.com/auth/classroom.announcements.readonly`
     - `https://www.googleapis.com/auth/calendar.events`

---

## Step 5 — Database Setup

Push the schema to your local PostgreSQL (creates the tables):

```bash
pnpm --filter @workspace/db run push
```

This runs Drizzle Kit's `push` command using the `DATABASE_URL` from your environment.

Tables created:
- `users` — Google OAuth user accounts with stored access/refresh tokens
- `events` — extracted academic events (quiz, exam, viva, assignment, presentation)

---

## Step 6 — Build Shared Libraries

The monorepo has shared TypeScript libraries that must be compiled before the API server starts:

```bash
pnpm run typecheck:libs
```

This builds:
- `lib/db` — Drizzle schema + database client
- `lib/api-spec` — OpenAPI spec + Orval-generated code
- `lib/api-zod` — Zod validation schemas
- `lib/api-client-react` — React Query hooks

---

## Step 7 — Run the Application

You need **two terminals** running simultaneously:

### Terminal 1 — API Server (port 5000)
```bash
cd artifacts/api-server
PORT=5000 BASE_PATH=/api pnpm run dev
```

### Terminal 2 — Frontend (port 3000)
```bash
cd artifacts/classroom-assistant
PORT=3000 BASE_PATH=/ pnpm run dev
```

Then open: **http://localhost:3000**

> `PORT` and `BASE_PATH` are required env vars for the build system.
> Without them, the build will fail.

---

## Project Structure

```
classmind/
├── artifacts/
│   ├── api-server/                  ← Express 5 API server
│   │   ├── src/
│   │   │   ├── app.ts               ← Express app setup (session, cors, middleware)
│   │   │   ├── index.ts             ← Server entry point (binds PORT)
│   │   │   ├── lib/
│   │   │   │   ├── google.ts        ← OAuth2 client factory + SCOPES
│   │   │   │   ├── groq.ts          ← AI event extraction (llama-3.3-70b-versatile)
│   │   │   │   └── logger.ts        ← Pino logger singleton
│   │   │   ├── middlewares/
│   │   │   │   └── auth.ts          ← requireAuth middleware
│   │   │   └── routes/
│   │   │       ├── auth.ts          ← GET /api/auth/me, /google, /google/callback, /logout
│   │   │       ├── courses.ts       ← GET /api/courses, POST /api/courses/sync
│   │   │       ├── events.ts        ← GET/DELETE /api/events, POST /api/events/:id/calendar
│   │   │       └── health.ts        ← GET /api/healthz
│   │   └── build.mjs                ← esbuild bundler script
│   │
│   └── classroom-assistant/         ← React + Vite frontend
│       └── src/
│           ├── pages/
│           │   ├── login.tsx        ← Sign in with Google page
│           │   ├── dashboard.tsx    ← Overview: stats + recent events + courses
│           │   └── events.tsx       ← All events with filter/search/delete/sync
│           ├── components/
│           │   ├── layout/Shell.tsx ← Sidebar navigation wrapper
│           │   └── shared/
│           │       ├── EventCard.tsx       ← Individual event card
│           │       └── EventTypeBadge.tsx  ← Colored badge (quiz/exam/viva/etc)
│           └── hooks/use-toast.ts   ← Toast notification hook
│
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml             ← API contract (source of truth — edit this first)
│   ├── api-client-react/            ← Generated React Query hooks (DO NOT EDIT)
│   ├── api-zod/                     ← Generated Zod schemas (DO NOT EDIT)
│   └── db/
│       └── src/schema/
│           ├── users.ts             ← users table definition
│           └── events.ts            ← events table definition
│
├── pnpm-workspace.yaml              ← Workspace packages + catalog + overrides
├── tsconfig.base.json               ← Shared TypeScript strict config
├── tsconfig.json                    ← Root solution file (composite libs only)
└── package.json                     ← Root task scripts
```

---

## Key Architecture Decisions

### Authentication Flow
1. User visits `/api/auth/google` → redirected to Google OAuth consent
2. Google redirects to `/api/auth/google/callback` with auth code
3. Server exchanges code for access + refresh tokens
4. Tokens stored in `users` table (no separate token store)
5. Session cookie (`express-session`) tracks the logged-in user
6. All API routes use `requireAuth` middleware that reads `req.session.userId`

### Classroom → Calendar Flow
```
POST /api/courses/sync
  → Google Classroom API: list active courses
  → For each course: fetch 30 latest announcements
  → For each announcement: call Groq AI (llama-3.3-70b-versatile)
  → AI returns: [{event_type, title, date, confidence}]  ← can be multiple per announcement
  → Filter: confidence >= 0.4
  → Save to events table (dedup by announcementId + event_type)
  → If date found: auto-create Google Calendar event with color + emoji + reminders
```

### Calendar Event Colors
| Event Type | Emoji | Google Calendar Color |
|---|---|---|
| quiz | 📝 | Yellow (5) |
| exam | 📚 | Tomato/Red (11) |
| viva | 🎤 | Grape/Purple (3) |
| assignment | 📋 | Sage/Green (2) |
| presentation | 🖥️ | Tangerine/Orange (6) |
| other | 📌 | Peacock/Cyan (7) |

### Session Cookie — Local vs Replit
The `app.ts` sets `cookie.secure: true` and `trust proxy: 1` because Replit always uses HTTPS.

**For local development**, you must change `app.ts` temporarily:
```typescript
cookie: {
  secure: process.env["NODE_ENV"] === "production",  // false in local dev
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: "lax",
},
```

---

## Codegen — When to Run

If you change `lib/api-spec/openapi.yaml`, regenerate the React hooks and Zod schemas:
```bash
pnpm --filter @workspace/api-spec run codegen
```

Generated files (DO NOT edit manually):
- `lib/api-client-react/src/` — Orval-generated React Query hooks
- `lib/api-zod/src/` — Orval-generated Zod schemas

---

## Common Commands

```bash
# Install all dependencies
pnpm install

# Full typecheck (libs + all artifacts)
pnpm run typecheck

# Typecheck libs only (fast)
pnpm run typecheck:libs

# Typecheck a specific artifact
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/classroom-assistant run typecheck

# Push DB schema changes (dev only, never production)
pnpm --filter @workspace/db run push

# Regenerate API client after openapi.yaml changes
pnpm --filter @workspace/api-spec run codegen
```

---

## Troubleshooting

### `pnpm install` fails with "No matching platform"
You forgot to remove the Linux-only platform overrides. See **Step 1**.

### `SESSION_SECRET environment variable is required`
The API server explicitly throws if SESSION_SECRET is missing. Make sure your `.env` is loaded and SESSION_SECRET is set to any string of 32+ characters.

### Google OAuth `redirect_uri_mismatch`
The redirect URI in Google Cloud Console must exactly match what the server sends.
- Local: `http://localhost:5000/api/auth/google/callback`
- No trailing slash, no HTTPS for localhost

### `Cannot find module '@workspace/db'`
Run `pnpm run typecheck:libs` first to build the shared libraries.

### Cookie not being set / always logged out
For local dev, `cookie.secure` must be `false` (HTTP localhost). See the Session Cookie section above.

### Groq API returns 400
The model must be `llama-3.3-70b-versatile`. Do not use `llama3-70b-8192` (deprecated).

### Database connection refused
Make sure PostgreSQL is running and `DATABASE_URL` points to the correct host/port/database.
```bash
psql postgresql://localhost:5432/classmind   # test the connection
```

---

## For GitHub Copilot — Hard Rules

1. **Package manager is pnpm only.** Never suggest `npm install` or `yarn add`.
2. **Import paths use workspace aliases** (`@workspace/db`, `@workspace/api-zod`, etc.). Never use relative `../../lib/...` paths for cross-package imports.
3. **Never edit generated files** in `lib/api-client-react/` or `lib/api-zod/`. Edit `openapi.yaml` then run codegen.
4. **Zod imports use `zod/v4`**, not `zod`. Example: `import { z } from "zod/v4"`.
5. **No console.log in server code.** Use `req.log` in route handlers, `logger` (from `./lib/logger`) elsewhere.
6. **Express 5 syntax**: route handlers return `Promise<void>` and use `res.json()` / `res.sendStatus()`. No `next(err)` error passing pattern — handle errors with try/catch inside the handler.
7. **Database queries use Drizzle ORM only.** Never write raw SQL strings. Use `db.select().from(table).where(...)`.
8. **All new API routes must be added to `openapi.yaml` first**, then run codegen, then implement the route.
9. **Session data**: user ID is stored at `req.session.userId` (number). The `requireAuth` middleware populates `req.user` (full user row from DB).
10. **esbuild version is pinned to 0.27.3.** Do not change it.
