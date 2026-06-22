# ClassMind — Free Deployment Guide

This guide will help you deploy ClassMind to free hosting platforms so you can use it without running it locally.

---

## 📋 Overview

We'll deploy to these **completely free** platforms:

| Component | Platform | Why? |
|-----------|----------|------|
| **Frontend** (React + Vite) | Vercel | Instant deployment, optimal Vite support |
| **Backend** (Express API) | Render | Free tier with 750 hours/month |
| **Database** (PostgreSQL) | Neon | Free PostgreSQL with 3GB storage |

**Total Cost:** $0 per month (within free tier limits)

---

## 🚀 Step 1: Prepare Your Code for Deployment

### 1.1 Update Frontend Environment

Edit [artifacts/classroom-assistant/src/main.tsx](artifacts/classroom-assistant/src/main.tsx):

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Use this in your fetch calls:
fetch(`${API_BASE_URL}/courses`);
```

Create [artifacts/classroom-assistant/.env.production](artifacts/classroom-assistant/.env.production):

```env
VITE_API_URL=https://your-backend-url.onrender.com/api
```

### 1.2 Build the Frontend

```bash
cd artifacts/classroom-assistant
pnpm run build
```

This creates a `dist/` folder ready for deployment.

### 1.3 Prepare Backend for Deployment

Ensure your [artifacts/api-server/package.json](artifacts/api-server/package.json) has a start script:

```json
{
  "scripts": {
    "build": "node ./build.mjs",
    "start": "node --enable-source-maps --env-file=.env ./dist/index.mjs",
    "dev": "pnpm run build && pnpm run start"
  }
}
```

---

## 🗄️ Step 2: Set Up Free Database (Neon)

### 2.1 Create Neon Account

1. Go to [console.neon.tech](https://console.neon.tech)
2. Sign up with GitHub (easiest)
3. Create a new project named `classmind`

### 2.2 Get Connection String

1. In Neon console, click **Connection String**
2. Select **Pooled connection** (required for serverless)
3. Copy the full connection string

Example format:
```
postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/classmind?sslmode=require
```

### 2.3 Initialize Database Schema

In your local terminal:

```bash
# Set Neon connection as DATABASE_URL
$env:DATABASE_URL = "postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/classmind?sslmode=require"

# Run migrations
pnpm -w exec drizzle-kit sync

# Or use the provided schema (if available)
# psql -d "your-neon-url" -f lib/db/schema.sql
```

---

## 🎨 Step 3: Deploy Frontend (Vercel)

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub

### 3.2 Deploy from GitHub

**Option A: Using Git (Recommended)**

1. Push your code to GitHub (already done ✓)
2. In Vercel dashboard, click **New Project**
3. Select **GF_GoogleClassroom_Friend** repository
4. Framework Preset: **Vite**
5. Root Directory: `artifacts/classroom-assistant`
6. Build Command: `pnpm run build`
7. Output Directory: `dist`

**Environment Variables:**
- Add `VITE_API_URL`: `https://your-backend-url.onrender.com/api` (after backend deploy)

8. Click **Deploy** ✨

**Option B: Manual Deployment**

```bash
npm install -g vercel
cd artifacts/classroom-assistant
vercel --prod
```

### 3.3 Configure Custom Domain (Optional)

In Vercel → Settings → Domains, add your custom domain.

---

## 🔌 Step 4: Deploy Backend (Render)

### 4.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### 4.2 Create Web Service

1. Dashboard → **New +** → **Web Service**
2. Select your GitHub repo
3. Configure:
   - **Name:** `classmind-api`
   - **Environment:** `Node`
   - **Region:** Choose closest to you
   - **Branch:** `main`
   - **Build Command:** `pnpm install && pnpm run build`
   - **Start Command:** `pnpm start`

### 4.3 Set Environment Variables

In Render → Environment:

```
GOOGLE_CLIENT_ID=your_google_client_id_from_cloud_console
GOOGLE_CLIENT_SECRET=your_google_client_secret_from_cloud_console
GOOGLE_REDIRECT_URI=https://classmind-api.onrender.com/api/auth/google/callback
DATABASE_URL=postgresql://user:password@ep-xyz.ap-southeast-1.aws.neon.tech/classmind?sslmode=require
ENCRYPTION_KEY=your_encryption_key_hex_32_chars
JWT_SECRET=your_jwt_secret_hex_32_chars
JWT_REFRESH_SECRET=your_jwt_refresh_secret_hex_32_chars
GROQ_API_KEY=your_groq_api_key_from_console
SESSION_SECRET=your_session_secret_min_32_characters
PORT=10000
NODE_ENV=production
BASE_PATH=/api
```

> ⚠️ **Important:** Replace these placeholder values with your actual credentials from:
> - Google Cloud Console (OAuth credentials)
> - Groq Console (API key)
> - Generate security keys with: `openssl rand -hex 32`

