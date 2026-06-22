# ClassMind — AI-Powered Google Classroom Assistant

> A modern, full-stack web application that enhances Google Classroom with AI-powered features. Get intelligent event summaries, personalized course insights, and seamless calendar integration powered by Groq's LLaMA AI.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js)
![pnpm](https://img.shields.io/badge/pnpm-10-F69220?logo=pnpm)

akash added new feature kinldy see it 

## 🌟 Features

- **Google Classroom Integration** — Seamlessly sync your courses and announcements
- **Smart Event Summaries** — AI-powered event summaries using Groq's LLaMA 3.3-70B
- **Calendar Integration** — Automatic Google Calendar event creation and management
- **Secure Authentication** — Google OAuth 2.0 with encrypted session management
- **Real-time Dashboard** — Monitor courses, events, and announcements in one place
- **Type-Safe API** — OpenAPI 3.1 schema with auto-generated TypeScript clients
- **Modern UI** — React 19 + TailwindCSS 4 with shadcn/ui components
- **Database-Driven** — PostgreSQL with Drizzle ORM for type-safe queries

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Runtime** | Node.js | 24.x |
| **Package Manager** | pnpm | 10.x |
| **Language** | TypeScript | ~5.9.3 |
| **Backend** | Express | 5 |
| **Database** | PostgreSQL + Drizzle ORM | 15+ |
| **Authentication** | Google OAuth 2.0 + express-session | — |
| **AI Engine** | Groq API (llama-3.3-70b-versatile) | — |
| **Google APIs** | Classroom v1, Calendar v3 | — |
| **Frontend** | React 19 + Vite 7 + TailwindCSS 4 + shadcn/ui | — |
| **Validation** | Zod v4 + drizzle-zod | — |
| **API Contract** | OpenAPI 3.1 → Orval codegen | — |
| **Build Tool** | esbuild | 0.27.3 |

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Node.js 24.x** — [Download](https://nodejs.org/en/download)
   ```bash
   node --version   # must show v24.x.x
   ```

2. **pnpm 10.x** — Install globally via corepack:
   ```bash
   corepack enable
   corepack prepare pnpm@latest --activate
   pnpm --version   # must show 10.x.x
   ```

3. **PostgreSQL 15+** — Running locally
   - **macOS**: `brew install postgresql@15 && brew services start postgresql@15`
   - **Windows**: [Download PostgreSQL](https://www.postgresql.org/download/windows/)
   - **Linux**: `sudo apt install postgresql`

4. **Google Cloud OAuth Credentials** — [Set up here](https://console.cloud.google.com)

5. **Groq API Key** — [Get free access](https://console.groq.com)

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Sharazsony/GF_GoogleClassroom_Friend.git
cd GF_GoogleClassroom_Friend
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in `artifacts/api-server/`:

```bash
cp artifacts/api-server/.env.example artifacts/api-server/.env
```

Fill in your credentials:

```env
# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/classmind

# Session & Security
SESSION_SECRET=your-super-secret-session-key-min-32-chars
ENCRYPTION_KEY=your-encryption-key-hex-64-chars
JWT_SECRET=your-jwt-secret-hex-64-chars
JWT_REFRESH_SECRET=your-jwt-refresh-secret-hex-64-chars

# AI & External APIs
GROQ_API_KEY=your_groq_api_key_here

# Server Config
PORT=5000
NODE_ENV=development
```

### 4. Initialize the Database

```bash
pnpm -w exec node lib/db/init-db.mjs
```

### 5. Run the Development Servers

**Terminal 1 — API Server:**
```bash
cd artifacts/api-server
pnpm run dev
# API available at http://localhost:5000/api
```

**Terminal 2 — Frontend:**
```bash
cd artifacts/classroom-assistant
pnpm run dev
# Frontend available at http://localhost:3000
```

---

## 📁 Project Structure

```
Smart-Asset-Manager/
├── artifacts/
│   ├── api-server/                 # Express backend API
│   │   ├── src/
│   │   │   ├── app.ts             # Express app setup
│   │   │   ├── routes/            # API routes (auth, courses, events)
│   │   │   ├── middlewares/       # Auth & CORS middleware
│   │   │   └── lib/               # Google APIs, Groq integration
│   │   └── package.json
│   │
│   └── classroom-assistant/        # React frontend
│       ├── src/
│       │   ├── components/        # React components (UI, layout)
│       │   ├── pages/             # Page components (dashboard, login, events)
│       │   ├── hooks/             # Custom React hooks
│       │   └── lib/               # Utilities & helpers
│       └── package.json
│
├── lib/
│   ├── api-client-react/          # Auto-generated API client (Orval)
│   ├── api-spec/                  # OpenAPI 3.1 specification
│   ├── api-zod/                   # Zod validation schemas
│   └── db/                        # Database schema & Drizzle ORM
│
├── scripts/                         # Utility scripts
├── package.json                     # Root workspace config
├── pnpm-workspace.yaml             # Monorepo configuration
└── tsconfig.json                   # TypeScript config
```

---

## 🔧 Available Scripts

### Root Level
```bash
pnpm build              # Build all packages
pnpm typecheck          # Type-check all TypeScript files
pnpm typecheck:libs     # Type-check library packages only
```

### API Server
```bash
cd artifacts/api-server
pnpm run dev            # Start with hot-reload
pnpm run build          # Build for production
pnpm run start          # Run built server
pnpm run typecheck      # Check TypeScript
```

### Frontend
```bash
cd artifacts/classroom-assistant
pnpm run dev            # Start dev server
pnpm run build          # Build for production
pnpm run preview        # Preview production build
pnpm run typecheck      # Check TypeScript
```

---

## 🔐 Authentication Flow

1. User clicks "Sign in with Google" on login page
2. Redirected to Google OAuth consent screen
3. After authorization, Google redirects to `/api/auth/google/callback`
4. API server validates token and creates encrypted session
5. JWT token issued and stored in secure HttpOnly cookie
6. Frontend uses JWT for subsequent API requests

---

## 🤖 AI Integration

ClassMind leverages **Groq's LLaMA 3.3-70B** for intelligent event processing:

- **Event Summarization** — Automatically summarize classroom announcements
- **Smart Insights** — Generate personalized course summaries
- **Natural Language Processing** — Extract key information from events

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` — Initiate Google OAuth flow
- `GET /api/auth/google/callback` — OAuth callback handler
- `POST /api/auth/logout` — Logout and clear session

### Courses
- `GET /api/courses` — List all courses
- `GET /api/courses/:id` — Get course details

### Events
- `GET /api/events` — List calendar events
- `GET /api/events/:id` — Get event details
- `POST /api/events` — Create event

### Health
- `GET /api/health` — Server health check

See [API Documentation](artifacts/api-server/README.md) for detailed endpoints.

---

## 🧪 Development

### Adding New Dependencies

```bash
# Add to root workspace
pnpm add -D package-name

# Add to specific workspace
pnpm --filter=@workspace/api-server add package-name
pnpm --filter=@workspace/classroom-assistant add package-name
```

### Updating Schemas

1. Modify OpenAPI schema in `lib/api-spec/openapi.yaml`
2. Run codegen: `pnpm -w exec orval`
3. Schemas auto-generate in `lib/api-zod/src/generated/`
4. API client auto-generates in `lib/api-client-react/src/generated/`

### Database Migrations

1. Modify schema in `lib/db/src/schema/`
2. Sync with database:
   ```bash
   pnpm -w exec drizzle-kit sync
   ```

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- TypeScript types are correct (`pnpm typecheck`)
- Code is formatted properly
- Tests pass (if applicable)

---

## 📝 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) file for details.

---

## 🙋 Support

For issues, questions, or suggestions:

1. **GitHub Issues** — [Create an issue](https://github.com/Sharazsony/GF_GoogleClassroom_Friend/issues)
2. **Discussions** — [Start a discussion](https://github.com/Sharazsony/GF_GoogleClassroom_Friend/discussions)
3. **Contact** — Reach out to the maintainers

---

## 📚 Additional Resources

- [Google Classroom API](https://developers.google.com/classroom)
- [Google Calendar API](https://developers.google.com/calendar)
- [Groq API Docs](https://console.groq.com/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Zod Validation](https://zod.dev)

---

**Made with ❤️ by ClassMind Team**