### 4.4 Deploy

Click **Create Web Service**. Render will automatically deploy when you push to `main`.

Your backend will be available at: `https://classmind-api.onrender.com`

---

## 🔐 Step 5: Update Google OAuth Settings

### 5.1 Update Redirect URI in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Select your project
3. APIs & Services → Credentials
4. Click your OAuth 2.0 Client ID
5. Update **Authorized redirect URIs**:

```
http://localhost:5000/api/auth/google/callback          (local development)
https://classmind-api.onrender.com/api/auth/google/callback     (production)
```

6. Click **Save**

### 5.2 Update CORS Settings

In [artifacts/api-server/src/app.ts](artifacts/api-server/src/app.ts), ensure CORS includes:

```typescript
const corsOptions = {
  origin: [
    'http://localhost:3000',                    // Local dev
    'https://your-vercel-domain.vercel.app',   // Production
    'https://your-custom-domain.com'            // Custom domain
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

## 🔧 Step 6: Post-Deployment Configuration

### 6.1 Update Frontend API URL

In Vercel Dashboard → Settings → Environment Variables:

Add after backend is deployed:
```
VITE_API_URL=https://classmind-api.onrender.com/api
```

Redeploy frontend.

### 6.2 Test the Deployment

1. **Frontend:** Visit `https://your-app.vercel.app`
2. **Backend Health:** Visit `https://classmind-api.onrender.com/api/health`
3. **Try Login:** Click "Sign in with Google"

### 6.3 Monitor Deployments

- **Vercel:** Dashboard → Deployments
- **Render:** Dashboard → Recent deploys

---

## 📱 Final URLs

Once deployed, your app will be at:

```
Frontend:  https://your-app.vercel.app
Backend:   https://classmind-api.onrender.com/api
Database:  Neon PostgreSQL (managed)
```

---

## 🎯 Free Tier Limits & Considerations

### Vercel
- ✅ Free tier includes unlimited deployments
- ✅ No credit card required (but optional)
- ⚠️ Deployments must be < 50MB

### Render
- ✅ Free tier: 750 compute hours/month (~1 instance 24/7)
- ⚠️ Services sleep after 15 mins of inactivity (30 sec cold start)
- ⚠️ ~1GB RAM free tier
- 💡 Upgrade to Starter ($7/mo) for always-on

### Neon
- ✅ Free tier: 3GB storage, 1 project
- ✅ Always-on PostgreSQL
- ⚠️ Limited to 10 connections per project

---

## 🚨 Troubleshooting

### Cold Start Issues on Render

**Problem:** API takes 30+ seconds to respond after inactivity

**Solution:** Upgrade to Starter plan ($7/mo) or add a uptime monitoring service:

```bash
# Use services like:
# - UptimeRobot (free tier)
# - Healthchecks.io (free tier)
```

### CORS Errors

**Problem:** Frontend can't call backend

**Solution:** Check CORS configuration in [artifacts/api-server/src/app.ts](artifacts/api-server/src/app.ts)

```typescript
// Add your Vercel domain:
origin: ['https://your-app.vercel.app']
```

### Database Connection Issues

**Problem:** Can't connect to Neon

**Solution:**
1. Verify connection string in Render env vars
2. Ensure `?sslmode=require` is in URL
3. Check Neon dashboard for active connections

---

## 📝 Deployment Checklist

- [ ] Database initialized on Neon
- [ ] Frontend built: `pnpm run build` from `artifacts/classroom-assistant`
- [ ] GitHub repo updated with latest code
- [ ] Frontend deployed on Vercel
- [ ] Backend deployed on Render
- [ ] Google OAuth redirect URIs updated
- [ ] Environment variables set in Render
- [ ] Environment variables set in Vercel
- [ ] CORS origins updated in backend
- [ ] API endpoint URL updated in frontend
- [ ] Login flow tested
- [ ] Calendar sync tested

---

## 💰 Cost Summary

| Service | Free Tier | Cost |
|---------|-----------|------|
| Vercel | Unlimited | **$0** |
| Render | 750 hrs/month | **$0** (or $7/mo for always-on) |
| Neon | 3GB storage | **$0** |
| Google Classroom API | Free | **$0** |
| Groq API | Free tier available | **$0** |
| **Total** | | **$0 - $7/month** |

---

## 🎓 Next Steps

1. **Monitor Usage:** Check Render dashboard for resource usage
2. **Set Up Alerts:** Configure email alerts for deploy failures
3. **Custom Domain:** Point your domain to Vercel (optional)
4. **Analytics:** Add Google Analytics to track usage
5. **Backups:** Set up daily Neon backups (paid feature, but consider it)

---

## 📚 Additional Resources

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Express Deployment Guide](https://expressjs.com/en/advanced/best-practice-performance.html)

---

**Questions?** Check the troubleshooting section or open an issue on GitHub!
